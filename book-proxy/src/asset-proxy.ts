import type { FastifyReply } from 'fastify';
import { wikiAssetUrl } from './wiki-url.js';

const ASSET_EXTENSION = /\.(png|gif|jpe?g|webp|svg|ico)$/i;

type AssetCacheEntry = {
  body: Buffer;
  contentType: string;
  expiresAt: number;
};

export class AssetCache {
  private readonly store = new Map<string, AssetCacheEntry>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): AssetCacheEntry | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry;
  }

  set(key: string, body: Buffer, contentType: string): void {
    this.store.set(key, {
      body,
      contentType,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
}

export function sanitizeAssetFilename(raw: string): string | null {
  const basename = decodeURIComponent(raw.split('/').pop() ?? '');
  if (!basename || basename.includes('..')) return null;
  if (!ASSET_EXTENSION.test(basename)) return null;
  if (!/^[\w.-]+$/i.test(basename)) return null;
  return basename;
}

export function guessAssetContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'ico':
      return 'image/x-icon';
    default:
      return 'application/octet-stream';
  }
}

type ProxyAssetOptions = {
  graphqlUrl: string;
  assetBaseUrl?: string;
  cache: AssetCache;
};

export async function proxyWikiAsset(
  filename: string,
  reply: FastifyReply,
  options: ProxyAssetOptions,
): Promise<FastifyReply> {
  const cacheKey = filename.toLowerCase();
  const cached = options.cache.get(cacheKey);
  if (cached) {
    return reply
      .header('Cache-Control', 'public, max-age=86400')
      .type(cached.contentType)
      .send(cached.body);
  }

  const assetUrl = options.assetBaseUrl
    ? `${options.assetBaseUrl.replace(/\/$/, '')}/${encodeURIComponent(filename)}`
    : wikiAssetUrl(options.graphqlUrl, filename);

  const response = await fetch(assetUrl);
  if (!response.ok) {
    return reply.code(response.status).send(response.status === 404 ? 'Not found' : 'Asset unavailable');
  }

  const body = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') ?? guessAssetContentType(filename);
  options.cache.set(cacheKey, body, contentType);

  return reply.header('Cache-Control', 'public, max-age=86400').type(contentType).send(body);
}
