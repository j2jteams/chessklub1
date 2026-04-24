import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

/**
 * Next.js does not load `.local.env` by default (only `.env*`). Fill missing
 * keys from `.local.env` so local Firebase config works without duplicating into `.env.local`.
 */
function loadLocalEnvFile(): void {
  const path = join(process.cwd(), ".local.env");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && (process.env[key] === undefined || process.env[key] === "")) {
      process.env[key] = val;
    }
  }
}

loadLocalEnvFile();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
