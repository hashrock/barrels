import React from "react";
import type { FileInfo } from "../types";
interface Props {
    file: FileInfo;
    onSave: (meta: Record<string, unknown>) => void;
    onClose: () => void;
}
export declare function MetaEditor({ file, onSave, onClose }: Props): React.JSX.Element;
export {};
