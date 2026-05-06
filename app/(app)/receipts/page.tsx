import Link from "next/link";
import { Plus, Search, ChevronRight } from "lucide-react";
import { CATEGORIES, formatAmount, type Category } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";

type ReceiptRow = {
  id: string;
  date: string;
  store_name: string | null;
  total_amount: number;
  receipt_items: { category: string }[];
};

function groupByMonth(receipts: ReceiptRow[]) {
  const map = new Map<string, { label: string; total: number; items: ReceiptRow[] }>();
  for (const r of receipts) {
    const [year, month] = r.date.split("-");
    const key = `${year}-${month}`;
    const label = `${year}年${parseInt(month)}月`;
    if (!map.has(key)) map.set(key, { label, total: 0, items: [] });
    const group = map.get(key)!;
    group.total += r.total_amount;
    group.items.push(r);
  }
  return Array.from(map.values());
}

export default async function ReceiptsPage() {
  const supabase = await createClient();

  const { data: receipts } = await supabase
    .from("receipts")
    .select("id, date, store_name, total_amount, receipt_items(category)")
    .order("date", { ascending: false });

  const groups = groupByMonth((receipts ?? []) as ReceiptRow[]);

  return (
    <div>
      <header className="bg-white px-5 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">支出一覧</h1>
          <Link
            href="/receipts/new"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 shadow-sm active:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5 text-white" />
          </Link>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="店舗名・カテゴリで検索"
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          />
        </div>
      </header>

      <div className="px-4 py-5 space-y-6">
        {groups.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-12">
            まだ支出が登録されていません
          </p>
        )}
        {groups.map((month) => (
          <section key={month.label}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-600">{month.label}</h2>
              <span className="text-sm font-semibold text-slate-900">
                {formatAmount(month.total)}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl bg-white shadow-sm divide-y divide-slate-100">
              {month.items.map((receipt) => {
                const mmdd = receipt.date.slice(5).replace("-", "/");
                const categories = [
                  ...new Set(receipt.receipt_items.map((i) => i.category as Category)),
                ];
                return (
                  <Link
                    key={receipt.id}
                    href={`/receipts/${receipt.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition-colors"
                  >
                    <span className="text-xs text-slate-400 tabular-nums w-10 shrink-0">
                      {mmdd}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {receipt.store_name ?? "（店舗名なし）"}
                      </p>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {categories.map((c) => {
                          const cat = CATEGORIES[c];
                          return (
                            <span
                              key={c}
                              className={`rounded-full px-2 py-px text-[10px] font-medium ${cat.badgeClass}`}
                            >
                              {cat.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                      {formatAmount(receipt.total_amount)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
