"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Plus, ArrowLeftRight, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "ホーム" },
  { href: "/receipts", icon: Receipt, label: "支出" },
  { href: "/receipts/new", icon: Plus, label: "追加", isAdd: true },
  { href: "/reimbursements", icon: ArrowLeftRight, label: "立替" },
  { href: "/settings", icon: Settings, label: "設定" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50">
      <div className="max-w-[430px] mx-auto bg-white border-t border-slate-200">
        <ul className="flex h-16 items-center justify-around px-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label, isAdd }) => {
            const isActive =
              pathname === href ||
              (href === "/receipts" &&
                pathname.startsWith("/receipts") &&
                pathname !== "/receipts/new");

            if (isAdd) {
              return (
                <li key={href}>
                  <Link href={href} className="flex flex-col items-center -mt-5">
                    <span className="flex h-13 w-13 items-center justify-center rounded-full bg-green-600 shadow-lg shadow-green-200 active:bg-green-700 transition-colors">
                      <Icon className="h-6 w-6 text-white" />
                    </span>
                  </Link>
                </li>
              );
            }

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex flex-col items-center gap-0.5 min-w-14 py-1 transition-colors ${
                    isActive ? "text-green-600" : "text-slate-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
