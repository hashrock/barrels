import { BarrelInfo } from "../../api.js";
interface TableViewProps {
    barrel: BarrelInfo;
    selectedIndex: number;
    onNavigate: (index: number) => void;
    onEdit: (index: number) => void;
    onBack: () => void;
    onRefresh: () => void;
    message: string | null;
    setMessage: (msg: string | null) => void;
}
export declare function TableView({ barrel, selectedIndex, onNavigate, onEdit, onBack, onRefresh, message, setMessage, }: TableViewProps): import("react/jsx-runtime").JSX.Element;
export {};
