"use server";

import Anthropic from "@anthropic-ai/sdk";
import vision from "@google-cloud/vision";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
type Item = { name: string; amount: string; category: string };

function createVisionClient() {
  const encoded = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS;
  if (!encoded) throw new Error("GOOGLE_CLOUD_VISION_CREDENTIALS が設定されていません");
  const credentials = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
  return new vision.ImageAnnotatorClient({ credentials });
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const client = createVisionClient();
  const base64 = buffer.toString("base64");
  const [result] = await client.documentTextDetection({ image: { content: base64 } });
  return result.fullTextAnnotation?.text ?? "";
}

export async function parseReceiptImage(formData: FormData): Promise<{
  storeName: string;
  date: string;
  totalAmount: string;
  items: Item[];
}> {
  const file = formData.get("image") as File;
  if (!file || file.size === 0) throw new Error("画像が選択されていません");

  const supabase = await createClient();
  const { data: customCategories } = await supabase
    .from("custom_categories")
    .select("id, name")
    .order("created_at");

  const allCategories = [
    ...Object.entries(CATEGORIES).map(([key, { label }]) => ({ id: key, label })),
    ...(customCategories ?? []).map(({ id, name }: { id: string; name: string }) => ({ id, label: name })),
  ];
  const validCategoryIds = new Set(allCategories.map(({ id }) => id));
  const categoryList = allCategories.map(({ id, label }) => `- ${id}: ${label}`).join("\n");

  const buffer = Buffer.from(await file.arrayBuffer());
  const ocrText = await extractTextFromImage(buffer);

  if (!ocrText.trim()) throw new Error("レシートのテキストを読み取れませんでした");

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `以下はレシートをOCRで読み取ったテキストです。構造化して返してください。

【ルール】
- 商品名はテキストから読み取った名称を自然な日本語に整えること
- 各商品の金額は税込単価または小計（数字のみ）を使用すること
- 「小計」「消費税」「合計」「お釣り」などの集計行は items に含めないこと
- totalAmount にはレシートの「合計」「税込合計」「お支払い金額」の値を入れること。見つからない場合は items の金額合計を返すこと
- 日付はYYYY-MM-DD形式で返すこと

使用できるカテゴリ（categoryには必ずこの一覧のIDをそのまま返すこと）:
${categoryList}

以下のJSON形式のみ返してください。余計な文章は不要です：
{
  "storeName": "店舗名（不明なら空文字）",
  "date": "YYYY-MM-DD（不明なら今日の日付）",
  "totalAmount": "合計金額（数字のみ）",
  "items": [
    { "name": "商品名", "amount": "税込金額（数字のみ）", "category": "カテゴリID" }
  ]
}

【OCRテキスト】
${ocrText}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  const parsed = JSON.parse(cleaned);

  const parsedItems: Item[] = Array.isArray(parsed.items) && parsed.items.length > 0
    ? parsed.items.map((it: Item) => ({
        name: String(it.name ?? ""),
        amount: String(it.amount ?? ""),
        category: validCategoryIds.has(it.category) ? it.category : "OTHER",
      }))
    : [{ name: "", amount: "", category: "FOOD" }];

  const itemsTotal = parsedItems.reduce((sum, it) => sum + (parseInt(it.amount) || 0), 0);
  const totalAmount = String(parsed.totalAmount ? parseInt(String(parsed.totalAmount)) || itemsTotal : itemsTotal);

  return {
    storeName: parsed.storeName ?? "",
    date: parsed.date ?? new Date().toISOString().slice(0, 10),
    totalAmount,
    items: parsedItems,
  };
}

export async function saveReceipt(data: {
  date: string;
  storeName: string;
  memo: string;
  items: Item[];
  isReimbursement: boolean;
  totalAmount?: string;
}) {
  const supabase = await createClient();

  const totalAmount = data.totalAmount
    ? parseInt(data.totalAmount) || 0
    : data.items.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);

  const { data: receipt, error } = await supabase
    .from("receipts")
    .insert({
      store_name: data.storeName || null,
      date: data.date,
      total_amount: totalAmount,
      memo: data.memo || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const validItems = data.items.filter((item) => item.name || item.amount);
  if (validItems.length > 0) {
    const { error: itemsError } = await supabase.from("receipt_items").insert(
      validItems.map((item) => ({
        receipt_id: receipt.id,
        name: item.name,
        amount: parseInt(item.amount) || 0,
        category: item.category,
      }))
    );
    if (itemsError) throw new Error(itemsError.message);
  }

  if (data.isReimbursement) {
    const { error: reimbError } = await supabase
      .from("reimbursements")
      .insert({ receipt_id: receipt.id, amount: totalAmount });
    if (reimbError) throw new Error(reimbError.message);
  }

  redirect("/receipts");
}

export async function updateReceipt(
  id: string,
  data: {
    date: string;
    storeName: string;
    memo: string;
    items: Item[];
    totalAmount?: string;
  }
) {
  const supabase = await createClient();

  const totalAmount = data.totalAmount
    ? parseInt(data.totalAmount) || 0
    : data.items.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);

  const { error } = await supabase
    .from("receipts")
    .update({
      store_name: data.storeName || null,
      date: data.date,
      total_amount: totalAmount,
      memo: data.memo || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const { error: deleteError } = await supabase
    .from("receipt_items")
    .delete()
    .eq("receipt_id", id);
  if (deleteError) throw new Error(deleteError.message);

  const validItems = data.items.filter((item) => item.name || item.amount);
  if (validItems.length > 0) {
    const { error: itemsError } = await supabase.from("receipt_items").insert(
      validItems.map((item) => ({
        receipt_id: id,
        name: item.name,
        amount: parseInt(item.amount) || 0,
        category: item.category,
      }))
    );
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath(`/receipts/${id}`);
}

export async function deleteReceipt(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("receipts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect("/receipts");
}

export async function markReimbursementPaid(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reimbursements")
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
