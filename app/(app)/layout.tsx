import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center bg-slate-100 min-h-screen">
      <div className="relative w-full max-w-[430px] bg-slate-50 shadow-sm min-h-screen">
        <main className="pb-16">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
