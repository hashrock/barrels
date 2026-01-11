import { FileInfo } from "../../api.js";
interface ItemEditorProps {
    file: FileInfo;
    barrelDir: string;
    onSave: () => void;
    onCancel: () => void;
}
export declare function ItemEditor({ file, barrelDir, onSave, onCancel }: ItemEditorProps): import("react/jsx-runtime").JSX.Element;
export {};
