import { createClient } from "@/lib/supabase/server";
import NewReceiptClient from "./NewReceiptClient";

export default async function NewReceiptPage() {
  const supabase = await createClient();
  const { data: customCategories } = await supabase
    .from("custom_categories")
    .select("id, name")
    .order("created_at");

  return <NewReceiptClient customCategories={customCategories ?? []} />;
}
