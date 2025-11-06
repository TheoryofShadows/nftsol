/**
 * Image Optimization Service
 * CDN and image optimization utilities
 */

import { logger } from '@shared/utils/logger';

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
  fit?: 'cover' | 'contain' | 'fill';
}

export class ImageOptimizationService {
  private cloudflareAccountHash: string | null = null;
  private enabled: boolean = false;

  constructor() {
    this.cloudflareAccountHash = process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH || null;
    this.enabled = !!this.cloudflareAccountHash;
    
    if (!this.enabled) {
      logger.warn('Image optimization not configured (CLOUDFLARE_IMAGES_ACCOUNT_HASH not set)');
    }
  }

  /**
   * Optimize image URL for CDN
   */
  optimizeImage(
    imageUrl: string,
    options: ImageOptimizationOptions = {}
  ): string {
    if (!this.enabled || !this.cloudflareAccountHash) {
      // Return original URL if not configured
      return imageUrl;
    }

    // If already a Cloudflare Images URL, just update variants
    if (imageUrl.includes('imagedelivery.net')) {
      const variant = this.getVariantString(options);
      return imageUrl.replace(/\/[^\/]+$/, `/${variant}`);
    }

    // For IPFS URLs, use proxy
    if (imageUrl.startsWith('ipfs://') || imageUrl.includes('ipfs')) {
      // Use existing IPFS proxy with optimization
      const proxyBase = process.env.VITE_IMG_PROXY_BASE || process.env.VITE_API_BASE || 'http://localhost:3001';
      const params = new URLSearchParams();
      params.set('u', imageUrl);
      if (options.width) params.set('w', options.width.toString());
      if (options.height) params.set('h', options.height.toString());
      if (options.quality) params.set('q', options.quality.toString());
      return `${proxyBase}/ipfs-img?${params.toString()}`;
    }

    // For regular URLs, return as-is (could add Cloudflare Images upload later)
    return imageUrl;
  }

  /**
   * Get variant string for Cloudflare Images
   */
  private getVariantString(options: ImageOptimizationOptions): string {
    const parts: string[] = [];
    
    if (options.width) parts.push(`w=${options.width}`);
    if (options.height) parts.push(`h=${options.height}`);
    if (options.quality) parts.push(`q=${options.quality || 80}`);
    if (options.format) parts.push(`f=${options.format}`);
    if (options.fit) parts.push(`fit=${options.fit}`);

    return parts.length > 0 ? parts.join(',') : 'public';
  }

  /**
   * Generate responsive image URLs
   */
  generateResponsiveUrls(
    imageUrl: string,
    sizes: number[] = [400, 800, 1200, 1600]
  ): { src: string; srcset: string; sizes: string } {
    const srcset = sizes
      .map((size) => {
        const optimized = this.optimizeImage(imageUrl, { width: size, format: 'webp' });
        return `${optimized} ${size}w`;
      })
      .join(', ');

    return {
      src: this.optimizeImage(imageUrl, { width: sizes[0] }),
      srcset,
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    };
  }

  /**
   * Get thumbnail URL
   */
  getThumbnail(imageUrl: string, size: number = 200): string {
    return this.optimizeImage(imageUrl, {
      width: size,
      height: size,
      fit: 'cover',
      quality: 75,
      format: 'webp',
    });
  }

  /**
   * Get optimized image for gallery
   */
  getGalleryImage(imageUrl: string, width: number = 800): string {
    return this.optimizeImage(imageUrl, {
      width,
      quality: 85,
      format: 'webp',
    });
  }
}

export const imageOptimizationService = new ImageOptimizationService();

