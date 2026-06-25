type CacheEntry = {
  html: string;
  expiresAt: number;
};

export class TtlCache {
  private readonly store = new Map<string, CacheEntry>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): string | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.html;
  }

  set(key: string, html: string): void {
    this.store.set(key, {
      html,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
}
