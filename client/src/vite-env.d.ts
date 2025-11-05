/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_SOLANA_RPC_URL?: string;
  readonly VITE_SOLANA_CLUSTER?: string;
  readonly VITE_GA_TRACKING_ID?: string;
  readonly VITE_ERROR_TRACKING_URL?: string;
  readonly VITE_IMG_PROXY_BASE?: string;
  readonly MODE: 'development' | 'production';
  readonly DEV: boolean;
  readonly PROD: boolean;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
