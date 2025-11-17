/** Minimal Helius-based helpers */
const HELIUS = process.env.HELIUS_HTTP_URL || (process.env.HELIUS_API_KEY ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}` : "");
async function rpc(method: string, params: any): Promise<any> {
  if (!HELIUS) return null;
  const res = await fetch(HELIUS, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const json: any = await res.json();
  if (json?.error) throw new Error(json.error?.message ?? String(json.error));
  return json.result;
}
export async function getNFTsByOwner(owner: string) {
  try {
    const result = await rpc("getAssetsByOwner", { ownerAddress: owner, page: 1, limit: 100 });
    const items = (result?.items ?? []) as any[];
    return items.map(a => ({
      mint: a.id ?? a.mint,
      name: a?.content?.metadata?.name,
      image: a?.content?.links?.image || a?.content?.files?.[0]?.uri,
      collection: a?.grouping?.find((g:any) => g.group_key === "collection")?.group_value ?? null,
      raw: a
    }));
  } catch { return []; }
}
export async function getNFTMetadataByMint(mint: string) {
  try {
    const a: any = await rpc("getAsset", { id: mint });
    if (!a) return null;
    return {
      mint: a.id ?? a.mint,
      name: a?.content?.metadata?.name,
      image: a?.content?.links?.image || a?.content?.files?.[0]?.uri,
      collection: a?.grouping?.find((g:any) => g.group_key === "collection")?.group_value ?? null,
      raw: a
    };
  } catch { return null; }
}
export async function getSPLTokensByOwner(owner: string) {
  try {
    const res: any = await rpc("getTokenAccountsByOwner", [owner, { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }, { encoding: "jsonParsed" }]);
    const value = res?.value ?? [];
    return value.map((acc:any) => {
      const info = acc?.account?.data?.parsed?.info;
      return { mint: info?.mint, amount: info?.tokenAmount?.uiAmountString ?? info?.tokenAmount?.amount, decimals: info?.tokenAmount?.decimals, owner, raw: acc };
    });
  } catch { return []; }
}
