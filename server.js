const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const root = __dirname;
const dataDir = path.join(root, "data");
const uploadDir = path.join(root, "uploads");
const stateFile = path.join(dataDir, "site.json");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml"
};

async function ensureDirs() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });
}

function send(response, status, body, type = "text/plain; charset=utf-8") {
  response.writeHead(status, { "Content-Type": type });
  response.end(body);
}

async function readBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 80 * 1024 * 1024) {
      throw new Error("Request body too large");
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function safeFolder(value) {
  return String(value || "images").replace(/[^a-z0-9_-]/gi, "") || "images";
}

async function handleApi(request, response, pathname) {
  if (pathname === "/api/state" && request.method === "GET") {
    try {
      const body = await fs.readFile(stateFile, "utf8");
      send(response, 200, body, "application/json; charset=utf-8");
    } catch {
      send(response, 200, "{}", "application/json; charset=utf-8");
    }
    return;
  }

  if (pathname === "/api/state" && request.method === "POST") {
    const body = await readBody(request);
    JSON.parse(body);
    await fs.writeFile(stateFile, body);
    send(response, 200, '{"ok":true}', "application/json; charset=utf-8");
    return;
  }

  if (pathname === "/api/upload" && request.method === "POST") {
    const body = JSON.parse(await readBody(request));
    const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(body.dataUrl || "");

    if (!match) {
      send(response, 400, '{"error":"Invalid image"}', "application/json; charset=utf-8");
      return;
    }

    const ext = match[1].includes("png") ? "png" : "jpg";
    const folder = safeFolder(body.folder);
    const targetDir = path.join(uploadDir, folder);
    await fs.mkdir(targetDir, { recursive: true });

    const name = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
    const target = path.join(targetDir, name);
    await fs.writeFile(target, Buffer.from(match[2], "base64"));

    send(response, 200, JSON.stringify({ path: `/uploads/${folder}/${name}` }), "application/json; charset=utf-8");
    return;
  }

  send(response, 404, '{"error":"Not found"}', "application/json; charset=utf-8");
}

async function serveStatic(response, pathname) {
  const cleanPath = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  const target = path.normalize(path.join(root, cleanPath));

  if (!target.startsWith(root)) {
    send(response, 403, "Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(target);
    const type = mimeTypes[path.extname(target).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": type });
    response.end(file);
  } catch {
    send(response, 404, "Not found");
  }
}

async function start() {
  await ensureDirs();

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);

      if (url.pathname.startsWith("/api/")) {
        await handleApi(request, response, url.pathname);
        return;
      }

      await serveStatic(response, url.pathname);
    } catch (error) {
      console.error(error);
      send(response, 500, JSON.stringify({ error: error.message }), "application/json; charset=utf-8");
    }
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`Gift site editor: http://127.0.0.1:${port}/index.html`);
    console.log(`Ready view:       http://127.0.0.1:${port}/view.html`);
  });
}

start();
