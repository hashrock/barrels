import React from "react";
interface Props {
    onCreateFile: (fileName: string, meta: Record<string, unknown>) => void;
    onClose: () => void;
}
export declare function CreateFileModal({ onCreateFile, onClose }: Props): React.JSX.Element;
export {};
