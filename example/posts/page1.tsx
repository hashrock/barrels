export const meta = {
  title: "最初の投稿",
  createdAt: "2026-01-07",
  tags: ["typescript", "cli"],
};

export default function Page1() {
  return (
    <article>
      <h1>{meta.title}</h1>
      <p>これはサンプル投稿です。</p>
    </article>
  );
}
