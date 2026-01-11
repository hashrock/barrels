export {meta as heartMeta, default as Heart} from "./heart.tsx";
export {meta as homeMeta, default as Home} from "./home.tsx";
export {meta as mailMeta, default as Mail} from "./mail.tsx";
export {meta as searchMeta, default as Search} from "./search.tsx";
export {meta as settingsMeta, default as Settings} from "./settings.tsx";
export {meta as userMeta, default as User} from "./user.tsx";

export interface Meta {
  category: string;
  name: string;
  tags: string[];
}

export const icons = [
  { meta: heartMeta, Component: Heart },
  { meta: homeMeta, Component: Home },
  { meta: mailMeta, Component: Mail },
  { meta: searchMeta, Component: Search },
  { meta: settingsMeta, Component: Settings },
  { meta: userMeta, Component: User },
];
