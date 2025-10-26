"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const helius_api_1 = require("../helius-api");
const r = (0, express_1.Router)();
/**
 * GET /nfts?owner=<pubkey>
 * Returns { items: SimpleItem[] }
 */
r.get("/", async (req, res) => {
    try {
        const owner = String(req.query.owner || "").trim();
        if (!owner)
            return res.json({ items: [], note: "Add ?owner=<publicKey>" });
        const items = await (0, helius_api_1.getAssetsByOwner)(owner);
        return res.json({ items });
    }
    catch (e) {
        console.error("nfts route error:", e);
        return res.status(500).json({ items: [], error: e?.message || "unknown" });
    }
});
exports.default = r;
