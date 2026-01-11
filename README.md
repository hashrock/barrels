# Barrels

Barrel file generator for SSG (Static Site Generator) projects.

## Concept

**フォルダの下に似た構造のファイルがあれば、それはコレクションである。**

スキーマを定義するまでもなく、同じフォルダに似た構造のファイルが複数あったら、それはもうコレクションです。Barrelsはそれを自動的に認識し、配列としてexportしてくれます。

`export const meta` があるファイルがあれば、そのフォルダは自動的にコレクションとして認識されます。`_barrel.ts` を手動で作る必要はありません。

```
posts/
  page1.tsx   ← { title, createdAt, tags }
  page2.tsx   ← { title, createdAt, tags }
  page3.tsx   ← { title, createdAt }  ← tagsがなくてもOK
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
import { posts } from "./posts/_barrel";

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

## Features

- **Auto-detect collections** - `export const meta` があるファイルがあれば自動的にコレクションとして認識
- **Automatic barrel file generation** - ディレクトリをスキャンして全TS/JSファイルのexportを生成
- **Collection as array** - `{ meta, Component }` 形式の配列を自動生成
- **Auto type inference** - metaの型を自動推論、存在しないプロパティはoptionalに
- **Watch mode** - ファイル変更を監視して自動更新
- **Barrels Studio** - Web UIでmetaをテーブル編集
- **TypeScript and JavaScript support** - `.ts`/`.tsx` と `.js`/`.jsx` の両方に対応

## Installation

```bash
npm install barrels
```

## CLI Usage

### Update

`export const meta` があるファイルを含むディレクトリを自動検出し、barrelファイルを生成・更新:

```bash
barrels update
# または単に
barrels
```

### Initialize (optional)

明示的に `_barrel.ts` を作成したい場合:

```bash
barrels init ./posts
```

JavaScript用に `_barrel.js` を作成:

```bash
barrels init --js ./posts
```

> Note: `init` は必須ではありません。`export const meta` があるファイルがあれば、`update` 時に自動的に `_barrel.ts` が生成されます。

### Watch

ファイル変更を監視して自動更新:

```bash
barrels watch
```

### Studio

Web UIでmetaを編集:

```bash
barrels studio
```

`http://localhost:3456` でテーブル形式のエディタが起動します。

- metaの値を編集
- 新規ファイルの追加
- ファイルの削除

## Library Usage

```typescript
import {
  initBarrel,
  updateBarrels,
  watchBarrels,
  generateBarrel,
} from "barrels";

// Barrel初期化
initBarrel("./posts", "ts");

// 全barrelファイルを更新
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

Barrelsは `_barrel.ts` を生成:

```typescript
// posts/_barrel.ts (auto-generated)
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

- **SSGブログ/ドキュメントサイト** - 記事コレクションの管理
- **コンポーネントライブラリ** - ディレクトリからまとめてre-export
- **ページルーティング** - ページメタデータの集約
- **コンテンツコレクション** - 投稿、記事などのコンテンツファイル整理

## License

ISC
