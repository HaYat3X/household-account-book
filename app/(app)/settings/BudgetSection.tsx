"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, formatAmount, type Category } from "@/lib/categories";
import { Pencil, Check, X } from "lucide-react";
import { updateBudget, updateCustomCategoryBudget } from "./actions";

const BUDGET_CATEGORIES: Category[] = ["RENT", "FOOD", "UTILITY", "DAILY", "SAVING"];

type CustomCategory = {
  id: string;
  name: string;
  budget: number | null;
  badge_class_bg: string;
  badge_class_text: string;
};

type Props = {
  budgetOverrides: { category: string; amount: number }[];
  customCategories: CustomCategory[];
};

export default function BudgetSection({ budgetOverrides, customCategories }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const overrideMap = new Map(budgetOverrides.map(({ category, amount }) => [category, amount]));

  const getBuiltInBudget = (cat: Category) =>
    overrideMap.get(cat) ?? CATEGORIES[cat].budget ?? 0;

  const customWithBudget = customCategories.filter((c) => c.budget !== null);

  const total =
    BUDGET_CATEGORIES.reduce((sum, c) => sum + getBuiltInBudget(c), 0) +
    customWithBudget.reduce((sum, c) => sum + (c.budget ?? 0), 0);

  const startEdit = (key: string, current: number) => {
    setEditing(key);
    setInputValue(String(current));
  };

  const saveBuiltIn = (cat: Category) => {
    const amount = parseInt(inputValue.replace(/[^0-9]/g, ""), 10);
    if (isNaN(amount)) { setEditing(null); return; }
    startTransition(async () => {
      await updateBudget(cat, amount);
      router.refresh();
      setEditing(null);
    });
  };

  const saveCustom = (id: string) => {
    const amount = parseInt(inputValue.replace(/[^0-9]/g, ""), 10);
    if (isNaN(amount)) { setEditing(null); return; }
    startTransition(async () => {
      await updateCustomCategoryBudget(id, amount);
      router.refresh();
      setEditing(null);
    });
  };

  const EditControls = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-slate-400">¥</span>
      <input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        className="w-28 rounded-lg border border-green-400 px-2 py-1 text-sm font-semibold text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-green-300"
        autoFocus
        disabled={isPending}
      />
      <button
        onClick={onSave}
        disabled={isPending}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50 hover:bg-green-100 transition-colors"
      >
        <Check className="h-3.5 w-3.5 text-green-600" />
      </button>
      <button
        onClick={onCancel}
        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
      >
        <X className="h-3.5 w-3.5 text-slate-400" />
      </button>
    </div>
  );

  return (
    <section className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <Pencil className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          月次予算設定
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {/* 組み込みカテゴリ */}
        {BUDGET_CATEGORIES.map((cat) => {
          const { label, badgeClass } = CATEGORIES[cat];
          const budget = getBuiltInBudget(cat);
          const isEditing = editing === cat;

          return (
            <div key={cat} className="flex items-center px-4 py-3.5 gap-3">
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium shrink-0 ${badgeClass}`}>
                {label}
              </span>
              <span className="flex-1" />
              {isEditing ? (
                <EditControls
                  onSave={() => saveBuiltIn(cat)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                    {formatAmount(budget)}
                  </span>
                  <button
                    onClick={() => startEdit(cat, budget)}
                    className="ml-1 flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </>
              )}
            </div>
          );
        })}

        {/* カスタムカテゴリ（予算あり） */}
        {customWithBudget.map((cat) => {
          const isEditing = editing === cat.id;
          return (
            <div key={cat.id} className="flex items-center px-4 py-3.5 gap-3">
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-medium shrink-0 ${cat.badge_class_bg} ${cat.badge_class_text}`}
              >
                {cat.name}
              </span>
              <span className="flex-1" />
              {isEditing ? (
                <EditControls
                  onSave={() => saveCustom(cat.id)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <>
                  <span className="text-sm font-semibold text-slate-900 tabular-nums">
                    {formatAmount(cat.budget ?? 0)}
                  </span>
                  <button
                    onClick={() => startEdit(cat.id, cat.budget ?? 0)}
                    className="ml-1 flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </>
              )}
            </div>
          );
        })}

        {/* 合計 */}
        <div className="flex items-center px-4 py-3.5 bg-slate-50">
          <span className="text-xs font-semibold text-slate-600">合計</span>
          <span className="flex-1" />
          <span className="text-base font-bold text-slate-900 tabular-nums">
            {formatAmount(total)}
            <span className="text-xs font-normal text-slate-400"> / 月</span>
          </span>
        </div>
      </div>
    </section>
  );
}
