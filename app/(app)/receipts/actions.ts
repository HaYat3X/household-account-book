"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
type Item = { name: string; amount: string; category: string };

export async function saveReceipt(data: {
  date: string;
  storeName: string;
  memo: string;
  items: Item[];
  isReimbursement: boolean;
}) {
  const supabase = await createClient();

  const totalAmount = data.items.reduce(
    (sum, item) => sum + (parseInt(item.amount) || 0),
    0
  );

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

export async function markReimbursementPaid(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reimbursements")
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
