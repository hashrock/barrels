import React from "react";
import type { BarrelInfo } from "../types";
interface Props {
    barrels: BarrelInfo[];
    selectedPath: string | null;
    onSelect: (path: string) => void;
}
export declare function BarrelList({ barrels, selectedPath, onSelect }: Props): React.JSX.Element;
export {};
