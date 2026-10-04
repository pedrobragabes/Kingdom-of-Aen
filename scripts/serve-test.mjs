// Loopback-only static server for browser tests; repository metadata is private.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
};
createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405).end();
      return;
    }
    const pathname = decodeURIComponent(
      new URL(request.url, "http://127.0.0.1").pathname,
    );
    const relative = pathname === "/" ? "/index.html" : pathname;
    if (
      relative.includes("\\") ||
      !(
        relative === "/index.html" ||
        ["/js/", "/css/", "/img/", "/audio/"].some((prefix) =>
          relative.startsWith(prefix),
        )
      )
    ) {
      response.writeHead(404).end();
      return;
    }
    const path = resolve(root, `.${relative}`);
    if (!path.startsWith(root + sep)) {
      response.writeHead(404).end();
      return;
    }
    const body = await readFile(path);
    response.writeHead(200, {
      "Content-Type": `${mime[extname(path)] || "application/octet-stream"}; charset=utf-8`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404).end();
  }
}).listen(3280, "127.0.0.1");
