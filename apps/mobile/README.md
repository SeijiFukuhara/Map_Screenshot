# RouteCard mobile app

出発地・目的地・日時を指定して乗換ルートを検索し、時刻付きの行程カードとして保存・共有するExpoアプリ。仕様の全体像は[../../docs/RouteCard仕様書.pdf](../../docs/RouteCard仕様書.pdf)を参照。

## セットアップ

リポジトリルートで一括install済みの場合はここでの`npm install`は不要（workspaces構成）。

1. `.env`をリポジトリルートの案内（[README](../../README.md)）に従って用意する
2. 開発サーバーを起動

   ```bash
   npm run mobile
   # または
   npx expo start
   ```

## 画面構成（`src/app/`）

| ファイル | 画面 |
| --- | --- |
| `index.tsx` | S1: ルート作成（出発地・目的地・日時入力、検索） |
| `route-select.tsx` | S2: ルート選択（候補一覧・詳細展開） |
| `card-edit.tsx` | S3: カード編集・共有（メモ入力、Firestore保存、共有シート起動） |
| `history.tsx` | S4: 履歴（再共有・複製・削除） |

画面間のルート検索state（出発地・目的地・候補・選択結果）は`src/lib/route-search-context.tsx`のReact Contextで受け渡す。

## 主なディレクトリ

- `src/lib/firebase.ts` — Firebase初期化（匿名認証・Firestore・Functions）
- `src/lib/api.ts` — Cloud Functions（`computeRoutes` / `placesAutocomplete`）の呼び出しラッパー
- `src/lib/cards.ts` — `routeCards`コレクションへのcreate/list/delete
- `src/components/place-input.tsx` — Places Autocomplete付きのテキスト入力

## 既知の制約 / TODO

- `src/lib/firebase.ts`: Auth永続化が未設定のため、アプリ再起動でサインインし直しになる。firebase JS SDKのReact Native向け永続化設定を確認して対応する。
