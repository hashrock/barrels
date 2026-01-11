import { BarrelInfo } from "../../api.js";
interface CollectionListProps {
    barrels: BarrelInfo[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onNavigate: (index: number) => void;
}
export declare function CollectionList({ barrels, selectedIndex, onSelect, onNavigate, }: CollectionListProps): import("react/jsx-runtime").JSX.Element;
export {};
