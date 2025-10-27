import { Router } from "express";
import { getAssetsByOwner } from "../helius-api";

const r = Router();

/**
 * GET /nfts?owner=<pubkey>
 * Returns { items: SimpleItem[] }
 */
r.get("/", async (req, res) => {
  try {
    const owner = String(req.query.owner || "").trim();
    if (!owner) return res.json({ items: [], note: "Add ?owner=<publicKey>" });

    const items = await getAssetsByOwner(owner);
    return res.json({ items });
  } catch (e:any) {
    console.error("nfts route error:", e);
    return res.status(500).json({ items: [], error: e?.message || "unknown" });
  }
});

export default r;
