"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, type Category } from "@/lib/categories";
import { Tag, Plus, X, Check } from "lucide-react";
import { addCategory, deleteCategory } from "./actions";

type CustomCategory = {
  id: string;
  name: string;
  budget: number | null;
  bar_color: string;
  badge_class_bg: string;
  badge_class_text: string;
};

type Props = {
  customCategories: CustomCategory[];
};

const BUILT_IN: { key: Category; label: string; badgeClass: string }[] = (
  Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]
).map(([key, val]) => ({ key, label: val.label, badgeClass: val.badgeClass }));

const COLOR_OPTIONS = [
  { value: "indigo", bar: "bg-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700" },
  { value: "rose",   bar: "bg-rose-500",   bg: "bg-rose-50",   text: "text-rose-700" },
  { value: "orange", bar: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700" },
  { value: "teal",   bar: "bg-teal-500",   bg: "bg-teal-50",   text: "text-teal-700" },
  { value: "pink",   bar: "bg-pink-500",   bg: "bg-pink-50",   text: "text-pink-700" },
  { value: "lime",   bar: "bg-lime-500",   bg: "bg-lime-50",   text: "text-lime-700" },
];

export default function CategorySection({ customCategories }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!name.trim()) return;
    const selected = COLOR_OPTIONS.find((c) => c.value === color) ?? COLOR_OPTIONS[0];
    const budgetNum = budget ? parseInt(budget.replace(/[^0-9]/g, ""), 10) || null : null;

    startTransition(async () => {
      await addCategory(name.trim(), budgetNum, selected.bar, selected.bg, selected.text);
      router.refresh();
      setName("");
      setBudget("");
      setColor(COLOR_OPTIONS[0].value);
      setShowForm(false);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteCategory(id);
      router.refresh();
    });
  };

  return (
    <section className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Tag className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          カテゴリ
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {BUILT_IN.map(({ key, label, badgeClass }) => (
          <div key={key} className="flex items-center gap-3 px-4 py-3">
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
              {label}
            </span>
            <span className="flex-1" />
            <span className="text-[11px] text-slate-300">標準</span>
          </div>
        ))}

        {customCategories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${cat.badge_class_bg} ${cat.badge_class_text}`}
            >
              {cat.name}
            </span>
            <span className="flex-1" />
            <button
              onClick={() => handleDelete(cat.id)}
              disabled={isPending}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        ))}

        {showForm ? (
          <div className="px-4 py-4 space-y-3">
            <input
              type="text"
              placeholder="カテゴリ名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              autoFocus
            />
            <input
              type="number"
              placeholder="月次予算（任意）"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
            <div className="flex gap-2.5 items-center">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-6 w-6 rounded-full ${c.bar} transition-transform ${
                    color === c.value ? "scale-125 ring-2 ring-offset-2 ring-slate-400" : ""
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={isPending || !name.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 transition-opacity"
              >
                <Check className="h-3.5 w-3.5" />
                {isPending ? "追加中…" : "追加"}
              </button>
              <button
                onClick={() => { setShowForm(false); setName(""); setBudget(""); }}
                disabled={isPending}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            disabled={isPending}
            className="flex w-full items-center gap-2 px-4 py-3.5 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            カテゴリを追加
          </button>
        )}
      </div>
    </section>
  );
}
