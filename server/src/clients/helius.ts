import "dotenv/config";

type GetAssetsByOwnerParams = {
  ownerAddress: string;
  page?: number;
  limit?: number;
  displayOptions?: { showUnverifiedCollections?: boolean };
};

const cluster = (process.env.VITE_SOLANA_CLUSTER || "devnet") as "devnet"|"mainnet-beta";
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
if (!HELIUS_API_KEY) {
  console.warn("⚠️ HELIUS_API_KEY missing; /nfts will return mock data");
}

function rpcUrl() {
  const base = cluster === "mainnet-beta"
    ? "https://mainnet.helius-rpc.com/?api-key="
    : "https://devnet.helius-rpc.com/?api-key=";
  return `${base}${HELIUS_API_KEY}`;
}

export async function getAssetsByOwner(params: GetAssetsByOwnerParams) {
  if (!HELIUS_API_KEY) return { items: [] as any[] };

  const body = {
    jsonrpc: "2.0",
    id: "nftsol",
    method: "getAssetsByOwner",
    params: {
      ownerAddress: params.ownerAddress,
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      displayOptions: params.displayOptions ?? { showUnverifiedCollections: true }
    }
  };

  const res = await fetch(rpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`Helius RPC failed: ${res.status}`);
  const json = await res.json();
  return json?.result;
}

export function toSimpleItems(assets: any[]): { mint: string; name: string; image: string; collection: string }[] {
  return (assets || []).map((a: any, i: number) => {
    const name = a?.content?.metadata?.name || a?.content?.links?.external_url || `NFT #${i+1}`;
    const image = a?.content?.files?.[0]?.uri || a?.content?.links?.image || `https://picsum.photos/seed/nftsol-${i}/400/400`;
    const collection = a?.grouping?.find((g: any) => g.group_key === "collection")?.group_value || (a?.content?.metadata?.symbol || "Unknown");
    // a.id is the assetId (not mint for compressed). Use id as stable key.
    const mint = a?.id || a?.mint || `Asset${i+1}`;
    return { mint, name, image, collection };
  });
}
