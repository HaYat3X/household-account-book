-- 1年以上前のレシートデータを自動削除する設定
-- Supabase SQL Editor で実行してください
--
-- 【前提】Supabase Dashboard > Database > Extensions で
--         "pg_cron" を有効化してから実行すること
--
-- 削除対象: receipts.date が1年以上前の行
--   receipt_items, reimbursements は ON DELETE CASCADE で自動削除される

-- pg_cron 拡張の有効化（Dashboardで有効化済みなら不要）
create extension if not exists pg_cron;

-- 削除関数
create or replace function delete_old_receipts()
returns void
language plpgsql
as $$
begin
  delete from receipts
  where date < current_date - interval '1 year';
end;
$$;

-- 毎日 午前3時(JST) = 18:00 UTC に実行
-- 既に同名のジョブがあれば上書き
select cron.unschedule('delete-old-receipts')
where exists (
  select 1 from cron.job where jobname = 'delete-old-receipts'
);

select cron.schedule(
  'delete-old-receipts',
  '0 18 * * *',
  'select delete_old_receipts()'
);

-- 登録確認
select jobid, jobname, schedule, command
from cron.job
where jobname = 'delete-old-receipts';
