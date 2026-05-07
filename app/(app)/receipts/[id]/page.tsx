import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReceiptDetailClient from "./ReceiptDetailClient";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: receipt }, { data: customCategories }] = await Promise.all([
    supabase
      .from("receipts")
      .select(
        "id, date, store_name, total_amount, memo, created_at, receipt_items(id, name, amount, category), reimbursements(id, amount, is_paid, paid_at)"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("custom_categories")
      .select("id, name, badge_class_bg, badge_class_text"),
  ]);

  if (!receipt) notFound();

  const items = (receipt.receipt_items ?? []) as {
    id: string;
    name: string;
    amount: number;
    category: string;
  }[];

  const reimbursement = (receipt.reimbursements ?? [])[0] as
    | { id: string; amount: number; is_paid: boolean; paid_at: string | null }
    | undefined;

  return (
    <ReceiptDetailClient
      receipt={{
        id: receipt.id,
        date: receipt.date,
        store_name: receipt.store_name,
        total_amount: receipt.total_amount,
        memo: receipt.memo,
      }}
      items={items}
      reimbursement={reimbursement}
      customCategories={customCategories ?? []}
    />
  );
}
