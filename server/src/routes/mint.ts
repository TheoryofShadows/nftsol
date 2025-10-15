import express from "express";
import { exec } from "child_process";
import { addClout } from "../cloutStore";

const router = express.Router();

// POST /api/mint { name, description, imageUrl, wallet }
router.post("/", async (req, res) => {
  const { name, description, imageUrl, wallet } = req.body || {};
  if (!wallet) return res.status(400).json({ error: "Missing wallet" });

  try {
    const cmd = `npx tsx ../solana-worker/scripts/mint-devnet.ts ${wallet} "${name || ''}" "${description || ''}" "${imageUrl || ''}"`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) return res.status(500).json({ error: stderr || String(error) });

      // reward clout +10 on success
      const newClout = addClout(String(wallet), 10);
      res.json({ success: true, tx: String(stdout || '').trim(), clout: newClout, reward: 10 });
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
