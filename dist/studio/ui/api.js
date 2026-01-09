const API_BASE = "/api";
export async function fetchBarrels() {
    const res = await fetch(`${API_BASE}/barrels`);
    if (!res.ok)
        throw new Error("Failed to fetch barrels");
    return res.json();
}
export async function fetchBarrel(barrelPath) {
    const res = await fetch(`${API_BASE}/barrels/${encodeURIComponent(barrelPath)}/files`);
    if (!res.ok)
        throw new Error("Failed to fetch barrel");
    return res.json();
}
export async function updateFileMeta(barrelPath, fileName, meta) {
    const res = await fetch(`${API_BASE}/barrels/${encodeURIComponent(barrelPath)}/files/${encodeURIComponent(fileName)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta }),
    });
    if (!res.ok)
        throw new Error("Failed to update file");
}
export async function createFile(barrelPath, fileName, meta) {
    const res = await fetch(`${API_BASE}/barrels/${encodeURIComponent(barrelPath)}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, meta }),
    });
    if (!res.ok)
        throw new Error("Failed to create file");
}
export async function deleteFile(barrelPath, fileName) {
    const res = await fetch(`${API_BASE}/barrels/${encodeURIComponent(barrelPath)}/files/${encodeURIComponent(fileName)}`, { method: "DELETE" });
    if (!res.ok)
        throw new Error("Failed to delete file");
}
