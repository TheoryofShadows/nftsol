import { Router } from "express";
import { mintNFT, listNFT } from "../src/services/nftMinting.js";

const router = Router();
router.post("/mint", async (req, res) => {
    try {
        const { owner } = req.body || {};
        if (!owner)
            return res.status(400).json({ ok: false, error: "owner is required" });
        // NFT minting logic - integrate with Solana program
        const signature = await mintNFT(owner);
        return res.json({ ok: true, owner, signature, mint: "NFT_MINTED" });
    }
    catch (e) {
        return res.status(500).json({ ok: false, error: e?.message || "mint failed" });
    }
});
router.post("/list", async (req, res) => {
    try {
        const { owner, price } = req.body || {};
        if (!owner)
            return res.status(400).json({ ok: false, error: "owner is required" });
        if (typeof price !== "number")
            return res.status(400).json({ ok: false, error: "price must be number" });
        // NFT listing logic - integrate with marketplace
        const tradeState = await listNFT(owner, price);
        return res.json({ ok: true, owner, price, tradeState });
    }
    catch (e) {
        return res.status(500).json({ ok: false, error: e?.message || "list failed" });
    }
});
export default router;
