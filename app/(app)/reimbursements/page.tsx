import { createClient } from "@/lib/supabase/server";
import ReimbursementsClient from "./ReimbursementsClient";

export default async function ReimbursementsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reimbursements")
    .select("id, amount, is_paid, paid_at, created_at, receipt:receipts(store_name, date, memo)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const reimbursements = (data ?? []).map((r) => ({
    ...r,
    receipt: Array.isArray(r.receipt) ? r.receipt[0] ?? null : r.receipt,
  }));

  return <ReimbursementsClient reimbursements={reimbursements} />;
}
