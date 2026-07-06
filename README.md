# RouteCard

出発地・目的地・日時を指定した乗換ルートを検索し、時刻付きの行程カードとして保存・共有するアプリ。仕様の詳細は[docs/RouteCard仕様書.pdf](docs/RouteCard仕様書.pdf)を参照。

Googleマップの共有URLには出発時刻・電車の便情報が含まれないという課題に対し、時刻情報はRouteCard側で保持し、地図表示・ナビはGoogleマップに任せる設計。

## 構成

npm workspacesによるモノレポ。

```
RouteCard/
├── apps/mobile/        Expo (React Native + expo-router) アプリ。ルート検索・カード作成・共有・履歴管理（S1〜S4）
├── functions/           Cloud Functions。Routes API / Places APIのプロキシと、共有ページ(/r/{cardId})のSSR
├── packages/shared/     アプリとFunctionsで共有する型定義（RouteCard, Place, API入出力）
├── hosting/public/      Firebase Hostingの静的ファイル（共有ページ本体はCloud FunctionsによるSSR）
├── firebase.json        Hosting rewrite / Functions / Firestore / エミュレータ設定
├── firestore.rules      セキュリティルール
├── firestore.indexes.json
└── docs/                仕様書
```

全体構成は仕様書の「2. 全体構成」を参照：Expoアプリ ⇄ Cloud Functions ⇄ Firebase(Auth/Firestore/Hosting) ⇄ Google Maps Platform。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebaseプロジェクトの準備

1. [Firebaseコンソール](https://console.firebase.google.com/)でプロジェクトを作成
2. `.firebaserc`の`default`をプロジェクトIDに変更
3. Authentication で匿名認証を有効化
4. Firestore を作成し、`expiresAt`フィールドに対してTTLポリシーを設定（コンソールのFirestore > TTLポリシーから）
5. Google Cloud で Routes API / Places API (New) を有効化し、HTTPリファラ/IP制限＋API制限付きのAPIキーを発行

### 3. 環境変数

- `functions/.env.example` を `functions/.env` にコピーし、`GOOGLE_MAPS_API_KEY` / `HOSTING_DOMAIN` を設定
- `apps/mobile/.env.example` を `apps/mobile/.env` にコピーし、FirebaseのWebアプリ設定値を設定

### 4. 開発

```bash
# 共有パッケージのビルド（他workspaceから参照される型定義）
npm run shared:build

# Expoアプリ
npm run mobile

# Cloud Functions（エミュレータ）
npm run functions:serve
```

### 5. デプロイ

```bash
npm run shared:build
npm run functions:build
firebase deploy
```

## 開発ステップ（仕様書§9より）

1. API疎通: Cloud FunctionsからRoutes API（TRANSIT + departureTime）を叩き、行程JSONが取れることを確認
2. 共有ページ: 手動で作ったFirestoreデータを `/r/{cardId}` で表示できるところまで
3. アプリUI: S1→S2→S3の順で実装。共有シート連携まで
4. 履歴・複製・TTL: S4と運用まわり
5. 仕上げ: OGP、エラーハンドリング、予算アラート

## 既知の制約 / TODO

- `functions/src/routes/computeRoutes.ts`: Google Routes APIの実レスポンス構造（`transitDetails`配下のフィールド名等）は未検証。仕様書の開発ステップ1（API疎通確認）で実際のレスポンスに合わせて調整すること
- `apps/mobile/src/lib/firebase.ts`: Firebase Authの永続化が未設定（アプリ再起動でサインインし直しになる）
