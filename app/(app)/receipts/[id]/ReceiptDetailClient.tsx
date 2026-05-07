"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Store,
  CalendarDays,
  StickyNote,
  ArrowLeftRight,
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
} from "lucide-react";
import { CATEGORIES, formatAmount, type Category } from "@/lib/categories";
import { updateReceipt, deleteReceipt } from "../actions";

type Item = { id?: string; name: string; amount: string; category: string };

type Props = {
  receipt: {
    id: string;
    date: string;
    store_name: string | null;
    total_amount: number;
    memo: string | null;
  };
  items: { id: string; name: string; amount: number; category: string }[];
  reimbursement:
    | { id: string; amount: number; is_paid: boolean; paid_at: string | null }
    | undefined;
  customCategories: { id: string; name: string; badge_class_bg: string; badge_class_text: string }[];
};

export default function ReceiptDetailClient({
  receipt,
  items: initialItems,
  reimbursement,
  customCategories,
}: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(receipt.date);
  const [storeName, setStoreName] = useState(receipt.store_name ?? "");
  const [memo, setMemo] = useState(receipt.memo ?? "");
  const [totalAmount, setTotalAmount] = useState(String(receipt.total_amount));
  const [items, setItems] = useState<Item[]>(
    initialItems.length > 0
      ? initialItems.map((it) => ({
          id: it.id,
          name: it.name,
          amount: String(it.amount),
          category: it.category,
        }))
      : [{ name: "", amount: "", category: "FOOD" }]
  );

  const catMap = new Map<string, { label: string; badgeClass: string }>(
    [
      ...(Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(
        ([key, val]) => [key, { label: val.label, badgeClass: val.badgeClass }] as const
      ),
      ...customCategories.map(
        (c) => [c.id, { label: c.name, badgeClass: `${c.badge_class_bg} ${c.badge_class_text}` }] as const
      ),
    ]
  );

  const categoryOptions = [
    ...Object.entries(CATEGORIES).map(([value, { label }]) => ({ value, label })),
    ...customCategories.map(({ id, name }) => ({ value: id, label: name })),
  ];

  const dateFormatted = receipt.date.replace(
    /^(\d{4})-(\d{2})-(\d{2})$/,
    "$1年$2月$3日"
  );

  const cancelEdit = () => {
    setDate(receipt.date);
    setStoreName(receipt.store_name ?? "");
    setMemo(receipt.memo ?? "");
    setTotalAmount(String(receipt.total_amount));
    setItems(
      initialItems.length > 0
        ? initialItems.map((it) => ({
            id: it.id,
            name: it.name,
            amount: String(it.amount),
            category: it.category,
          }))
        : [{ name: "", amount: "", category: "FOOD" }]
    );
    setError(null);
    setIsEditing(false);
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateReceipt(receipt.id, { date, storeName, memo, items, totalAmount });
        setIsEditing(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存に失敗しました");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteReceipt(receipt.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "削除に失敗しました");
        setShowDeleteConfirm(false);
      }
    });
  };

  const addItem = () => setItems((prev) => [...prev, { name: "", amount: "", category: "FOOD" }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof Item, value: string) =>
    setItems((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white px-4 pt-5 pb-4 border-b border-slate-100 flex items-center gap-2">
        {isEditing ? (
          <button
            onClick={cancelEdit}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors -ml-1"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        ) : (
          <Link
            href="/receipts"
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors -ml-1"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </Link>
        )}
        <h1 className="text-lg font-bold text-slate-900 flex-1 truncate">
          {isEditing ? "支出を編集" : (receipt.store_name ?? "（店舗名なし）")}
        </h1>
        {isEditing ? (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60 active:bg-green-700 transition-colors"
          >
            <Check className="h-4 w-4" />
            {isPending ? "保存中..." : "保存"}
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors"
          >
            <Pencil className="h-4 w-4 text-slate-600" />
          </button>
        )}
      </header>

      <div className="px-4 py-5 space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700">基本情報</h2>
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">日付</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">店舗名</span>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="例：イオン、ファミリーマート"
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">合計金額（税込）</span>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">¥</span>
                    <input
                      type="number"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      placeholder="レシートの合計金額"
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">メモ（任意）</span>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="自由記入"
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700">明細</h2>
                <span className="text-xs text-slate-400">{items.length}件</span>
              </div>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">明細 {i + 1}</span>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(i)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                      placeholder="品目名"
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">¥</span>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateItem(i, "amount", e.target.value)}
                          placeholder="0"
                          className="block w-full rounded-lg border border-slate-200 bg-white pl-7 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        />
                      </div>
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(i, "category", e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 outline-none focus:border-green-500"
                      >
                        {categoryOptions.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addItem}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-500 active:bg-slate-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                明細を追加
              </button>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-sm font-medium text-red-500 active:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              この支出を削除
            </button>
          </>
        ) : (
          <>
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

            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
                明細
              </h2>
              <div className="rounded-xl bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
                {initialItems.length === 0 && (
                  <p className="px-4 py-4 text-sm text-slate-400 text-center">明細なし</p>
                )}
                {initialItems.map((item) => {
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
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-base font-semibold text-slate-900">支出を削除しますか？</p>
              <p className="text-sm text-slate-500">この操作は取り消せません。</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 active:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white disabled:opacity-60 active:bg-red-600 transition-colors"
              >
                {isPending ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
