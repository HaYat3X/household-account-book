import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Store, CalendarDays, StickyNote, ArrowLeftRight } from "lucide-react";
import { CATEGORIES, formatAmount, type Category } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";

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

  const catMap = new Map<string, { label: string; badgeClass: string }>(
    [
      ...(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
        ([key, val]) => [key, { label: val.label, badgeClass: val.badgeClass }] as const
      ),
      ...(customCategories ?? []).map(
        (c) => [c.id, { label: c.name, badgeClass: `${c.badge_class_bg} ${c.badge_class_text}` }] as const
      ),
    ]
  );

  const items = (receipt.receipt_items ?? []) as {
    id: string;
    name: string;
    amount: number;
    category: string;
  }[];

  const reimbursement = (receipt.reimbursements ?? [])[0] as
    | { id: string; amount: number; is_paid: boolean; paid_at: string | null }
    | undefined;

  const dateFormatted = receipt.date.replace(
    /^(\d{4})-(\d{2})-(\d{2})$/,
    "$1年$2月$3日"
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-4 pt-5 pb-4 border-b border-slate-100 flex items-center gap-2">
        <Link
          href="/receipts"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors -ml-1"
        >
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <h1 className="text-lg font-bold text-slate-900 flex-1 truncate">
          {receipt.store_name ?? "（店舗名なし）"}
        </h1>
      </header>

      <div className="px-4 py-5 space-y-4">
        {/* 基本情報 */}
        <div className="rounded-xl bg-white shadow-sm divide-y divide-slate-100">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Store className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-500 w-16 shrink-0">店舗名</span>
            <span className="text-sm font-medium text-slate-900 flex-1">
              {receipt.store_name ?? "—"}
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-500 w-16 shrink-0">日付</span>
            <span className="text-sm font-medium text-slate-900 flex-1">{dateFormatted}</span>
          </div>
          {receipt.memo && (
            <div className="flex items-start gap-3 px-4 py-3.5">
              <StickyNote className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-500 w-16 shrink-0">メモ</span>
              <span className="text-sm text-slate-900 flex-1 whitespace-pre-wrap">{receipt.memo}</span>
            </div>
          )}
        </div>

        {/* 明細 */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
            明細
          </h2>
          <div className="rounded-xl bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
            {items.length === 0 && (
              <p className="px-4 py-4 text-sm text-slate-400 text-center">明細なし</p>
            )}
            {items.map((item) => {
              const cat = catMap.get(item.category);
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                    {cat && (
                      <span
                        className={`mt-0.5 inline-block rounded-full px-2 py-px text-[10px] font-medium ${cat.badgeClass}`}
                      >
                        {cat.label}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                    {formatAmount(item.amount)}
                  </span>
                </div>
              );
            })}

            <div className="flex items-center justify-between px-4 py-3.5 bg-slate-50">
              <span className="text-sm font-semibold text-slate-700">合計</span>
              <span className="text-base font-bold text-slate-900 tabular-nums">
                {formatAmount(receipt.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* 立替情報 */}
        {reimbursement && (
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
              立替
            </h2>
            <div className="rounded-xl bg-white shadow-sm px-4 py-3.5 flex items-center gap-3">
              <ArrowLeftRight className="h-4 w-4 text-slate-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {formatAmount(reimbursement.amount)}
                </p>
                {reimbursement.is_paid ? (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    返金済み
                    {reimbursement.paid_at &&
                      `（${new Date(reimbursement.paid_at).toLocaleDateString("ja-JP")}）`}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 mt-0.5">未精算</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
