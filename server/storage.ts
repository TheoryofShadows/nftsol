import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Request } from "express";
import { sql, eq } from "drizzle-orm";
import { db } from "./db";
import { users, nfts } from "@shared/schema";

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
  },
  async getUser(id: string) {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  },
  async getUserByUsername(username: string) {
    return db.query.users.findFirst({ where: eq(users.username, username) });
  },
  async createUser(data: { id?: string; username: string; password: string; role: string }) {
    const [created] = await db
      .insert(users)
      .values(data)
      .returning();
    return created;
  },
  async getAllStats() {
    const [userCount] = await db
      .select({ totalUsers: sql<number>`count(*)::int` })
      .from(users);

    const [listedCount] = await db
      .select({ totalListed: sql<number>`count(*)::int` })
      .from(nfts)
      .where(eq(nfts.status, 'listed'));

    return {
      totalUsers: userCount?.totalUsers ?? 0,
      totalListed: listedCount?.totalListed ?? 0,
    };
  },
};
