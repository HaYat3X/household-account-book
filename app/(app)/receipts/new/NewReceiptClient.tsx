"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, FileText, Upload, Plus, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { parseReceiptImage, saveReceipt } from "../actions";

type Tab = "photo" | "manual";
type Item = { name: string; amount: string; category: string };

type CustomCategory = { id: string; name: string };

type Props = {
  customCategories: CustomCategory[];
};

const DEFAULT_ITEM: Item = { name: "", amount: "", category: "FOOD" };
const today = new Date().toISOString().slice(0, 10);

export default function NewReceiptClient({ customCategories }: Props) {
  const [tab, setTab] = useState<Tab>("photo");
  const [date, setDate] = useState(today);
  const [storeName, setStoreName] = useState("");
  const [memo, setMemo] = useState("");
  const [items, setItems] = useState<Item[]>([{ ...DEFAULT_ITEM }]);
  const [totalAmount, setTotalAmount] = useState("");
  const [isReimbursement, setIsReimbursement] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categoryOptions = [
    ...Object.entries(CATEGORIES).map(([value, { label }]) => ({ value, label })),
    ...customCategories.map(({ id, name }) => ({ value: id, label: name })),
  ];

  const addItem = () => setItems((prev) => [...prev, { ...DEFAULT_ITEM }]);
  const removeItem = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof Item, value: string) =>
    setItems((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    );

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        await saveReceipt({ date, storeName, memo, items, isReimbursement, totalAmount });
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存に失敗しました");
      }
    });
  };

  return (
    <div>
      <header className="flex items-center gap-3 bg-white px-4 py-4 border-b border-slate-100">
        <Link
          href="/receipts"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <h1 className="text-lg font-semibold text-slate-900">支出を追加</h1>
      </header>

      <div className="bg-white border-b border-slate-100 px-4">
        <div className="flex">
          {(["photo", "manual"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-slate-400"
              }`}
            >
              {t === "photo" ? (
                <><Camera className="h-4 w-4" />写真から</>
              ) : (
                <><FileText className="h-4 w-4" />手動入力</>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5">
        {tab === "photo" ? (
          <PhotoTab
            onOcrComplete={(result) => {
              setDate(result.date);
              setStoreName(result.storeName);
              setItems(result.items);
              setTotalAmount(result.totalAmount);
              setTab("manual");
            }}
          />
        ) : (
          <ManualTab
            date={date}
            storeName={storeName}
            memo={memo}
            items={items}
            totalAmount={totalAmount}
            isReimbursement={isReimbursement}
            categoryOptions={categoryOptions}
            onDateChange={setDate}
            onStoreNameChange={setStoreName}
            onMemoChange={setMemo}
            onTotalAmountChange={setTotalAmount}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onUpdateItem={updateItem}
            onIsReimbursementChange={setIsReimbursement}
            onSubmit={handleSubmit}
            isPending={isPending}
            error={error}
          />
        )}
      </div>
    </div>
  );
}

async function resizeImage(file: File, maxPx = 1920): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("resize failed")), "image/jpeg", 0.85);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function PhotoTab({
  onOcrComplete,
}: {
  onOcrComplete: (result: { storeName: string; date: string; totalAmount: string; items: Item[] }) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    try {
      const resized = await resizeImage(file);
      const formData = new FormData();
      formData.append("image", resized, "receipt.jpg");
      const result = await parseReceiptImage(formData);
      onOcrComplete(result);
    } catch {
      setError("読み取りに失敗しました。手動で入力してください。");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
        <p className="text-sm font-medium text-slate-600">AIが解析中...</p>
        <p className="text-xs text-slate-400">少々お待ちください</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <button
        onClick={() => cameraRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white py-14 active:bg-slate-50 transition-colors"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <Camera className="h-7 w-7 text-green-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">タップして撮影</p>
          <p className="mt-0.5 text-xs text-slate-400">または画像を選択</p>
        </div>
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">または</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 active:bg-slate-50 transition-colors"
      >
        <Upload className="h-4 w-4" />
        ファイルを選択
      </button>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="rounded-xl bg-green-50 p-4">
        <p className="text-xs font-medium text-green-800">AI解析について</p>
        <p className="mt-1 text-xs text-green-700 leading-relaxed">
          レシートの写真をアップロードすると、Claude AIが店舗名・日付・商品リスト・金額を自動で読み取ります。内容を確認してから保存できます。
        </p>
      </div>
    </div>
  );
}

function ManualTab({
  date,
  storeName,
  memo,
  items,
  totalAmount,
  isReimbursement,
  categoryOptions,
  onDateChange,
  onStoreNameChange,
  onMemoChange,
  onTotalAmountChange,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onIsReimbursementChange,
  onSubmit,
  isPending,
  error,
}: {
  date: string;
  storeName: string;
  memo: string;
  items: Item[];
  totalAmount: string;
  isReimbursement: boolean;
  categoryOptions: { value: string; label: string }[];
  onDateChange: (v: string) => void;
  onStoreNameChange: (v: string) => void;
  onMemoChange: (v: string) => void;
  onTotalAmountChange: (v: string) => void;
  onAddItem: () => void;
  onRemoveItem: (i: number) => void;
  onUpdateItem: (i: number, field: keyof Item, value: string) => void;
  onIsReimbursementChange: (v: boolean) => void;
  onSubmit: () => void;
  isPending: boolean;
  error: string | null;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">基本情報</h2>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">日付</span>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">店舗名</span>
            <input
              type="text"
              value={storeName}
              onChange={(e) => onStoreNameChange(e.target.value)}
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
                onChange={(e) => onTotalAmountChange(e.target.value)}
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
              onChange={(e) => onMemoChange(e.target.value)}
              placeholder="自由記入"
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </label>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div>
              <span className="text-sm font-medium text-slate-700">立替</span>
              <p className="text-xs text-slate-400">パートナーへの請求が必要な場合にON</p>
            </div>
            <button
              type="button"
              onClick={() => onIsReimbursementChange(!isReimbursement)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isReimbursement ? "bg-green-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isReimbursement ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
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
                    onClick={() => onRemoveItem(i)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={item.name}
                onChange={(e) => onUpdateItem(i, "name", e.target.value)}
                placeholder="品目名"
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">¥</span>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => onUpdateItem(i, "amount", e.target.value)}
                    placeholder="0"
                    className="block w-full rounded-lg border border-slate-200 bg-white pl-7 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <select
                  value={item.category}
                  onChange={(e) => onUpdateItem(i, "category", e.target.value)}
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
          onClick={onAddItem}
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
        onClick={onSubmit}
        disabled={isPending}
        className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white shadow-sm active:bg-green-700 transition-colors disabled:opacity-60"
      >
        {isPending ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
