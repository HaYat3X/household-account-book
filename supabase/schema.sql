-- Run this in the Supabase SQL Editor

create extension if not exists "uuid-ossp";

create table receipts (
  id uuid primary key default uuid_generate_v4(),
  store_name text,
  date date not null,
  total_amount integer not null default 0,
  memo text,
  created_at timestamptz not null default now()
);

-- category は組み込みキー (FOOD 等) またはカスタムカテゴリ UUID を格納する
create table receipt_items (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  name text not null,
  amount integer not null,
  category text not null,
  created_at timestamptz not null default now()
);

-- カテゴリごとの予算上書き (組み込みカテゴリ用)
create table budget_overrides (
  category text primary key,
  amount integer not null
);

-- ユーザー定義カテゴリ
create table custom_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  budget integer,
  bar_color text not null default 'bg-slate-400',
  badge_class_bg text not null default 'bg-slate-100',
  badge_class_text text not null default 'text-slate-600',
  created_at timestamptz not null default now()
);

alter table receipts enable row level security;
alter table receipt_items enable row level security;
alter table budget_overrides enable row level security;
alter table custom_categories enable row level security;

-- 認証実装前の暫定ポリシー（全操作を許可）
create policy "allow_all_receipts" on receipts for all using (true) with check (true);
create policy "allow_all_receipt_items" on receipt_items for all using (true) with check (true);
create policy "allow_all_budget_overrides" on budget_overrides for all using (true) with check (true);
create policy "allow_all_custom_categories" on custom_categories for all using (true) with check (true);
