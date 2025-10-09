import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Request } from "express";
import { sql, eq } from "drizzle-orm";
import { db } from "./db";
import { users, nfts, type User } from "@shared/schema";

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
    if (db) {
      return db.query.users.findFirst({ where: eq(users.id, id) });
    }
    // In-memory fallback
    const u = memory.users.find((u) => u.id === id);
    return u ? { ...u } : null;
  },
  async getUserByUsername(username: string) {
    if (db) {
      return db.query.users.findFirst({ where: eq(users.username, username) });
    }
    // In-memory fallback
    const u = memory.users.find((u) => u.username === username);
    return u ? { ...u } : null;
  },
  async createUser(data: { id?: string; username: string; password: string; role: string }) {
    if (db) {
      const [created] = await db
        .insert(users)
        .values(data)
        .returning();
      return created;
    }
    // In-memory fallback
    const created: User = {
      id: data.id || crypto.randomUUID(),
      username: data.username,
      password: data.password,
      role: data.role || "user",
    } as User;
    memory.users.push(created);
    return { ...created };
  },
  async getAllStats() {
    if (db) {
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
    }
    // In-memory fallback
    return {
      totalUsers: memory.users.length,
      totalListed: memory.nfts.filter((n) => n.status === 'listed').length,
    };
  },
};

// Simple in-memory store for development when DATABASE_URL is not set
const memory: {
  users: Array<Pick<User, 'id' | 'username' | 'password' | 'role'>>;
  nfts: Array<{ id: string; status: string }>;
} = {
  users: [],
  nfts: [],
};
