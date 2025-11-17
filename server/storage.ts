import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Request } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import type { InsertUser, User } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

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

  async getUser(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user ?? null;
  },

  async createUser(data: InsertUser & { password: string }): Promise<User> {
    const [created] = await db.insert(users).values({
      username: data.username,
      password: data.password,
      role: data.role ?? "user",
    }).returning();

    if (!created) {
      throw new Error("Failed to create user");
    }

    return created;
  },

  async getAllStats(): Promise<{ totalUsers: number }> {
    const [row] = await db
      .select({ totalUsers: sql<number>`COUNT(*)` })
      .from(users);
    return { totalUsers: row?.totalUsers ?? 0 };
  }
};
