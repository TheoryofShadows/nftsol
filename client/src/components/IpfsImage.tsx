import React from "react";
import { ipfsImg, ipfsDirect } from "../lib/ipfsUrl";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  proxy?: boolean; // default true
};

export default function IpfsImage({ src, proxy = true, ...rest }: Props) {
  const makeUrl = React.useCallback(() => {
    if (!src) return src;
    if (src.startsWith("ipfs://")) return proxy ? (ipfsImg(src) as string) : (ipfsDirect(src) as string);
    return src;
  }, [src, proxy]);

  const [source, setSource] = React.useState<string | undefined>(makeUrl);

  React.useEffect(() => {
    setSource(makeUrl());
  }, [makeUrl]);

  const handleError = React.useCallback(() => {
    // If proxy failed, retry direct gateway once
    if (src?.startsWith("ipfs://") && proxy && source?.includes("/ipfs-img?")) {
      const fallback = ipfsDirect(src) as string;
      console.warn("[IpfsImage] Proxy failed, retrying direct gateway:", fallback);
      setSource(fallback);
    }
  }, [src, proxy, source]);

  console.log("[IpfsImage]", { src, using: source });
  return <img src={source} onError={handleError} {...rest} />;
}
