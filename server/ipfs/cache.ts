import fs from "fs"; import path from "path"; import crypto from "crypto";
import { mkdirp } from "mkdirp"; import LRU from "lru-cache"; import Redis from "ioredis";
const diskDir = process.env.DISK_CACHE_DIR || ".ipfs-cache"; mkdirp.sync(diskDir);
const maxMB = Number(process.env.DISK_CACHE_MAX_MB || 500);
const diskIndex = new LRU<string, number>({ max: maxMB * 1024 * 1024, sizeCalculation: v => v });
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
function keyFor(k: string) { return crypto.createHash("sha1").update(k).digest("hex"); }
function diskPath(k: string) { return path.join(diskDir, k.slice(0,2), k.slice(2)); }
export async function getCached(key: string) {
  const k = keyFor(key); if (redis) { const r = await redis.getBuffer(k); if (r) return r; }
  const p = diskPath(k); return fs.existsSync(p) ? fs.readFileSync(p) : null;
}
export async function setCached(key: string, buf: Buffer) {
  const k = keyFor(key); if (redis) await redis.set(k, buf);
  const p = diskPath(k); mkdirp.sync(path.dirname(p)); fs.writeFileSync(p, buf); diskIndex.set(k, buf.byteLength);
}
