"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBudget(category: string, amount: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("budget_overrides")
    .upsert({ category, amount }, { onConflict: "category" });
  if (error) throw error;
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function addCategory(
  name: string,
  budget: number | null,
  barColor: string,
  badgeClassBg: string,
  badgeClassText: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_categories")
    .insert({
      name,
      budget,
      bar_color: barColor,
      badge_class_bg: badgeClassBg,
      badge_class_text: badgeClassText,
    })
    .select("id, name, budget, bar_color, badge_class_bg, badge_class_text")
    .single();
  if (error) throw error;
  revalidatePath("/settings");
  return data as {
    id: string;
    name: string;
    budget: number | null;
    bar_color: string;
    badge_class_bg: string;
    badge_class_text: string;
  };
}

export async function updateCustomCategoryBudget(id: string, amount: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("custom_categories")
    .update({ budget: amount })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("custom_categories")
    .delete()
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/settings");
}
