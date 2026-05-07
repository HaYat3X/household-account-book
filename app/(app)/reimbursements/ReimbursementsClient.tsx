"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { formatAmount } from "@/lib/categories";
import { markReimbursementPaid } from "@/app/(app)/receipts/actions";

type Reimbursement = {
  id: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  receipt: { store_name: string | null; date: string; memo: string | null } | null;
};

type Tab = "pending" | "done";

export default function ReimbursementsClient({
  reimbursements,
}: {
  reimbursements: Reimbursement[];
}) {
  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState(reimbursements);
  const [, startTransition] = useTransition();

  const pending = items.filter((r) => !r.is_paid);
  const done = items.filter((r) => r.is_paid);
  const list = tab === "pending" ? pending : done;

  const handleMarkPaid = (id: string) => {
    startTransition(async () => {
      await markReimbursementPaid(id);
      setItems((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, is_paid: true, paid_at: new Date().toISOString() } : r
        )
      );
    });
  };

  return (
    <div>
      <header className="bg-white px-5 pt-5 pb-0 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">立替管理</h1>
          <Link
            href="/receipts/new"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 shadow-sm active:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5 text-white" />
          </Link>
        </div>

        <div className="flex">
          {(["pending", "done"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-slate-400"
              }`}
            >
              {t === "pending" ? (
                <>
                  <Clock className="h-4 w-4" />
                  未精算
                  {pending.length > 0 && (
                    <span className="rounded-full bg-red-100 px-1.5 py-0 text-[11px] font-bold text-red-600 ml-1">
                      {pending.length}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  精算済み
                </>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-5 space-y-3">
        {list.length === 0 && (
          <div className="py-16 text-center text-sm text-slate-400">
            {tab === "pending" ? "未精算の立替はありません" : "精算済みの記録はありません"}
          </div>
        )}

        {list.map((r) => {
          const storeName = r.receipt?.store_name ?? "（店舗名なし）";
          const dateStr = r.receipt?.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$2/$3") ?? "";

          return (
            <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-slate-900">{storeName}</span>
                  <p className="text-xs text-slate-400">
                    {dateStr}
                    {r.receipt?.memo && <span className="ml-1">・{r.receipt.memo}</span>}
                  </p>
                </div>
                <span className="text-base font-bold text-slate-900 tabular-nums shrink-0">
                  {formatAmount(r.amount)}
                </span>
              </div>

              {!r.is_paid ? (
                <button
                  onClick={() => handleMarkPaid(r.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-800 py-2.5 text-sm font-medium text-white active:bg-slate-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  返金完了にする
                </button>
              ) : (
                <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">返金済み</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
