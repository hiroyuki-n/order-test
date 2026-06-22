# 受発注・KDS システム

複数店舗からの発注を製造拠点で一元管理し、ステータスを **Supabase Realtime** でリアルタイム同期する受発注・KDS（キッチンディスプレイシステム）です。

- フロントエンド: **Nuxt 3 (TypeScript)**
- スタイル: **Tailwind CSS**
- バックエンド / DB: **Supabase (PostgreSQL + Realtime)**
- デプロイ: **Cloudflare Pages**（`nitro.preset = 'cloudflare-pages'`）

## 画面構成

| パス       | 役割       | 概要 |
| ---------- | ---------- | ---- |
| `/`        | トップ     | 各画面への入り口 |
| `/store`   | 店舗画面   | 店舗を選び、商品・数量を指定して発注。自店舗の注文ステータスをリアルタイム表示 |
| `/factory` | 製造 (KDS) | 全店舗の注文を古い順に表示。確認・製造中・完了を切り替え |
| `/admin`   | 管理       | 本日の総注文数・商品別/店舗別サマリーのダッシュボード |

各画面は簡易パスワードで保護されています（初期値: `store123` / `factory123` / `admin123`）。

---

## セットアップ手順

### 1. 依存インストール

```bash
npm install
```

### 2. Supabase プロジェクトを用意し、テーブルを作成

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. ダッシュボードの **SQL Editor** を開き、[`supabase/schema.sql`](./supabase/schema.sql) の中身を貼り付けて実行
   - テーブル（stores / products / orders / order_items）
   - RLS ポリシー（anon に全許可。簡易構成）
   - Realtime 配信の有効化（`supabase_realtime` publication への追加）
   - 初期データ（店舗3件・商品5件）
   がまとめて作成されます。

### 3. 環境変数を設定

`.env.example` をコピーして `.env` を作成し、Supabase の値を設定します。
（URL とキーは Supabase の **Project Settings > API** から取得）

```bash
cp .env.example .env
```

```dotenv
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_KEY=your-anon-public-key

# 任意: 各画面のアクセスパスワードを変更可能
NUXT_PUBLIC_STORE_PASSWORD=store123
NUXT_PUBLIC_FACTORY_PASSWORD=factory123
NUXT_PUBLIC_ADMIN_PASSWORD=admin123
```

### 4. 開発サーバー起動

```bash
npm run dev
# → http://localhost:3000
```

動作確認: ブラウザで `/store` と `/factory` を別タブ（または別ウィンドウ）で開き、店舗側で発注 → 製造側に即時表示、製造側でステータス変更 → 店舗側に即時反映されることを確認してください。

---

## Realtime の仕組み（実装サンプル）

リアルタイム購読ロジックは [`composables/useOrders.ts`](./composables/useOrders.ts) に集約しています。
`orders` / `order_items` テーブルの変更を購読し、変更があった注文だけを取得し直して一覧を最新化します。

```ts
const channel = supabase
  .channel('orders-realtime')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      if (payload.eventType === 'DELETE') removeOne(payload.old.id)
      else refetchOne(payload.new.id)
    })
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'order_items' },
    (payload) => refetchOne((payload.new ?? payload.old).order_id))
  .subscribe()
```

> Realtime が届かない場合は、Supabase ダッシュボードの **Database > Replication**（または `schema.sql` の publication 設定）で `orders` / `order_items` が `supabase_realtime` に含まれているか確認してください。

---

## Cloudflare Pages へのデプロイ

`nuxt.config.ts` で `nitro.preset: 'cloudflare-pages'` を設定済みです。

```bash
npm run build
```

- ビルド出力: `dist/`（または `.output/public` + Functions）
- Cloudflare Pages のプロジェクト設定:
  - Build command: `npm run build`
  - Build output directory: `dist`
  - 環境変数に `SUPABASE_URL` / `SUPABASE_KEY`（および任意の `NUXT_PUBLIC_*` パスワード）を設定

---

## ディレクトリ構成

```
.
├─ assets/css/main.css          # Tailwind エントリ
├─ components/StatusBadge.vue    # ステータスバッジ（共通）
├─ composables/
│  ├─ useAppAuth.ts             # 簡易パスワード認証
│  └─ useOrders.ts              # 注文取得 + Realtime 購読
├─ layouts/default.vue          # 共通ヘッダー/ナビ
├─ middleware/auth.global.ts    # 画面ごとのアクセス制御
├─ pages/
│  ├─ index.vue                 # トップ
│  ├─ login.vue                 # パスワード入力
│  ├─ store.vue                 # 店舗画面
│  ├─ factory.vue               # 製造画面 (KDS)
│  └─ admin.vue                 # 管理ダッシュボード
├─ types/database.types.ts      # Supabase スキーマの型定義
├─ supabase/schema.sql          # DDL + RLS + Realtime + シード
└─ nuxt.config.ts
```

## 認証についての注意

本アプリの認証は「簡易パスワード（Cookie 保存）」による**簡易的なアクセス制限**です。
本番で厳密なユーザー管理が必要な場合は、Supabase Auth と RLS ポリシーへ置き換えてください
（`schema.sql` の `allow_all_*` ポリシーを、ロール/ユーザー単位の条件に変更します）。
