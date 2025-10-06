import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Request } from "express";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
async function ensureDir() { await fsp.mkdir(UPLOAD_DIR, { recursive: true }); }

export const storage = {
  async save(buffer: Buffer, filename: string) {
    await ensureDir();
    const fp = path.join(UPLOAD_DIR, filename);
    await fsp.writeFile(fp, buffer);
    return { path: fp, url: `/uploads/${filename}` };
  },
  async fromRequest(req: Request, field = "file") {
    const f: any = (req as any).file || (req as any).files?.[field];
    if (!f) throw new Error("No file provided");
    const buf = Buffer.isBuffer(f.buffer) ? f.buffer : Buffer.from(f.buffer);
    return this.save(buf, f.originalname || f.name || `upload-${Date.now()}`);
  }
};
