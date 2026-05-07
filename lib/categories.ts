export type Category = "FOOD" | "DAILY" | "UTILITY" | "RENT" | "SAVING" | "OTHER" | "TAX";

export const CATEGORIES: Record<
  Category,
  {
    label: string;
    budget: number | null;
    barColor: string;
    badgeClass: string;
    iconBg: string;
  }
> = {
  RENT: {
    label: "家賃",
    budget: 100000,
    barColor: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700",
    iconBg: "bg-blue-100 text-blue-600",
  },
  FOOD: {
    label: "食費",
    budget: 60000,
    barColor: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  UTILITY: {
    label: "光熱費",
    budget: 20000,
    barColor: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700",
    iconBg: "bg-amber-100 text-amber-600",
  },
  DAILY: {
    label: "日用品",
    budget: 20000,
    barColor: "bg-violet-500",
    badgeClass: "bg-violet-50 text-violet-700",
    iconBg: "bg-violet-100 text-violet-600",
  },
  SAVING: {
    label: "貯金",
    budget: 40000,
    barColor: "bg-cyan-500",
    badgeClass: "bg-cyan-50 text-cyan-700",
    iconBg: "bg-cyan-100 text-cyan-600",
  },
  OTHER: {
    label: "その他",
    budget: null,
    barColor: "bg-slate-400",
    badgeClass: "bg-slate-100 text-slate-600",
    iconBg: "bg-slate-100 text-slate-500",
  },
  TAX: {
    label: "消費税",
    budget: null,
    barColor: "bg-rose-400",
    badgeClass: "bg-rose-50 text-rose-600",
    iconBg: "bg-rose-100 text-rose-500",
  },
};

export function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}
