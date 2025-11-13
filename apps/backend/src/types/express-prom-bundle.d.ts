declare module 'express-prom-bundle' {
  import { RequestHandler } from 'express';
  import { Registry } from 'prom-client';

  interface Options {
    includeMethod?: boolean;
    includePath?: boolean;
    includeStatusCode?: boolean;
    includeUp?: boolean;
    customLabels?: Record<string, string>;
    transformLabels?: (labels: Record<string, string>, req: any, res: any) => Record<string, string>;
    metricType?: 'histogram' | 'summary' | 'gauge' | 'counter';
    percentiles?: number[];
    autoregister?: boolean;
    excludeRoutes?: Array<string | RegExp>;
    includeUp?: boolean;
    metricName?: string;
    promClient?: {
      collectDefaultMetrics?: any;
    };
    promRegistry?: Registry;
    buckets?: number[];
    maxAgeSeconds?: number;
    ageBuckets?: number;
    normalizePath?: Array<[pattern: string | RegExp, replacement: string]> | ((path: string) => string);
    formatStatusCode?: (res: any) => number;
    urlValueParser?: any;
    httpDurationMetricName?: string;
  }

  function expressPromBundle(options?: Options): RequestHandler;
  
  namespace expressPromBundle {}
  
  export = expressPromBundle;
}
