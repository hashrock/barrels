import React from "react";
import type { BarrelInfo } from "../types";
interface Props {
    barrel: BarrelInfo;
    onUpdateMeta: (fileName: string, meta: Record<string, unknown>) => void;
    onCreateFile: (fileName: string, meta: Record<string, unknown>) => void;
    onDeleteFile: (fileName: string) => void;
}
export declare function FileTable({ barrel, onUpdateMeta, onCreateFile, onDeleteFile, }: Props): React.JSX.Element;
export {};
