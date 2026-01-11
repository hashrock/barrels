import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { getBarrels, getBarrel, updateFileMeta, createFile, deleteFile, regenerateBarrel, } from "./api.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIME_TYPES = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
};
function getMimeType(filePath) {
    const ext = path.extname(filePath);
    return MIME_TYPES[ext] || "application/octet-stream";
}
function sendJson(res, data, status = 200) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}
function sendError(res, message, status = 400) {
    sendJson(res, { error: message }, status);
}
async function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            }
            catch {
                reject(new Error("Invalid JSON"));
            }
        });
        req.on("error", reject);
    });
}
function handleApi(req, res, baseDir) {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method || "GET";
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }
    // GET /api/barrels - List all barrels
    if (method === "GET" && pathname === "/api/barrels") {
        const barrels = getBarrels(baseDir);
        sendJson(res, barrels);
        return;
    }
    // GET /api/barrels/:path - Get single barrel
    const barrelMatch = pathname.match(/^\/api\/barrels\/(.+?)\/files$/);
    if (method === "GET" && barrelMatch) {
        const barrelPath = decodeURIComponent(barrelMatch[1]);
        const barrel = getBarrel(baseDir, barrelPath);
        if (!barrel) {
            sendError(res, "Barrel not found", 404);
            return;
        }
        sendJson(res, barrel);
        return;
    }
    // PUT /api/barrels/:path/files/:file - Update file meta
    const updateMatch = pathname.match(/^\/api\/barrels\/(.+?)\/files\/(.+)$/);
    if (method === "PUT" && updateMatch) {
        const barrelPath = decodeURIComponent(updateMatch[1]);
        const fileName = decodeURIComponent(updateMatch[2]);
        const barrel = getBarrel(baseDir, barrelPath);
        if (!barrel) {
            sendError(res, "Barrel not found", 404);
            return;
        }
        const file = barrel.files.find((f) => f.name === fileName);
        if (!file) {
            sendError(res, "File not found", 404);
            return;
        }
        parseBody(req)
            .then((body) => {
            const { meta } = body;
            updateFileMeta(file.path, meta);
            regenerateBarrel(barrel.dir);
            sendJson(res, { success: true });
        })
            .catch((err) => sendError(res, err.message));
        return;
    }
    // POST /api/barrels/:path/files - Create new file
    const createMatch = pathname.match(/^\/api\/barrels\/(.+?)\/files$/);
    if (method === "POST" && createMatch) {
        const barrelPath = decodeURIComponent(createMatch[1]);
        const barrel = getBarrel(baseDir, barrelPath);
        if (!barrel) {
            sendError(res, "Barrel not found", 404);
            return;
        }
        parseBody(req)
            .then((body) => {
            const { fileName, meta } = body;
            if (!fileName) {
                sendError(res, "fileName is required");
                return;
            }
            const filePath = createFile(barrel.dir, fileName, meta || { title: "" });
            regenerateBarrel(barrel.dir);
            sendJson(res, { success: true, path: filePath });
        })
            .catch((err) => sendError(res, err.message));
        return;
    }
    // DELETE /api/barrels/:path/files/:file - Delete file
    const deleteMatch = pathname.match(/^\/api\/barrels\/(.+?)\/files\/(.+)$/);
    if (method === "DELETE" && deleteMatch) {
        const barrelPath = decodeURIComponent(deleteMatch[1]);
        const fileName = decodeURIComponent(deleteMatch[2]);
        const barrel = getBarrel(baseDir, barrelPath);
        if (!barrel) {
            sendError(res, "Barrel not found", 404);
            return;
        }
        deleteFile(barrel.dir, fileName);
        regenerateBarrel(barrel.dir);
        sendJson(res, { success: true });
        return;
    }
    sendError(res, "Not found", 404);
}
function serveStatic(req, res) {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    let pathname = url.pathname;
    // Serve index.html for root and SPA routes
    if (pathname === "/" || !pathname.includes(".")) {
        pathname = "/index.html";
    }
    // Look for static files in dist/studio
    const staticDir = path.join(__dirname, "..", "..", "dist", "studio");
    const filePath = path.join(staticDir, pathname);
    // Prevent directory traversal
    if (!filePath.startsWith(staticDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { "Content-Type": getMimeType(filePath) });
        res.end(content);
    }
    else {
        res.writeHead(404);
        res.end("Not Found");
    }
}
export function startStudio(baseDir, port = 3456) {
    const server = http.createServer((req, res) => {
        const url = req.url || "/";
        if (url.startsWith("/api/")) {
            handleApi(req, res, baseDir);
        }
        else {
            serveStatic(req, res);
        }
    });
    server.listen(port, () => {
        console.log(`\nMetacolle Studio running at http://localhost:${port}`);
        console.log(`Watching: ${path.resolve(baseDir)}`);
        console.log("\nPress Ctrl+C to stop\n");
    });
    return server;
}
