import React, { useState, useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { ipfsImg, ipfsDirect } from "../lib/ipfsUrl";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src?: string;
  proxy?: boolean; // default true
  lazy?: boolean; // default true
  placeholder?: string; // blur placeholder
  sizes?: string; // responsive sizes
  quality?: number; // 1-100, default 75
};

export default function IpfsImage({ 
  src, 
  proxy = true, 
  lazy = true,
  placeholder,
  sizes,
  quality = 75,
  className = "",
  ...rest 
}: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>();
  const imgRef = useRef<HTMLImageElement>(null);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    rootMargin: '50px'
  });

  const makeUrl = React.useCallback(() => {
    if (!src) return src;
    if (src.startsWith("ipfs://")) {
      const baseUrl = proxy ? ipfsImg(src) : ipfsDirect(src);
      // Add quality parameter for optimization
      const url = new URL(baseUrl as string);
      url.searchParams.set('q', quality.toString());
      if (sizes) {
        url.searchParams.set('w', '800'); // Default width, can be made responsive
      }
      return url.toString();
    }
    return src;
  }, [src, proxy, quality, sizes]);

  useEffect(() => {
    if (src && (!lazy || inView)) {
      setCurrentSrc(makeUrl());
    }
  }, [src, makeUrl, lazy, inView]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    // If proxy failed, retry direct gateway once
    if (src?.startsWith("ipfs://") && proxy && currentSrc?.includes("/ipfs-img?")) {
      const fallback = ipfsDirect(src) as string;
      console.warn("[IpfsImage] Proxy failed, retrying direct gateway:", fallback);
      setCurrentSrc(fallback);
    } else {
      setHasError(true);
    }
  };

  // Generate blur placeholder if not provided
  const blurDataURL = placeholder || `data:image/svg+xml;base64,${btoa(`
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1a1a1a"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666" font-family="Arial, sans-serif" font-size="14">
        Loading...
      </text>
    </svg>
  `)}`;

  return (
    <div 
      ref={ref}
      className={`ipfs-image-container ${className}`}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Blur placeholder */}
      {!isLoaded && !hasError && (
        <div 
          className="ipfs-image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
            zIndex: 1
          }}
        />
      )}

      {/* Main image */}
      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazy ? "lazy" : "eager"}
          sizes={sizes}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            zIndex: 2,
            position: 'relative'
          }}
          {...rest}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div 
          className="ipfs-image-error"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
            color: '#666',
            fontSize: '14px',
            zIndex: 3
          }}
        >
          Failed to load
        </div>
      )}

      {/* Loading spinner */}
      {!isLoaded && !hasError && currentSrc && (
        <div 
          className="ipfs-image-loading"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 4
          }}
        >
          <div className="loading-spinner" style={{ width: '24px', height: '24px' }}></div>
        </div>
      )}
    </div>
  );
}
