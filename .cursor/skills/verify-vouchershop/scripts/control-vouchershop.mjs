#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import path from "node:path";

const ROOT_DEFAULT = findRepoRoot(process.cwd());
const STATE_PATH = "/tmp/vouchershop-verify/current.json";
const VERIFY_ROOT = "/tmp/vouchershop-verify";
const DEFAULT_PORT = 4173;

function findRepoRoot(start) {
  let dir = path.resolve(start);
  while (true) {
    if (existsSync(path.join(dir, "package.json")) && existsSync(path.join(dir, "src", "lib", "db.ts"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(start);
    dir = parent;
  }
}

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function usage() {
  console.log(`control-vouchershop <command>

  launch [--port 4173] [--in-place] [--repo <abs>]
  doctor [--url http://127.0.0.1:4173]
  http <METHOD> <path> [json-body] [--out file]
  wait-paid --order-id <id> [--timeout-ms 20000]
  save-html <path> [--out file]
  demo-digest --order-id <id>
  cleanup
`);
}

function parseArgs(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) flags[key] = true;
      else {
        flags[key] = next;
        i += 1;
      }
    } else rest.push(token);
  }
  return { flags, rest };
}

function readState() {
  if (!existsSync(STATE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return null;
  }
}

function writeState(state) {
  mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

function pidAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function portFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function fetchText(url, init = {}) {
  const res = await fetch(url, { redirect: "manual", ...init });
  const text = await res.text();
  return { res, text };
}

function baseUrl(flags) {
  if (flags.url) return String(flags.url).replace(/\/$/, "");
  const state = readState();
  if (state?.url) return String(state.url).replace(/\/$/, "");
  return `http://127.0.0.1:${DEFAULT_PORT}`;
}

function evidenceDir(runId) {
  return path.join(VERIFY_ROOT, "evidence", runId);
}

async function cmdDoctor(flags) {
  const url = baseUrl(flags);
  const failures = [];
  let home;
  try {
    home = await fetchText(`${url}/`);
  } catch (error) {
    die(`doctor: cannot reach ${url}/ (${error instanceof Error ? error.message : error})`);
  }
  if (home.res.status !== 200) failures.push(`GET / → ${home.res.status}`);
  if (!home.text.includes("AgentiX")) failures.push("home missing AgentiX");
  if (!home.text.includes("Buy digital vouchers")) {
    failures.push("home missing Buy digital vouchers");
  }

  let products;
  try {
    products = await fetchText(`${url}/api/products`);
  } catch (error) {
    failures.push(`GET /api/products failed (${error instanceof Error ? error.message : error})`);
  }
  if (products) {
    if (products.res.status !== 200) failures.push(`GET /api/products → ${products.res.status}`);
    else {
      const body = JSON.parse(products.text);
      const amazon = (body.products ?? []).find((item) => item.slug === "amazon");
      if (!amazon) failures.push("products missing amazon");
      else if (amazon.priceUsdc !== 25) failures.push(`amazon price ${amazon.priceUsdc}, expected 25`);
    }
  }

  const state = readState();
  if (state) {
    if (!pidAlive(state.pid)) failures.push(`state pid ${state.pid} is not alive`);
    const expected = String(state.url).replace(/\/$/, "");
    if (expected !== url) failures.push(`state url ${expected} != doctor url ${url}`);
  }

  if (failures.length) {
    console.log(JSON.stringify({ ok: false, url, failures }, null, 2));
    process.exit(1);
  }

  const demo =
    home.text.includes("eight seconds") && home.text.includes("Demo · Sepolia");
  console.log(
    JSON.stringify(
      {
        ok: true,
        url,
        demoAutoPayCopy: demo,
        pid: state?.pid ?? null,
        runId: state?.runId ?? null,
      },
      null,
      2
    )
  );
}

async function waitForHttp(url, timeoutMs) {
  const started = Date.now();
  let last = "";
  while (Date.now() - started < timeoutMs) {
    try {
      const { res, text } = await fetchText(url);
      if (res.status === 200 && text.includes("Buy digital vouchers")) return;
      last = `status ${res.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`timed out waiting for ${url} (${last})`);
}

function copyApp(repo, dest) {
  mkdirSync(dest, { recursive: true });
  const skipTop = new Set(["node_modules", ".next", ".git", "data", ".cursor"]);
  cpSync(repo, dest, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(repo, src);
      if (!rel || rel === ".") return true;
      return !skipTop.has(rel.split(path.sep)[0]);
    },
  });
  // Turbopack refuses a node_modules symlink that points outside the project root.
  const modulesSrc = path.join(repo, "node_modules");
  const modulesDest = path.join(dest, "node_modules");
  if (!existsSync(modulesDest)) {
    cpSync(modulesSrc, modulesDest, { recursive: true });
  }
}

function writeDemoEnv(appDir, url) {
  const body = [
    "NEXT_PUBLIC_DEMO_AUTO_PAY=1",
    "DEMO_AUTO_PAY=1",
    "DEMO_AUTO_PAY_MS=8000",
    "ADMIN_USERNAME=admin",
    "ADMIN_PASSWORD=admin123",
    "ORDER_SECRET=vouchershop-demo",
    `APP_URL=${url}`,
    "MERCHANT_ADDRESS=0x006450335E618A9Fae2ad89542af411C8668d87D",
    "MERCHANT_PRIVATE_KEY=0x55d0c426bccaff91404aaaa8e901b0c94d47c0e1c98703400d6761cffee0cf06",
    "SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com",
    "NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com",
    "DATABASE_URL=",
    "POSTGRES_URL=",
    "DATABASE_URL_UNPOOLED=",
    "POSTGRES_URL_NON_POOLING=",
    "POSTGRES_PRISMA_URL=",
    "",
  ].join("\n");
  writeFileSync(path.join(appDir, ".env.local"), body);
}

async function cmdLaunch(flags) {
  const repo = path.resolve(flags.repo || ROOT_DEFAULT);
  const port = Number(flags.port ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1) die("launch: bad --port");
  if (!existsSync(path.join(repo, "node_modules", "next"))) {
    die(`launch: ${repo}/node_modules/next missing. Run npm install in the repo first.`);
  }

  const existing = readState();
  if (existing && pidAlive(existing.pid)) {
    die(`launch: instance already running pid=${existing.pid} url=${existing.url}. doctor or cleanup first.`);
  }

  if (!(await portFree(port))) {
    die(`launch: 127.0.0.1:${port} is in use. Pick --port or free it. Will not hop.`);
  }

  const runId = `${Date.now().toString(36)}-${process.pid}`;
  const inPlace = Boolean(flags["in-place"]);
  const appDir = inPlace ? repo : path.join(VERIFY_ROOT, "runs", runId, "app");
  const url = `http://127.0.0.1:${port}`;
  const evDir = evidenceDir(runId);
  mkdirSync(evDir, { recursive: true });

  if (!inPlace) copyApp(repo, appDir);
  writeDemoEnv(appDir, url);

  const logPath = path.join(inPlace ? VERIFY_ROOT : path.dirname(appDir), `next-${runId}.log`);
  mkdirSync(path.dirname(logPath), { recursive: true });
  writeFileSync(logPath, "");
  const logFd = await import("node:fs").then((fs) =>
    fs.openSync(logPath, "a")
  );

  const child = spawn(
    path.join(repo, "node_modules", ".bin", "next"),
    ["dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: appDir,
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: {
        ...process.env,
        PORT: String(port),
        APP_URL: url,
        DATABASE_URL: "",
        POSTGRES_URL: "",
        DATABASE_URL_UNPOOLED: "",
        POSTGRES_URL_NON_POOLING: "",
        POSTGRES_PRISMA_URL: "",
      },
    }
  );
  child.unref();

  const state = {
    runId,
    url,
    port,
    pid: child.pid,
    appDir,
    evidenceDir: evDir,
    logPath,
    inPlace,
    startedAt: new Date().toISOString(),
  };
  writeState(state);

  try {
    await waitForHttp(`${url}/`, 90_000);
  } catch (error) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      try {
        process.kill(child.pid, "SIGTERM");
      } catch {
        /* ignore */
      }
    }
    if (existsSync(STATE_PATH)) rmSync(STATE_PATH);
    if (!inPlace) {
      const runDir = path.join(VERIFY_ROOT, "runs", runId);
      if (existsSync(runDir)) rmSync(runDir, { recursive: true, force: true });
    }
    die(`launch: ${error instanceof Error ? error.message : error}\nlog: ${logPath}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        ...state,
      },
      null,
      2
    )
  );
}

function cmdCleanup() {
  const state = readState();
  if (!state) {
    console.log(JSON.stringify({ ok: true, cleaned: false, reason: "no state file" }));
    return;
  }
  if (pidAlive(state.pid)) {
    try {
      process.kill(-state.pid, "SIGTERM");
    } catch {
      try {
        process.kill(state.pid, "SIGTERM");
      } catch {
        /* ignore */
      }
    }
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline && pidAlive(state.pid)) {
      spawnSync("sleep", ["0.1"]);
    }
    if (pidAlive(state.pid)) {
      try {
        process.kill(-state.pid, "SIGKILL");
      } catch {
        try {
          process.kill(state.pid, "SIGKILL");
        } catch {
          /* ignore */
        }
      }
    }
  }
  if (!state.inPlace) {
    const runDir = path.join(VERIFY_ROOT, "runs", state.runId);
    if (existsSync(runDir)) rmSync(runDir, { recursive: true, force: true });
  }
  if (existsSync(STATE_PATH)) rmSync(STATE_PATH);
  console.log(
    JSON.stringify({
      ok: true,
      cleaned: true,
      evidenceDir: state.evidenceDir,
      evidenceKept: existsSync(state.evidenceDir),
    })
  );
}

async function cmdHttp(flags, rest) {
  const method = (rest[0] || "GET").toUpperCase();
  const reqPath = rest[1];
  if (!reqPath) die("http: missing path");
  const bodyArg = rest[2] && !String(rest[2]).startsWith("--") ? rest[2] : undefined;
  const url = `${baseUrl(flags)}${reqPath.startsWith("/") ? reqPath : `/${reqPath}`}`;
  const init = { method, headers: {} };
  if (bodyArg) {
    init.headers["Content-Type"] = "application/json";
    init.body = bodyArg;
  }
  const { res, text } = await fetchText(url, init);
  const cookies = res.headers.getSetCookie?.() ?? [];
  const out = {
    ok: res.ok,
    status: res.status,
    url,
    setCookie: cookies,
    body: (() => {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    })(),
  };
  const rendered = `${JSON.stringify(out, null, 2)}\n`;
  if (flags.out) {
    mkdirSync(path.dirname(path.resolve(flags.out)), { recursive: true });
    writeFileSync(path.resolve(flags.out), rendered);
  }
  process.stdout.write(rendered);
  if (!res.ok) process.exit(1);
}

async function cmdWaitPaid(flags) {
  const id = flags["order-id"];
  if (!id || flags["order-id"] === true) die("wait-paid: --order-id required");
  const timeoutMs = Number(flags["timeout-ms"] ?? 20_000);
  const url = `${baseUrl(flags)}/api/orders/${encodeURIComponent(id)}`;
  const started = Date.now();
  let last = "";
  while (Date.now() - started < timeoutMs) {
    const { res, text } = await fetchText(url);
    last = text;
    if (res.ok) {
      const body = JSON.parse(text);
      if (body.order?.status === "paid") {
        console.log(JSON.stringify({ ok: true, order: body.order }, null, 2));
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  die(`wait-paid: timed out. last=${last.slice(0, 400)}`);
}

async function cmdSaveHtml(flags, rest) {
  const reqPath = rest[0] || "/";
  const url = `${baseUrl(flags)}${reqPath.startsWith("/") ? reqPath : `/${reqPath}`}`;
  const { res, text } = await fetchText(url);
  const target =
    flags.out ||
    path.join(readState()?.evidenceDir || path.join(VERIFY_ROOT, "evidence", "loose"), "page.html");
  mkdirSync(path.dirname(path.resolve(target)), { recursive: true });
  writeFileSync(path.resolve(target), text);
  console.log(JSON.stringify({ ok: res.ok, status: res.status, url, out: path.resolve(target) }));
  if (!res.ok) process.exit(1);
}

function cmdDemoDigest(flags) {
  const id = flags["order-id"];
  if (!id || flags["order-id"] === true) die("demo-digest: --order-id required");
  const hex = createHash("sha256").update(`demo:${id}`).digest("hex");
  console.log(`0x${hex}`);
}

const { flags, rest } = parseArgs(process.argv.slice(2));
const command = rest.shift();
if (!command || command === "help" || flags.help) {
  usage();
  process.exit(0);
}

const commands = {
  launch: () => cmdLaunch(flags),
  doctor: () => cmdDoctor(flags),
  cleanup: () => cmdCleanup(),
  http: () => cmdHttp(flags, rest),
  "wait-paid": () => cmdWaitPaid(flags),
  "save-html": () => cmdSaveHtml(flags, rest),
  "demo-digest": () => cmdDemoDigest(flags),
};

if (!commands[command]) {
  usage();
  die(`unknown command: ${command}`);
}

await commands[command]();
