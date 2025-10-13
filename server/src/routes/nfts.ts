import { Router } from "express";
import { z } from "zod";
import { getAssetsByOwner, toSimpleItems } from "../clients/helius.js";

const router = Router();
const qSchema = z.object({
  owner: z.string().min(32).max(64).optional(),
  limit: z.coerce.number().min(1).max(100).optional()
});

router.get("/", async (req, res) => {
  const parsed = qSchema.safeParse(req.query);
  if (!parsed.success) {
    // no owner? still return mock data so the grid isn't empty
    const items = Array.from({ length: 9 }).map((_, i) => ({
      mint: `MockMint${i + 1}`,
      name: `Mock NFT #${i + 1}`,
      image: `https://picsum.photos/seed/nftsol-${i}/400/400`,
      collection: "NFTSol Demo"
    }));
    return res.json({ items, note: "Add ?owner=<publicKey> for live data" });
  }

  const { owner, limit } = parsed.data;
  if (!owner) {
    const items = Array.from({ length: 9 }).map((_, i) => ({
      mint: `MockMint${i + 1}`,
      name: `Mock NFT #${i + 1}`,
      image: `https://picsum.photos/seed/nftsol-${i}/400/400`,
      collection: "NFTSol Demo"
    }));
    return res.json({ items, note: "Owner missing; showing mock" });
  }

  try {
    const result = await getAssetsByOwner({ ownerAddress: owner, limit: limit ?? 50 });
    const items = toSimpleItems(result?.items || result?.assets || []);
    return res.json({ items });
  } catch (e: any) {
    console.error("Helius error:", e?.message || e);
    // graceful fallback
    const items = Array.from({ length: 9 }).map((_, i) => ({
      mint: `MockMint${i + 1}`,
      name: `Mock NFT #${i + 1}`,
      image: `https://picsum.photos/seed/nftsol-${i}/400/400`,
      collection: "NFTSol (fallback)"
    }));
    return res.json({ items, note: "Helius failed; showing mock" });
  }
});

export default router;
