import { getHeliusConfig } from "./config/environment";

const heliusConfig = getHeliusConfig();

export type SimpleItem = {
  mint: string;
  name: string;
  image: string;
  collection: string;
};

export function toSimpleItem(it: any): SimpleItem | null {
  if (!it) return null;

  const id = it.id ?? it.mint ?? it.token_info?.mint ?? null;
  if (!id) return null;

  const name =
    it.content?.metadata?.name ??
    it.content?.metadata?.symbol ??
    it.token_info?.symbol ??
    "Untitled";

  const image =
    it.content?.files?.[0]?.uri ??
    it.content?.links?.image ??
    "https://placehold.co/400x400?text=Asset";

  const collection =
    it.grouping?.find((g: any) => g.group_key === "collection")?.group_value ??
    it.token_info?.token_program ??
    "Unknown Collection";

  return {
    mint: String(id),
    name: String(name),
    image: String(image),
    collection: String(collection),
  };
}

export function toSimpleItems(items: any[]): SimpleItem[] {
  return (items || []).map(toSimpleItem).filter(Boolean) as SimpleItem[];
}

function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

/** DAS owner query with correct sort casing */
export async function getAssetsByOwner(ownerAddress: string) {
  const body = {
    jsonrpc: "2.0",
    id: "getAssetsByOwner",
    method: "getAssetsByOwner",
    params: {
      ownerAddress,
      page: 1,
      limit: 100,
      sortBy: { sortBy: "recent_action", sortDirection: "desc" },
      displayOptions: { showFungible: true },
    },
  };

  const timeout = createTimeoutController(heliusConfig.timeoutMs);

  try {
    const res = await fetch(heliusConfig.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: timeout.signal,
    });

    const json = await res.json();
    if (json.error) {
      console.warn("?? Helius error:", json.error);
      return [];
    }
    const items = json.result?.items ?? [];
    return toSimpleItems(items);
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.error("[helius] request timed out", { ownerAddress });
      return [];
    }
    throw error;
  } finally {
    timeout.clear();
  }
}
