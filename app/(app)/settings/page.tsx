import { ChevronRight, LogOut, Users, Bell, Pencil } from "lucide-react";
import { CATEGORIES, formatAmount, type Category } from "@/lib/categories";

const BUDGET_CATEGORIES: Category[] = ["RENT", "FOOD", "UTILITY", "DAILY", "SAVING"];

const TOTAL_BUDGET = BUDGET_CATEGORIES.reduce(
  (sum, c) => sum + (CATEGORIES[c].budget ?? 0),
  0
);

export default function SettingsPage() {
  return (
    <div>
      {/* Header */}
      <header className="bg-white px-5 py-5 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">設定</h1>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Profile */}
        <section className="rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700 shrink-0">
              H
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">はやて</p>
              <p className="text-xs text-slate-400 truncate">hayatetakeda48@gmail.com</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
          </div>
        </section>

        {/* Couple */}
        <section className="rounded-xl bg-white shadow-sm overflow-hidden">
          <SectionHeader icon={<Users className="h-4 w-4" />} title="カップル設定" />
          <div className="divide-y divide-slate-100">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-sm font-bold text-pink-700 shrink-0">
                A
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">彼女</p>
                <p className="text-xs text-slate-400">partner@example.com</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                連携済み
              </span>
            </div>
          </div>
        </section>

        {/* Budget Settings */}
        <section className="rounded-xl bg-white shadow-sm overflow-hidden">
          <SectionHeader icon={<Pencil className="h-4 w-4" />} title="月次予算設定" />
          <div className="divide-y divide-slate-100">
            {BUDGET_CATEGORIES.map((cat) => {
              const { label, budget, badgeClass } = CATEGORIES[cat];
              return (
                <div key={cat} className="flex items-center px-4 py-3.5">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
                    {label}
                  </span>
                  <span className="flex-1" />
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                    {formatAmount(budget ?? 0)}
                  </span>
                  <button className="ml-3 flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              );
            })}

            {/* Total */}
            <div className="flex items-center px-4 py-3.5 bg-slate-50">
              <span className="text-xs font-semibold text-slate-600">合計</span>
              <span className="flex-1" />
              <span className="text-base font-bold text-slate-900 tabular-nums">
                {formatAmount(TOTAL_BUDGET)}
                <span className="text-xs font-normal text-slate-400"> / 月</span>
              </span>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-xl bg-white shadow-sm overflow-hidden">
          <SectionHeader icon={<Bell className="h-4 w-4" />} title="通知" />
          <div className="divide-y divide-slate-100">
            <ToggleRow label="立替請求の通知" defaultChecked />
            <ToggleRow label="返金完了の通知" defaultChecked />
          </div>
        </section>

        {/* Logout */}
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-medium text-red-500 shadow-sm active:bg-slate-50 transition-colors">
          <LogOut className="h-4 w-4" />
          ログアウト
        </button>

        <p className="text-center text-xs text-slate-400">家計簿 v0.1.0</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
      <span className="text-slate-500">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </span>
    </div>
  );
}

function ToggleRow({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between px-4 py-3.5">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="relative">
        <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
        <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-green-500 transition-colors" />
        <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </div>
    </label>
  );
}
