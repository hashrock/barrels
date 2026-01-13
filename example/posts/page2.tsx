export const meta = {
  title: "2番目の投稿",
  createdAt: "2026-01-08",
  tags: ["deno", "metacolle"]
};

export default function Page2() {
  return (
    <article>
      <h1>{meta.title}</h1>
      <p>バレルファイルのテスト用です。</p>
    </article>
  );
}