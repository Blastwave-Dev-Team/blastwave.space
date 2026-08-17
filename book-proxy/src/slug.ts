/** Short page_link / flat-slug aliases → hierarchical Wiki.js paths. */
export const PAGE_ALIASES: Record<string, string> = {
  Corporate_Regulations:
    'guides/security-and-command-guides/security/space-law',
  'corporate-regulations':
    'guides/security-and-command-guides/security/space-law',
};

/** Normalize MediaWiki-style slugs to Wiki.js path conventions. */
export function normalizeSlug(raw: string): string {
  const trimmed = raw.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed) {
    return trimmed;
  }

  return trimmed
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

/** Candidate paths to try when resolving a book page_link. */
export function slugCandidates(raw: string): string[] {
  const trimmed = raw.trim().replace(/^\/+|\/+$/g, '');
  const normalized = normalizeSlug(trimmed);
  const aliased = PAGE_ALIASES[trimmed] ?? PAGE_ALIASES[normalized];
  const candidates = [aliased, trimmed, normalized];

  return [...new Set(candidates.filter(Boolean))];
}
