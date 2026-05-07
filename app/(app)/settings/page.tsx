import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import BudgetSection from "./BudgetSection";
import CategorySection from "./CategorySection";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? "";
  const email = user?.email ?? "";
  const displayName = fullName || email;
  const avatarLetter = (fullName[0] ?? email[0] ?? "U").toUpperCase();

  const { data: budgetOverrides } = await supabase
    .from("budget_overrides")
    .select("category, amount");

  const { data: customCategories } = await supabase
    .from("custom_categories")
    .select("id, name, budget, bar_color, badge_class_bg, badge_class_text")
    .order("created_at");

  return (
    <div>
      <header className="bg-white px-5 py-5 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">設定</h1>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Profile */}
        <section className="rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700 shrink-0">
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{displayName}</p>
              {fullName && (
                <p className="text-xs text-slate-400 truncate">{email}</p>
              )}
            </div>
          </div>
        </section>

        {/* Budget */}
        <BudgetSection
          budgetOverrides={budgetOverrides ?? []}
          customCategories={customCategories ?? []}
        />

        {/* Categories */}
        <CategorySection customCategories={customCategories ?? []} />

        {/* Logout */}
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-medium text-red-500 shadow-sm active:bg-slate-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            ログアウト
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">家計簿 v0.1.0</p>
      </div>
    </div>
  );
}
