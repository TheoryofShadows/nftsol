import axios from "axios";

const FALLBACKS = (process.env.IPFS_FALLBACK_GATEWAYS || "").split(",").map(s => s.trim()).filter(Boolean);
const PRIMARY = process.env.IPFS_PRIMARY_GATEWAY || "https://w3s.link";

const TIMEOUT = Number(process.env.IPFS_TIMEOUT_MS || 8000);
const RETRIES = Number(process.env.IPFS_RETRIES || 2);
const BACKOFF = Number(process.env.IPFS_BACKOFF_MS || 300);

const gateways = [PRIMARY, ...FALLBACKS];

export async function fetchFromGateways(path: string, signal?: AbortSignal) {
  let lastErr: any;
  for (let g = 0; g < gateways.length; g++) {
    const base = gateways[g].replace(/\/$/, "");
    for (let r = 0; r <= RETRIES; r++) {
      try {
        const url = `${base}/${path.replace(/^\//, "")}`;
        const res = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: TIMEOUT,
          signal,
          headers: { "Accept": "*/*" }
        });
        if (res.status >= 200 && res.status < 300) return { buf: Buffer.from(res.data), headers: res.headers };
      } catch (e) {
        lastErr = e;
        await new Promise(s => setTimeout(s, BACKOFF * (r + 1)));
      }
    }
  }
  throw lastErr;
}
