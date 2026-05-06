import Link from "next/link";
import { Plus, Search, ChevronRight } from "lucide-react";
import { CATEGORIES, formatAmount, type Category } from "@/lib/categories";

type Receipt = {
  id: string;
  date: string;
  store: string;
  amount: number;
  categories: Category[];
};

const RECEIPTS_BY_MONTH: { label: string; total: number; items: Receipt[] }[] = [
  {
    label: "2026年5月",
    total: 15860,
    items: [
      { id: "1", date: "05/05", store: "イオン", amount: 4230, categories: ["FOOD"] },
      { id: "2", date: "05/04", store: "ファミリーマート", amount: 890, categories: ["FOOD"] },
      { id: "3", date: "05/03", store: "マツモトキヨシ", amount: 2140, categories: ["DAILY"] },
      { id: "4", date: "05/02", store: "東京ガス", amount: 5400, categories: ["UTILITY"] },
      { id: "5", date: "05/01", store: "ドン・キホーテ", amount: 3200, categories: ["OTHER", "DAILY"] },
    ],
  },
  {
    label: "2026年4月",
    total: 38070,
    items: [
      { id: "6", date: "04/28", store: "業務スーパー", amount: 5670, categories: ["FOOD"] },
      { id: "7", date: "04/25", store: "LOFT", amount: 2800, categories: ["DAILY"] },
      { id: "8", date: "04/22", store: "コストコ", amount: 12500, categories: ["FOOD"] },
      { id: "9", date: "04/15", store: "東京電力", amount: 7100, categories: ["UTILITY"] },
      { id: "10", date: "04/10", store: "吉野家", amount: 1560, categories: ["FOOD"] },
      { id: "11", date: "04/03", store: "サンドラッグ", amount: 3240, categories: ["DAILY"] },
      { id: "12", date: "04/01", store: "アパート家賃", amount: 100000, categories: ["RENT"] },
    ],
  },
];

export default function ReceiptsPage() {
  return (
    <div>
      {/* Header */}
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

        {/* Search bar */}
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
        {RECEIPTS_BY_MONTH.map((month) => (
          <section key={month.label}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-600">{month.label}</h2>
              <span className="text-sm font-semibold text-slate-900">
                {formatAmount(month.total)}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl bg-white shadow-sm divide-y divide-slate-100">
              {month.items.map((receipt) => (
                <Link
                  key={receipt.id}
                  href={`/receipts/${receipt.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 active:bg-slate-50 transition-colors"
                >
                  <span className="text-xs text-slate-400 tabular-nums w-10 shrink-0">
                    {receipt.date}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {receipt.store}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {receipt.categories.map((c) => {
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
                    {formatAmount(receipt.amount)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
