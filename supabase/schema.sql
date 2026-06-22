-- =============================================================
-- 受発注・KDS システム  Supabase スキーマ
-- Supabase の SQL Editor にそのまま貼り付けて実行してください。
-- =============================================================

-- ------------------------------------------------------------
-- 1. 注文ステータス用の ENUM 型
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum ('ordered', 'checked', 'cooking', 'completed');
  end if;
end$$;

-- ------------------------------------------------------------
-- 2. テーブル定義
-- ------------------------------------------------------------

-- 店舗マスタ
create table if not exists public.stores (
  id         bigint generated always as identity primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

-- 商品マスタ
create table if not exists public.products (
  id         bigint generated always as identity primary key,
  name       text not null,
  price      integer not null default 0,
  created_at timestamptz not null default now()
);

-- 注文メイン
create table if not exists public.orders (
  id         bigint generated always as identity primary key,
  store_id   bigint not null references public.stores (id) on delete cascade,
  status     order_status not null default 'ordered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 注文明細
create table if not exists public.order_items (
  id         bigint generated always as identity primary key,
  order_id   bigint not null references public.orders (id) on delete cascade,
  product_id bigint not null references public.products (id),
  quantity   integer not null default 1 check (quantity > 0)
);

-- よく使う検索用インデックス
create index if not exists idx_orders_store_id   on public.orders (store_id);
create index if not exists idx_orders_created_at on public.orders (created_at);
create index if not exists idx_orders_status     on public.orders (status);
create index if not exists idx_order_items_order_id on public.order_items (order_id);

-- ------------------------------------------------------------
-- 3. updated_at 自動更新トリガー
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. Row Level Security (RLS)
--    本アプリはアプリ側の簡易パスワードでアクセス制御するため、
--    anon ロールに対して全操作を許可するポリシーを付与する。
--    （本番で厳密に制御したい場合は Supabase Auth + ポリシーへ置き換える）
-- ------------------------------------------------------------
alter table public.stores      enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

do $$
declare t text;
begin
  foreach t in array array['stores','products','orders','order_items'] loop
    execute format('drop policy if exists "allow_all_%1$s" on public.%1$I;', t);
    execute format(
      'create policy "allow_all_%1$s" on public.%1$I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end$$;

-- ------------------------------------------------------------
-- 5. Realtime 配信の有効化
--    （注文の追加・ステータス更新をリアルタイムに配信する）
-- ------------------------------------------------------------
do $$
begin
  -- publication が無ければ作成
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end$$;

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;

-- 更新前後の行を含めて配信（DELETE/UPDATE の old レコードを取得可能に）
alter table public.orders      replica identity full;
alter table public.order_items replica identity full;

-- ------------------------------------------------------------
-- 6. 初期データ（シード）
-- ------------------------------------------------------------
insert into public.stores (name)
select x from (values ('店舗A'), ('店舗B'), ('店舗C')) as v(x)
where not exists (select 1 from public.stores);

insert into public.products (name, price)
select n, p from (values
  ('プリン', 320),
  ('ショートケーキ', 480),
  ('チーズケーキ', 520),
  ('シュークリーム', 220),
  ('ロールケーキ', 1200)
) as v(n, p)
where not exists (select 1 from public.products);
