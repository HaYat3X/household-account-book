import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight, ChevronRight as ArrowRight } from "lucide-react";
import { CATEGORIES, formatAmount, type Category } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";

const TOTAL_BUDGET = 240000;

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year ?? now.getFullYear());
  const month = Number(params.month ?? now.getMonth() + 1);

  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prevLink = `/dashboard?year=${prevDate.getFullYear()}&month=${prevDate.getMonth() + 1}`;
  const nextLink = `/dashboard?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}`;

  const pad = (n: number) => String(n).padStart(2, "0");
  const from = `${year}-${pad(month)}-01`;
  const to = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`;

  const supabase = await createClient();

  const { data: receipts } = await supabase
    .from("receipts")
    .select("id, date, store_name, total_amount")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const receiptIds = (receipts ?? []).map((r) => r.id);

  const { data: items } = receiptIds.length > 0
    ? await supabase
        .from("receipt_items")
        .select("receipt_id, category, amount")
        .in("receipt_id", receiptIds)
    : { data: [] as { receipt_id: string; category: string; amount: number }[] };

  // Aggregate category totals
  const categoryTotals = new Map<Category, number>();
  for (const item of items ?? []) {
    const cat = item.category as Category;
    categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + item.amount);
  }

  const monthTotals = (Object.keys(CATEGORIES) as Category[]).map((category) => ({
    category,
    spent: categoryTotals.get(category) ?? 0,
  }));

  const totalSpent = monthTotals.reduce((s, r) => s + r.spent, 0);
  const percent = Math.round((totalSpent / TOTAL_BUDGET) * 100);

  // Primary category per receipt (first item encountered)
  const primaryCategory = new Map<string, Category>();
  for (const item of items ?? []) {
    if (!primaryCategory.has(item.receipt_id)) {
      primaryCategory.set(item.receipt_id, item.category as Category);
    }
  }

  const recentReceipts = (receipts ?? []).slice(0, 5).map((r) => {
    const [, m, d] = r.date.split("-");
    return {
      id: r.id,
      date: `${m}/${d}`,
      store: r.store_name ?? "不明",
      amount: r.total_amount,
      category: primaryCategory.get(r.id) ?? ("OTHER" as Category),
    };
  });

  return (
    <div>
      <header className="flex items-center justify-between bg-white px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Link
            href={prevLink}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <span className="text-base font-semibold text-slate-900">{year}年{month}月</span>
          <Link
            href={nextLink}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </Link>
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
            <span className="text-3xl font-bold text-slate-900">{formatAmount(totalSpent)}</span>
            <span className="mb-0.5 text-sm text-slate-400">/ {formatAmount(TOTAL_BUDGET)}</span>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="font-medium text-green-600">{percent}% 使用</span>
            <span className="text-slate-400">残り {formatAmount(TOTAL_BUDGET - totalSpent)}</span>
          </div>
        </div>

        {/* Category Grid */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">カテゴリ別</h2>
          <div className="grid grid-cols-2 gap-3">
            {monthTotals.map(({ category, spent }) => {
              const cat = CATEGORIES[category];
              const pct = cat.budget ? Math.round((spent / cat.budget) * 100) : null;
              const isOver = pct !== null && pct > 100;

              return (
                <div key={category} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${cat.badgeClass}`}>
                      {cat.label}
                    </span>
                    {isOver && <span className="text-[10px] font-semibold text-red-500">超過</span>}
                  </div>
                  <p className="mt-2 text-lg font-bold text-slate-900">{formatAmount(spent)}</p>
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
            <Link href="/receipts" className="flex items-center gap-0.5 text-xs text-green-600 font-medium">
              すべて見る
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentReceipts.length === 0 ? (
            <div className="rounded-xl bg-white p-6 shadow-sm text-center">
              <p className="text-sm text-slate-400">この月の支出はありません</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm divide-y divide-slate-100">
              {recentReceipts.map((r) => {
                const cat = CATEGORIES[r.category];
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs text-slate-400 tabular-nums w-10 shrink-0">{r.date}</span>
                    <span className="flex-1 truncate text-sm font-medium text-slate-800">{r.store}</span>
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
          )}
        </section>
      </div>
    </div>
  );
}
