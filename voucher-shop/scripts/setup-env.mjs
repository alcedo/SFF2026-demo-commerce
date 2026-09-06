import fs from "fs";
import path from "path";

const root = path.dirname(new URL(import.meta.url).pathname);
const src = path.join(root, "..", "config", "test-wallets.env");
const dest = path.join(root, "..", ".env.local");

if (!fs.existsSync(src)) {
  console.error("Missing config/test-wallets.env");
  process.exit(1);
}

fs.copyFileSync(src, dest);
console.log("Copied config/test-wallets.env → .env.local");
