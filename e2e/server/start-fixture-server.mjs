import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { readWorkspaceAliases } from "./resolve-workspace.mjs";

const packageDir = process.env.PACKAGE_DIR;
const packageName = process.env.PACKAGE_NAME ?? "package";
const port = Number(process.env.E2E_PORT ?? 4173);

if (!packageDir) {
  throw new Error("PACKAGE_DIR is required to start the E2E fixture server");
}

const fixtureDir = path.join(packageDir, "e2e/fixture");
const bundleDir = path.join(fixtureDir, ".bundled");
const bundlePath = path.join(bundleDir, "app.js");
const entryPath = path.join(fixtureDir, "main.ts");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

if (!existsSync(entryPath)) {
  throw new Error(`Missing fixture entry: ${entryPath}`);
}

mkdirSync(bundleDir, { recursive: true });

const workspaceAliases = readWorkspaceAliases();

/** Prefer longer import prefixes so subpaths win over package roots. */
const sortedWorkspaceAliases = Object.fromEntries(
  Object.entries(workspaceAliases).sort(([left], [right]) => right.length - left.length)
);

/** @type {import('esbuild').Plugin} */
const workspaceAliasPlugin = {
  name: "workspace-alias",
  setup(build) {
    for (const [alias, target] of Object.entries(sortedWorkspaceAliases)) {
      build.onResolve({ filter: new RegExp(`^${escapeRegExp(alias)}($|/)`) }, (args) => {
        const suffix = args.path.slice(alias.length);
        const resolved = suffix.length > 0 ? path.join(target, `${suffix.slice(1)}.ts`) : target;
        return { path: resolved };
      });
    }
  },
};

/**
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} filePath
 * @returns {Promise<string>}
 */
function readTextFile(filePath) {
  return readFile(filePath, "utf8");
}

/**
 * @param {import("node:http").IncomingMessage} request
 * @returns {string}
 */
function requestPath(request) {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  return decodeURIComponent(url.pathname);
}

async function buildFixtureBundle() {
  await esbuild.build({
    entryPoints: [entryPath],
    outfile: bundlePath,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    sourcemap: "inline",
    logLevel: "silent",
    plugins: [workspaceAliasPlugin],
    define: {
      "process.env.NODE_ENV": '"test"',
    },
    alias: {
      alpinejs: path.join(root, "node_modules/alpinejs/dist/module.esm.js"),
    },
  });
}

/** @type {import("node:http").Server | null} */
let server = null;

async function startServer() {
  await buildFixtureBundle();

  server = createServer(async (request, response) => {
    try {
      const pathname = requestPath(request);

      if (pathname === "/__health") {
        response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
        response.end("ok");
        return;
      }

      if (pathname === "/" || pathname === "/index.html") {
        const html = await readTextFile(path.join(fixtureDir, "index.html"));
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end(html);
        return;
      }

      if (pathname === "/app.js") {
        const bundle = await readTextFile(bundlePath);
        response.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
        response.end(bundle);
        return;
      }

      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("not found");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end(message);
    }
  });

  await new Promise((resolve, reject) => {
    server?.once("error", reject);
    server?.listen(port, "127.0.0.1", () => {
      resolve(undefined);
    });
  });

  const address = server.address();
  const boundPort = typeof address === "object" && address ? address.port : port;
  await writeFile(path.join(bundleDir, "port.txt"), String(boundPort), "utf8");

  process.stdout.write(
    `[e2e:${packageName}] fixture server ready on http://127.0.0.1:${boundPort}\n`
  );
}

function shutdown(signal) {
  process.stdout.write(`[e2e:${packageName}] shutting down (${signal})\n`);
  if (server) {
    server.close(() => {
      process.exit(0);
    });
    return;
  }
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

startServer().catch((error) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
