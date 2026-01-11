export {meta as page1Meta, default as Page1} from "./page1.tsx";
export {meta as page2Meta, default as Page2} from "./page2.tsx";

export interface Meta {
  createdAt: string;
  tags: string[];
  title: string;
}

export const posts = [
  { meta: page1Meta, Component: Page1 },
  { meta: page2Meta, Component: Page2 },
];
