const express = require("express");
const router = express.Router();

router.post("/mint", async (req, res) => {
  try {
    const { owner } = req.body || {};
    if (!owner) return res.status(400).json({ ok:false, error:"owner is required" });
    return res.json({ ok:true, owner, signature:"DEMO_SIG", mint:"DEMO_MINT" });
  } catch (e) {
    return res.status(500).json({ ok:false, error: e?.message || "mint failed" });
  }
});

router.post("/list", async (req, res) => {
  try {
    const { owner, price } = req.body || {};
    if (!owner) return res.status(400).json({ ok:false, error:"owner is required" });
    if (typeof price !== "number") return res.status(400).json({ ok:false, error:"price must be number" });
    return res.json({ ok:true, owner, price, tradeState:"DEMO_TRADE_STATE" });
  } catch (e) {
    return res.status(500).json({ ok:false, error: e?.message || "list failed" });
  }
});

module.exports = router;
