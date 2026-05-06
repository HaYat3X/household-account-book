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

create table receipt_items (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  name text not null,
  amount integer not null,
  category text not null check (category in ('FOOD', 'DAILY', 'UTILITY', 'RENT', 'SAVING', 'OTHER')),
  created_at timestamptz not null default now()
);

alter table receipts enable row level security;
alter table receipt_items enable row level security;

-- 認証実装前の暫定ポリシー（全操作を許可）
create policy "allow_all_receipts" on receipts for all using (true) with check (true);
create policy "allow_all_receipt_items" on receipt_items for all using (true) with check (true);
