import express from "express";
import { exec } from "child_process";
const router = express.Router();

// POST /api/mint
router.post("/", async (req, res) => {
  const { name, description, imageUrl, wallet } = req.body;
  if (!wallet) return res.status(400).json({ error: "Missing wallet" });

  try {
    exec(
      `npx tsx ../solana-worker/scripts/mint-devnet.ts ${wallet} "${name}" "${description}" "${imageUrl}"`,
      (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: stderr });
        res.json({ success: true, tx: stdout.trim() });
      }
    );
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
