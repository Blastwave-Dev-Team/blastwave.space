import { TEXTBOOK_PAGES } from './pages.js';

export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:138.0) Gecko/20100101 Firefox/138.0';

export type MediaWikiPage = {
  title: string;
  html: string;
};

export type MediaWikiClientOptions = {
  apiUrl: string;
  userAgent?: string;
  delayMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileTitleKey(name: string): string {
  return name.replace(/^File:/, '').replace(/_/g, ' ').toLowerCase();
}

function mapQueryTitleToOriginal(
  batch: string[],
  normalized: Array<{ from: string; to: string }> | undefined,
): Map<string, string> {
  const titleToOriginal = new Map<string, string>();
  for (const name of batch) {
    titleToOriginal.set(`File:${name}`, name);
  }
  for (const norm of normalized ?? []) {
    const original = titleToOriginal.get(norm.from);
    if (original) {
      titleToOriginal.set(norm.to, original);
    }
  }
  return titleToOriginal;
}

export class MediaWikiClient {
  readonly apiUrl: string;
  readonly userAgent: string;
  readonly delayMs: number;

  constructor(options: MediaWikiClientOptions) {
    this.apiUrl = options.apiUrl;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.delayMs = options.delayMs ?? 100;
  }

  private async apiRequest(params: Record<string, string>): Promise<unknown> {
    const url = new URL(this.apiUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');

    const response = await fetch(url, {
      headers: { 'User-Agent': this.userAgent },
    });
    if (!response.ok) {
      throw new Error(`MediaWiki HTTP ${response.status} for ${url.pathname}${url.search.slice(0, 80)}`);
    }

    if (this.delayMs > 0) {
      await sleep(this.delayMs);
    }

    return response.json();
  }

  async fetchPage(title: string): Promise<MediaWikiPage | null> {
    const payload = (await this.apiRequest({
      action: 'parse',
      page: title,
      prop: 'text|displaytitle',
    })) as {
      parse?: { title?: string; text?: { '*': string } };
      error?: { info?: string };
    };

    if (payload.error || !payload.parse?.text?.['*']) {
      return null;
    }

    return {
      title: payload.parse.title ?? title,
      html: payload.parse.text['*'],
    };
  }

  async listPageImages(title: string): Promise<string[]> {
    const payload = (await this.apiRequest({
      action: 'parse',
      page: title,
      prop: 'images',
    })) as {
      parse?: { images?: string[] };
      error?: { info?: string };
    };

    return payload.parse?.images ?? [];
  }

  async collectTextbookImages(): Promise<Map<string, Set<string>>> {
    const images = new Map<string, Set<string>>();

    for (const [mediaWikiTitle, wikiPath] of Object.entries(TEXTBOOK_PAGES)) {
      const pageImages = await this.listPageImages(mediaWikiTitle);
      for (const filename of pageImages) {
        if (!images.has(filename)) images.set(filename, new Set());
        images.get(filename)!.add(wikiPath);
      }
    }

    return images;
  }

  async resolveImageUrls(filenames: string[]): Promise<Map<string, string>> {
    const resolved = new Map<string, string>();
    const batchSize = 50;

    for (let i = 0; i < filenames.length; i += batchSize) {
      const batch = filenames.slice(i, i + batchSize);
      const titles = batch.map((name) => `File:${name}`).join('|');
      const payload = (await this.apiRequest({
        action: 'query',
        titles,
        prop: 'imageinfo',
        iiprop: 'url',
      })) as {
        query?: {
          normalized?: Array<{ from: string; to: string }>;
          pages?: Record<
            string,
            { title?: string; missing?: boolean; imageinfo?: Array<{ url?: string }> }
          >;
        };
      };

      const titleToOriginal = mapQueryTitleToOriginal(
        batch,
        payload.query?.normalized,
      );
      const keyToOriginal = new Map(
        batch.map((name) => [fileTitleKey(name), name] as const),
      );

      for (const page of Object.values(payload.query?.pages ?? {})) {
        if (page.missing || !page.imageinfo?.[0]?.url || !page.title) continue;
        const original =
          titleToOriginal.get(page.title) ??
          keyToOriginal.get(fileTitleKey(page.title));
        if (original) {
          resolved.set(original, page.imageinfo[0].url);
        }
      }
    }

    return resolved;
  }
}
