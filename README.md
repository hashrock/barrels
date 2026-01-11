# Metacolle

**Collection generation through ESM imports, not runtime directory scanning.**

ディレクトリを読むのではなく、importでコレクションを作る。コレクションを "runtime discovery" から "compile-time graph" へ。

## Concept

**フォルダの下に似た構造のファイルがあれば、それはコレクションである。**

スキーマを定義するまでもなく、同じフォルダに似た構造のファイルが複数あったら、それはもうコレクションです。Metacolleはそれを自動的に認識し、`_index.ts` を生成してimportグラフとしてexportします。

`export const meta` があるファイルがあれば、そのフォルダは自動的にコレクションとして認識されます。`_index.ts` を手動で作る必要はありません。

```
posts/
  page1.tsx   <- { title, createdAt, tags }
  page2.tsx   <- { title, createdAt, tags }
  page3.tsx   <- { title, createdAt }  <- tagsがなくてもOK
```

↓ 自動生成

```typescript
// 個別にもアクセスできる
export { meta as page1Meta, default as Page1 } from "./page1.tsx";
export { meta as page2Meta, default as Page2 } from "./page2.tsx";
export { meta as page3Meta, default as Page3 } from "./page3.tsx";

// 型も自動生成（ないものはoptional）
export interface Meta {
  title: string;
  createdAt: string;
  tags?: string[];  // page3にはないのでoptional
}

// コレクションとしてまとめて使える
export const posts = [
  { meta: page1Meta, Component: Page1 },
  { meta: page2Meta, Component: Page2 },
  { meta: page3Meta, Component: Page3 },
];
```

### 使う側はシンプル

```typescript
import { posts } from "./posts/_index";

// 記事一覧
posts.map(({ meta }) => (
  <li>{meta.title} - {meta.createdAt}</li>
));

// 記事を表示
posts.map(({ meta, Component }) => (
  <article>
    <h1>{meta.title}</h1>
    <Component />
  </article>
));
```

魔術的なことは何も起きません。ただのimportとforです。

## Why Metacolle?

### vs. File-based Routing / Runtime Directory Scanning

多くのフレームワークはファイルベースルーティングやContent Collectionsで `fs.readdir` / `glob` を使った**runtime file discovery**を行います。これには以下の課題があります：

- **環境差による不安定性** - watch対象にファイルI/Oが絡むことで、OS/CI/エディタ間で差異が発生しやすい
- **ツールチェーンからの不可視性** - "どのファイルが依存に入っているか"をバンドラやTypeScriptが追跡できない
- **専用プラグインへの依存** - 各フレームワーク固有のintegrationやextensionが必要になりがち

Metacolleは**ESM importによる依存グラフ**としてコレクションを構成するため：

- **Compiler-visible dependency graph** - watcher/compiler/typecheckerが自然に依存を追跡
- **Deterministic builds** - 環境差の影響を受けにくい安定したビルド
- **Tooling-native** - 専用プラグインなしで既存のTS/ESMツールチェーンがそのまま使える
- **リファクタリング対応** - rename/moveしてもIDEが追跡、dead code eliminationも効く

### vs. Schema-first Content Collections

多くのContent Collectionsは「まずスキーマを定義」するschema-firstアプローチです。これは厳密ですが、エラーから始まる体験になりがちです。

Metacolleは**progressive typing**アプローチ：

- **Schema last, not schema first** - データから始めて、必要に応じて型を固くできる
- **探索的に始められる** - 最初からスキーマを決めなくても動く
- **段階的な移行** - 既存プロジェクトに少しずつ導入可能

### Comparison

|  | Runtime Discovery | Metacolle |
|--|-------------------|-----------|
| 収集のタイミング | 実行時（fs/glob） | コンパイル時（import graph） |
| 依存の可視性 | ツールチェーンから見えにくい | watcher/compiler/typecheckerが追跡可能 |
| ビルドの決定性 | 環境差の影響が出やすい | 依存グラフに基づき安定 |
| 拡張コスト | 専用integrationが必要になりがち | 既存のTS/ESMに乗る |
| スキーマ定義 | 必須（schema-first） | 任意（progressive typing） |

## Features

- **Auto-detect collections** - `export const meta` があるファイルがあれば自動的にコレクションとして認識
- **Automatic index file generation** - ディレクトリをスキャンして全TS/JSファイルのexportを生成
- **Collection as array** - `{ meta, Component }` 形式の配列を自動生成
- **Auto type inference** - metaの型を自動推論、存在しないプロパティはoptionalに
- **Watch mode** - ファイル変更を監視して自動更新
- **Metacolle Studio** - Web UIでmetaをテーブル編集
- **TypeScript and JavaScript support** - `.ts`/`.tsx` と `.js`/`.jsx` の両方に対応

## Installation

```bash
npm install metacolle
```

## CLI Usage

### Update

`export const meta` があるファイルを含むディレクトリを自動検出し、indexファイルを生成・更新:

```bash
metacolle update
# または単に
metacolle
```

### Initialize (optional)

明示的に `_index.ts` を作成したい場合:

```bash
metacolle init ./posts
```

JavaScript用に `_index.js` を作成:

```bash
metacolle init --js ./posts
```

> Note: `init` は必須ではありません。`export const meta` があるファイルがあれば、`update` 時に自動的に `_index.ts` が生成されます。

### Watch

ファイル変更を監視して自動更新:

```bash
metacolle watch
```

### Studio

Web UIでmetaを編集:

```bash
metacolle studio
```

`http://localhost:3456` でテーブル形式のエディタが起動します。

- metaの値を編集
- 新規ファイルの追加
- ファイルの削除

## Library Usage

```typescript
import {
  updateBarrels,
  watchBarrels,
  generateBarrel,
} from "metacolle";

// 全indexファイルを更新
const results = updateBarrels("./src");

// 監視モード
const watcher = watchBarrels("./src", {
  onUpdate: (result) => {
    console.log(`Updated: ${result.path}`);
  },
});

watcher.close();
```

## How It Works

各ファイルは `meta` と `default` をexportする想定:

```typescript
// posts/my-first-post.tsx
export const meta = {
  title: "My First Post",
  createdAt: "2026-01-07",
  tags: ["typescript", "blog"],
};

export default function MyFirstPost() {
  return (
    <article>
      <h1>{meta.title}</h1>
      <p>Hello world!</p>
    </article>
  );
}
```

Metacolleは `_index.ts` を生成:

```typescript
// posts/_index.ts (auto-generated)
export { meta as myFirstPostMeta, default as MyFirstPost } from "./my-first-post.tsx";

export interface Meta {
  createdAt: string;
  tags: string[];
  title: string;
}

export const posts = [
  { meta: myFirstPostMeta, Component: MyFirstPost },
];
```

## Use Cases

これらはすべて「collection + meta」で同型に扱えます：

### Pages / Routes

File-based routerの補助として、ページのメタデータを集約：

```typescript
// pages/_index.ts から
import { pages } from "./pages/_index";

// ナビゲーション生成
const nav = pages.map(({ meta }) => ({
  href: meta.path,
  label: meta.title,
}));
```

### Component Docs / Examples Gallery

コンポーネントとそのドキュメントを一元管理：

```typescript
// components/_index.ts から
import { components } from "./components/_index";

// Storybookライクなギャラリー
components.map(({ meta, Component }) => (
  <section>
    <h2>{meta.name}</h2>
    <p>{meta.description}</p>
    <Component {...meta.defaultProps} />
  </section>
));
```

### Icon Catalog / Asset Registry

アイコンやアセットをカタログ化：

```typescript
// icons/_index.ts から
import { icons } from "./icons/_index";

// アイコンピッカー
const IconPicker = () => (
  <div className="grid">
    {icons.map(({ meta, Component }) => (
      <button title={meta.name}>
        <Component size={24} />
      </button>
    ))}
  </div>
);
```

## FAQ

### 「結局 index.ts の自動生成ツールでは？」

はい、index fileを生成します。ただし目的はDRYではなく、**discovery をコンパイラの依存グラフに移動させること**です。

- Runtime file discoveryを排除し、tooling-nativeに
- watch/build/type/refactorが自然に動作

### 生成ファイルはコミットすべき？

どちらでも動作しますが、以下のパターンが推奨です：

- **コミットする場合** - CIでの再生成不要、差分で変更が追跡可能
- **コミットしない場合** - prebuildで生成（`"prebuild": "metacolle update"`）、.gitignoreに `_index.ts` を追加

### watchモードでの更新ポリシーは？

ファイルの追加/削除/変更を検知して、該当ディレクトリの `_index.ts` のみを再生成します。変更のないディレクトリは更新されません。

## License

ISC
