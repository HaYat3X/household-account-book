"use client";

import { useState } from "react";
import { Plus, CheckCircle, Clock, SendHorizonal } from "lucide-react";
import Link from "next/link";
import { CATEGORIES, formatAmount, type Category } from "@/lib/categories";

type Tab = "pending" | "done";

type Reimbursement = {
  id: string;
  date: string;
  paidBy: string;
  store: string;
  amount: number;
  category: Category;
  memo?: string;
  status: "unrequested" | "requested" | "paid";
};

const PENDING: Reimbursement[] = [
  {
    id: "1",
    date: "2026-05-03",
    paidBy: "はやて",
    store: "マツモトキヨシ",
    amount: 2140,
    category: "DAILY",
    status: "unrequested",
  },
  {
    id: "2",
    date: "2026-05-01",
    paidBy: "はやて",
    store: "Amazon",
    amount: 3980,
    category: "DAILY",
    memo: "トイレットペーパー × 12",
    status: "requested",
  },
  {
    id: "3",
    date: "2026-04-30",
    paidBy: "彼女",
    store: "西松屋",
    amount: 1500,
    category: "DAILY",
    status: "unrequested",
  },
];

const DONE: Reimbursement[] = [
  {
    id: "4",
    date: "2026-04-22",
    paidBy: "はやて",
    store: "コストコ",
    amount: 12500,
    category: "FOOD",
    status: "paid",
  },
  {
    id: "5",
    date: "2026-04-10",
    paidBy: "彼女",
    store: "ニトリ",
    amount: 5800,
    category: "DAILY",
    status: "paid",
  },
];

export default function ReimbursementsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const items = tab === "pending" ? PENDING : DONE;

  return (
    <div>
      {/* Header */}
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

        {/* Tabs */}
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
                  <span className="rounded-full bg-red-100 px-1.5 py-0 text-[11px] font-bold text-red-600 ml-1">
                    {PENDING.length}
                  </span>
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
        {items.length === 0 && (
          <div className="py-16 text-center text-sm text-slate-400">
            {tab === "pending" ? "未精算の立替はありません" : "精算済みの記録はありません"}
          </div>
        )}

        {items.map((r) => {
          const cat = CATEGORIES[r.category];
          const dateStr = r.date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$2/$3");

          return (
            <div key={r.id} className="rounded-xl bg-white p-4 shadow-sm space-y-3">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{r.store}</span>
                    <span className={`rounded-full px-2 py-px text-[11px] font-medium ${cat.badgeClass}`}>
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {dateStr}　{r.paidBy} が立替
                    {r.memo && <span className="ml-1">・{r.memo}</span>}
                  </p>
                </div>
                <span className="text-base font-bold text-slate-900 tabular-nums shrink-0">
                  {formatAmount(r.amount)}
                </span>
              </div>

              {/* Status / Action */}
              {r.status === "unrequested" && (
                <button className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white active:bg-green-700 transition-colors">
                  <SendHorizonal className="h-4 w-4" />
                  請求する
                </button>
              )}
              {r.status === "requested" && (
                <div className="flex items-center gap-2">
                  <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-50 py-2 text-xs font-medium text-amber-700">
                    <Clock className="h-3.5 w-3.5" />
                    請求済み・返金待ち
                  </span>
                  <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 py-2 text-xs font-medium text-white active:bg-slate-700 transition-colors">
                    <CheckCircle className="h-3.5 w-3.5" />
                    返金完了
                  </button>
                </div>
              )}
              {r.status === "paid" && (
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
