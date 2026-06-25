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
  const candidates = [trimmed, normalized];

  return [...new Set(candidates.filter(Boolean))];
}
