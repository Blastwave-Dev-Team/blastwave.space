import { assetPathForFilename, extractImageFilename, slugify } from './content-fix.js';
import { convertCollapsibleBlocks } from '../../book-proxy/src/collapsible.js';
import { TEXTBOOK_PAGES, mediaWikiTitleToPath } from './pages.js';

export { convertCollapsibleBlocks };

const KNOWN_PATHS = new Set(Object.values(TEXTBOOK_PAGES));

/** Nova wiki department nav panels use this box-shadow on styled div wrappers. */
const NOVA_NAV_BOX_SHADOW = 'box-shadow: 0 0 .3em #999';

function slugifyAnchor(fragment: string): string {
  return slugify(decodeURIComponent(fragment.replace(/^#/, '')));
}

function wikiTitleToHref(title: string, anchor?: string): string | null {
  const path = mediaWikiTitleToPath(decodeURIComponent(title.replace(/^\/wiki\//, '')));
  if (!KNOWN_PATHS.has(path)) return null;
  if (anchor) {
    const slug = slugifyAnchor(anchor);
    return `/${path}#${slug}`;
  }
  return `/${path}`;
}

/** Clean MediaWiki HTML while preserving tables and structure. */
export function transformMediaWikiHtml(html: string, pagePath: string): string {
  let result = html;

  // Remove section edit controls ([edit | edit source] hotlinks).
  result = result.replace(
    /<span class="mw-editsection">\s*<span class="mw-editsection-bracket">\[<\/span>[\s\S]*?<span class="mw-editsection-bracket">\]<\/span>\s*<\/span>/gi,
    '',
  );
  result = result.replace(/<span class="mw-editsection">[\s\S]*?<\/span>/gi, '');
  result = result.replace(/<span class="mw-editsection-bracket">[\s\S]*?<\/span>/gi, '');
  result = result.replace(/<span class="mw-editsection-divider">[\s\S]*?<\/span>/gi, '');
  result = result.replace(/(\S)edit\s*\|\s*edit source\]/gi, '$1');
  result = result.replace(/\s*\[?\s*edit\s*\|\s*edit source\]?/gi, '');

  // Remove review / stale-content banner (before sidebar)
  result = result.replace(
    /<div style="box-shadow: 0 0 \.3em #999; border-radius: \.2em; margin: 1em[\s\S]*?#775FFF[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi,
    '',
  );

  // Remove Nova department nav panels (float sidebar + bottom guides grid)
  result = removeNovaNavPanels(result);

  // Rewrite wiki-hosted images to Wiki.js asset paths; strip missing upload links
  result = rewriteWikiImages(result);
  result = fixBrokenUploadLinks(result);

  // Strip inline recipe tooltips — keep the reagent link only
  result = stripTooltips(result);

  // Remove redlink and edit index.php anchors, keep inner text where possible
  result = result.replace(
    /<a[^>]*href="\/index\.php\?[^"]*(?:redlink=1|veaction=edit|action=edit)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
    '$1',
  );

  // Rewrite absolute wiki links
  result = result.replace(
    /<a([^>]*)href="https?:\/\/wiki\.(?:tgstation13\.org|novasector13\.com)\/([^"#]+)(#[^"]*)?"([^>]*)>([\s\S]*?)<\/a>/gi,
    (_match, pre, page, anchor, post, text) => {
      const href = wikiTitleToHref(page, anchor);
      if (!href) return text;
      return `<a${pre}href="${href}"${post}>${text}</a>`;
    },
  );

  // Rewrite /wiki/ relative links
  result = result.replace(
    /<a([^>]*)href="\/wiki\/([^"#]+)(#[^"]*)?"([^>]*)>([\s\S]*?)<\/a>/gi,
    (_match, pre, page, anchor, post, text) => {
      if (page.startsWith('File:')) return text;
      const href = wikiTitleToHref(page, anchor);
      if (!href) return text;
      return `<a${pre}href="${href}"${post}>${text}</a>`;
    },
  );

  // Same-page anchor links: normalize fragment ids
  result = result.replace(
    /<a([^>]*)href="#([^"]+)"([^>]*)>/gi,
    (_match, pre, fragment, post) => {
      const slug = slugifyAnchor(fragment);
      return `<a${pre}href="#${slug}"${post}>`;
    },
  );

  // Normalize span id anchors on reagent names
  result = result.replace(
    /<span id="([^"]+)"><\/span>/gi,
    (_match, id) => `<span id="${slugifyAnchor(id)}"></span>`,
  );

  // Convert mw-collapsible blocks to native details (no JS required)
  result = convertCollapsibleBlocks(result);

  // Strip inline MediaWiki TOC (Wiki.js generates its own)
  result = stripMediaWikiToc(result);

  // Unwrap self-links
  result = result.replace(
    /<a class="mw-selflink selflink"[^>]*>([\s\S]*?)<\/a>/gi,
    '$1',
  );

  result = stripLightThemeInlineStyles(result);

  // Drop parser-cache HTML comments (may reference RecursiveChem debug output)
  result = result.replace(/<!--[\s\S]*?-->/g, '');

  void pagePath;

  return result.trim();
}

/** Remove MediaWiki's inline table-of-contents block (deeply nested div). */
export function stripMediaWikiToc(html: string): string {
  let result = html;
  const tocRe = /<div id="toc" class="toc"[^>]*>/gi;

  for (const match of result.matchAll(tocRe)) {
    if (match.index === undefined) continue;
    result = removeBalancedDiv(result, match.index);
    tocRe.lastIndex = 0;
  }

  return result;
}

/** Remove a single outermost <div>...</div> block starting at startIndex. */
function removeBalancedDiv(html: string, startIndex: number): string {
  const end = findBalancedDivEnd(html, startIndex);
  if (end === -1) return html;
  return html.slice(0, startIndex) + html.slice(end);
}

/** Strip Nova-style nav sidebars and the site-wide guides footer grid. */
export function removeNovaNavPanels(html: string): string {
  let result = html;

  const escapedShadow = NOVA_NAV_BOX_SHADOW.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Right-floated department sidebar (MEDICAL, ENGINEERING, etc.)
  const sidebarRe = new RegExp(
    `<div style="[^"]*${escapedShadow}[^"]*width:\\s*19%[^"]*float:\\s*right[^"]*">`,
    'gi',
  );
  for (const match of result.matchAll(sidebarRe)) {
    if (match.index === undefined) continue;
    result = removeBalancedDiv(result, match.index);
    sidebarRe.lastIndex = 0;
  }

  // Site-wide multi-column "Guides" title bar (sibling precedes the flex grid)
  result = result.replace(
    new RegExp(
      `<div style="[^"]*${escapedShadow}[^"]*margin:\\s*\\.35em 0 0 0[^"]*">\\s*<div style="[^"]*font-size:\\s*110%[^"]*"><center><b>Guides</b><\\/center><\\/div>\\s*<\\/div>`,
      'gi',
    ),
    '',
  );

  // Flex row of guide columns (Starter guides, Medical guides, …)
  const flexRe = /<div style="display:\s*flex;">/gi;
  for (const match of result.matchAll(flexRe)) {
    if (match.index === undefined) continue;
    const end = findBalancedDivEnd(result, match.index);
    if (end === -1) continue;
    const block = result.slice(match.index, end);
    if (!block.includes('Starter guides')) continue;
    result = result.slice(0, match.index) + result.slice(end);
    flexRe.lastIndex = 0;
  }

  // "For more guides click here" footer chip
  result = result.replace(
    /<div style="[^"]*width:\s*15%[^"]*"><center><b>For more guides click[\s\S]*?<\/b><\/center><\/div>/gi,
    '',
  );

  return result;
}

/** Return index after the closing tag of the div opened at startIndex, or -1. */
function findBalancedDivEnd(html: string, startIndex: number): number {
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = startIndex;
  const first = tagRe.exec(html);
  if (!first || first.index !== startIndex || first[0].startsWith('</div')) {
    return -1;
  }

  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html)) !== null) {
    if (match[0].startsWith('</div')) {
      depth -= 1;
      if (depth === 0) {
        return match.index + match[0].length;
      }
    } else {
      depth += 1;
    }
  }

  return -1;
}

/** Unwrap Nova tooltip blocks; keep visible label/link, discard tooltiptext. */
export function stripTooltips(html: string): string {
  let result = stripDivTooltips(html);
  result = stripSpanTooltips(result);
  result = result.replace(/<div class="tooltiptext"[^>]*>[\s\S]*?<\/div>/gi, '');
  return result;
}

function stripDivTooltips(html: string): string {
  let result = html;
  const tooltipRe = /<div class="tooltip"[^>]*>/gi;
  let changed = true;

  while (changed) {
    changed = false;
    tooltipRe.lastIndex = 0;
    for (const match of result.matchAll(tooltipRe)) {
      if (match.index === undefined) continue;
      const end = findBalancedDivEnd(result, match.index);
      if (end === -1) continue;

      const block = result.slice(match.index, end);
      const link = block.match(/<a href="#[^"]+">[\s\S]*?<\/a>/i)?.[0] ?? '';
      result = result.slice(0, match.index) + link + result.slice(end);
      changed = true;
      break;
    }
  }

  return result;
}

function stripSpanTooltips(html: string): string {
  let result = html.replace(/<span class="tooltiptext"[^>]*>[\s\S]*?<\/span>/gi, '');

  const tooltipRe = /<span class="tooltip"[^>]*>/gi;
  let changed = true;

  while (changed) {
    changed = false;
    tooltipRe.lastIndex = 0;
    for (const match of result.matchAll(tooltipRe)) {
      if (match.index === undefined) continue;
      const end = findBalancedTagEnd(result, match.index, 'span');
      if (end === -1) continue;

      const inner = result.slice(match.index + match[0].length, end - '</span>'.length);
      result = result.slice(0, match.index) + inner + result.slice(end);
      changed = true;
      break;
    }
  }

  return result;
}

function findBalancedTagEnd(html: string, startIndex: number, tag: string): number {
  const open = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  const close = new RegExp(`</${tag}>`, 'gi');
  open.lastIndex = startIndex;
  const first = open.exec(html);
  if (!first || first.index !== startIndex) return -1;

  let depth = 1;
  let cursor = first.index + first[0].length;
  while (depth > 0) {
    open.lastIndex = cursor;
    close.lastIndex = cursor;
    const nextOpen = open.exec(html);
    const nextClose = close.exec(html);
    if (!nextClose) return -1;
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      cursor = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      if (depth === 0) return nextClose.index + nextClose[0].length;
      cursor = nextClose.index + nextClose[0].length;
    }
  }
  return -1;
}

/** Point img tags at uploaded Wiki.js assets (/filename.png). */
function rewriteImageSrc(url: string): string | null {
  const filename = extractImageFilename(url);
  if (!filename) return null;
  return assetPathForFilename(filename);
}

function isWikiImageUrl(url: string): boolean {
  if (url.includes('/images/')) return true;
  return extractImageFilename(url) !== null;
}

/** Point /images/... img tags at uploaded Wiki.js assets (/filename.png). */
export function rewriteWikiImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\ssrc="([^"]+)"/i);
    if (!srcMatch || !isWikiImageUrl(srcMatch[1])) return tag;

    const assetPath = rewriteImageSrc(srcMatch[1]);
    if (!assetPath) return tag;

    let updated = tag.replace(/\ssrc="[^"]+"/i, ` src="${assetPath}"`);

    updated = updated.replace(/\ssrcset="([^"]+)"/i, (_match, srcset: string) => {
      const rewritten = srcset
        .split(',')
        .map((entry: string) => {
          const parts = entry.trim().split(/\s+/);
          const url = parts[0];
          if (!isWikiImageUrl(url)) return entry.trim();
          const path = rewriteImageSrc(url);
          if (!path) return entry.trim();
          return [path, ...parts.slice(1)].join(' ');
        })
        .join(', ');
      return ` srcset="${rewritten}"`;
    });

    const altMatch = updated.match(/\salt="([^"]*)"/i);
    if (!altMatch) {
      const alt = assetPath.replace(/^\//, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ');
      updated = updated.replace(/<img/i, `<img alt="${alt}"`);
    }

    return updated;
  });
}

/** Drop Special:Upload placeholders for files missing on the source wiki. */
export function fixBrokenUploadLinks(html: string): string {
  let result = html;

  result = result.replace(
    /<span[^>]*typeof="mw:Error mw:File"[^>]*>\s*<a[^>]*Special:Upload[^>]*>[\s\S]*?<\/a>\s*<\/span>/gi,
    '',
  );

  result = result.replace(
    /<a[^>]*href="[^"]*Special:Upload[^"]*wpDestFile=([^"&]+)[^"]*"[^>]*>[\s\S]*?<\/a>/gi,
    (_match, rawFile) => {
      const filename = decodeURIComponent(rawFile.replace(/&amp;/g, '&'));
      if (!/\.(png|gif|jpe?g|webp|svg)$/i.test(filename)) return '';
      return `<img alt="${filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ')}" src="${assetPathForFilename(filename)}">`;
    },
  );

  return result;
}

/** Remove MediaWiki light-theme inline backgrounds so dark CSS can apply. */
function stripLightThemeInlineStyles(html: string): string {
  const dropBg = (style: string) =>
    style
      .replace(/background-color:\s*[^;]+;?\s*/gi, '')
      .replace(/background:\s*[^;]+;?\s*/gi, '')
      .replace(/;\s*;/g, ';')
      .replace(/^[\s;]+|[\s;]+$/g, '');

  let result = html.replace(
    /(<table[^>]*class="[^"]*wikitable[^"]*"[^>]*)\sstyle="([^"]*)"/gi,
    (_match, tag, style) => {
      const cleaned = dropBg(style).replace(/border:\s*[^;]+;?\s*/gi, '');
      return cleaned ? `${tag} style="${cleaned}"` : tag;
    },
  );

  result = result.replace(
    /(<(?:th|td)[^>]*)\sstyle="([^"]*)"/gi,
    (_match, tag, style) => {
      const cleaned = dropBg(style);
      return cleaned ? `${tag} style="${cleaned}"` : tag;
    },
  );

  result = result.replace(
    /(<div class="[^"]*toccolours[^"]*"[^>]*)\sstyle="([^"]*)"/gi,
    (_match, tag, style) => {
      const cleaned = dropBg(style);
      return cleaned ? `${tag} style="${cleaned}"` : tag;
    },
  );

  result = result.replace(
    /(<div class="[^"]*mw-collapsible[^"]*"[^>]*)\sstyle="([^"]*)"/gi,
    (_match, tag, style) => {
      const cleaned = dropBg(style);
      return cleaned ? `${tag} style="${cleaned}"` : tag;
    },
  );

  result = result.replace(
    /(<span[^>]*)\sstyle="([^"]*background-color:\s*white[^"]*)"/gi,
    (_match, tag, style) => {
      const cleaned = style.replace(/background-color:\s*white;?\s*/gi, '').trim();
      return `${tag} style="${cleaned}"`;
    },
  );

  return result;
}
