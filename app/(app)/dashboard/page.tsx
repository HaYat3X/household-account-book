import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from "lucide-react";
import { CATEGORIES, formatAmount, type Category } from "@/lib/categories";

const MONTH_TOTALS: { category: Category; spent: number }[] = [
  { category: "RENT", spent: 100000 },
  { category: "FOOD", spent: 38400 },
  { category: "UTILITY", spent: 12500 },
  { category: "DAILY", spent: 8200 },
  { category: "SAVING", spent: 40000 },
  { category: "OTHER", spent: 3200 },
];

const RECENT_RECEIPTS = [
  { id: "1", date: "05/05", store: "イオン", amount: 4230, category: "FOOD" as Category },
  { id: "2", date: "05/04", store: "ファミリーマート", amount: 890, category: "FOOD" as Category },
  { id: "3", date: "05/03", store: "マツモトキヨシ", amount: 2140, category: "DAILY" as Category },
  { id: "4", date: "05/02", store: "東京ガス", amount: 5400, category: "UTILITY" as Category },
];

const TOTAL_BUDGET = 240000;
const TOTAL_SPENT = MONTH_TOTALS.reduce((s, r) => s + r.spent, 0);
const PERCENT = Math.round((TOTAL_SPENT / TOTAL_BUDGET) * 100);

export default function DashboardPage() {
  return (
    <div>
      {/* Header */}
      <header className="flex items-center justify-between bg-white px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <ChevronLeft className="h-5 w-5 text-slate-500" />
          </button>
          <span className="text-base font-semibold text-slate-900">2026年5月</span>
          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Total Budget Card */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">今月の支出</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {formatAmount(TOTAL_SPENT)}
            </span>
            <span className="mb-0.5 text-sm text-slate-400">/ {formatAmount(TOTAL_BUDGET)}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${Math.min(PERCENT, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="font-medium text-green-600">{PERCENT}% 使用</span>
            <span className="text-slate-400">残り {formatAmount(TOTAL_BUDGET - TOTAL_SPENT)}</span>
          </div>
        </div>

        {/* Category Grid */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">カテゴリ別</h2>
          <div className="grid grid-cols-2 gap-3">
            {MONTH_TOTALS.map(({ category, spent }) => {
              const cat = CATEGORIES[category];
              const pct = cat.budget ? Math.round((spent / cat.budget) * 100) : null;
              const isOver = pct !== null && pct > 100;

              return (
                <div key={category} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${cat.badgeClass}`}
                    >
                      {cat.label}
                    </span>
                    {isOver && (
                      <span className="text-[10px] font-semibold text-red-500">超過</span>
                    )}
                  </div>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatAmount(spent)}
                  </p>
                  {cat.budget ? (
                    <>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${isOver ? "bg-red-400" : cat.barColor}`}
                          style={{ width: `${Math.min(pct ?? 0, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatAmount(cat.budget)} の {pct}%
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">上限なし</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Receipts */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">最近の支出</h2>
            <Link
              href="/receipts"
              className="flex items-center gap-0.5 text-xs text-green-600 font-medium"
            >
              すべて見る
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm divide-y divide-slate-100">
            {RECENT_RECEIPTS.map((r) => {
              const cat = CATEGORIES[r.category];
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs text-slate-400 tabular-nums w-10 shrink-0">
                    {r.date}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium text-slate-800">
                    {r.store}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cat.badgeClass}`}>
                    {cat.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                    {formatAmount(r.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
