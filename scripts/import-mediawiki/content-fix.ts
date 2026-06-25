import { TEXTBOOK_PAGES, mediaWikiTitleToPath } from './pages.js';
import { convertCollapsibleBlocks, stripMediaWikiToc } from './html-transform.js';

const KNOWN_PATHS = new Set(Object.values(TEXTBOOK_PAGES));

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const IMAGE_EXT = /\.(png|gif|jpe?g|webp|svg)$/i;

/** Strip MediaWiki thumb prefix: 32px-Foo.png → Foo.png */
function resolveThumbSegment(segment: string): string {
  const thumbPrefix = segment.match(/^\d+(?:x\d+)?px-(.+)$/i);
  return thumbPrefix ? thumbPrefix[1] : segment;
}

export function extractImageFilename(url: string): string | null {
  const trimmed = url.trim().replace(/^<|>$/g, '');
  if (!trimmed) return null;

  let pathname: string;
  try {
    pathname = trimmed.startsWith('http')
      ? new URL(trimmed).pathname
      : new URL(trimmed, 'https://placeholder.local').pathname;
  } catch {
    const match = trimmed.match(/\/([^/?#]+\.(?:png|gif|jpe?g|webp|svg))(?:\?|$)/i);
    return match ? resolveThumbSegment(decodeURIComponent(match[1])) : null;
  }

  const decoded = decodeURIComponent(pathname);

  // /images/thumb/H/HH/Original.png/32px-Original.png
  const thumbMatch = decoded.match(
    /\/images\/thumb\/(?:[^/]+\/){2}([^/]+\.(?:png|gif|jpe?g|webp|svg))\/[^/]+$/i,
  );
  if (thumbMatch) {
    return thumbMatch[1];
  }

  // /images/H/HH/File.png
  const directMatch = decoded.match(
    /\/images\/(?:[^/]+\/){2}([^/]+\.(?:png|gif|jpe?g|webp|svg))$/i,
  );
  if (directMatch) {
    return directMatch[1];
  }

  const fromPath = decoded.split('/').pop();
  if (fromPath && IMAGE_EXT.test(fromPath)) {
    return resolveThumbSegment(fromPath);
  }

  return null;
}

export function assetPathForFilename(filename: string): string {
  return `/${filename.toLowerCase()}`;
}

export function rewriteImagePaths(content: string): string {
  let result = content;

  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    const filename = extractImageFilename(url);
    if (!filename) return match;
    return `![${alt}](${assetPathForFilename(filename)})`;
  });

  result = result.replace(
    /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g,
    (match, alt, imgUrl, linkUrl) => {
      const filename = extractImageFilename(imgUrl);
      if (!filename) return match;
      return `[![${alt}](${assetPathForFilename(filename)})](${linkUrl})`;
    },
  );

  return result;
}

function fixAnchor(anchor: string): string {
  if (!anchor.startsWith('#')) return anchor;
  return `#${slugify(decodeURIComponent(anchor.slice(1)))}`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rewriteWikiPageLink(text: string, page: string, anchor?: string): string {
  const path = mediaWikiTitleToPath(decodeURIComponent(page.replace(/^\/wiki\//, '')));
  if (!KNOWN_PATHS.has(path)) return text;
  const href = anchor ? `/${path}${fixAnchor(anchor)}` : `/${path}`;
  return `[${text}](${href})`;
}

function stripMediaWikiEditArtifacts(content: string): string {
  let result = content;

  // Markdown links from turndown (full or partial index.php edit URLs)
  result = result.replace(/\\\[(\[edit\]\([^)]*\)(\s*\|\s*\[edit source\]\([^)]*\))?)\\\]/g, '');
  result = result.replace(/\[(\[edit\]\([^)]*\)(\s*\|\s*\[edit source\]\([^)]*\))?)\]/g, '');
  result = result.replace(/\[edit(?: source)?\]\([^)]*\)/g, '');
  result = result.replace(/\|\s*\[edit source\]\([^)]*\)/g, '');

  // Plain-text leftovers when mw-editsection brackets collapse (e.g. "Purityedit | edit source]")
  result = result.replace(/(\S)edit\s*\|\s*edit source\]/gi, '$1');
  result = result.replace(/\s*\[?\s*edit\s*\|\s*edit source\]?/gi, '');
  result = result.replace(/\s*\|\s*edit source\]/gi, '');

  result = result.replace(/\s*\|\s*(?=\s*$)/gm, '');

  return result;
}

function stripInlineToc(content: string): string {
  let result = stripMediaWikiToc(content);

  // Turndown markdown TOC: "## Contents" plus outline list
  result = result.replace(
    /^#{1,2}\s*(?:¶\s*)?Contents\s*\n+(?:(?:[ \t]*(?:\*|\d+\.)[^\n]*\n?)+)/gim,
    '',
  );

  // Residual toc HTML fragments (partial strips, class="toclevel-*" lists)
  result = result.replace(/<ul>\s*(?:<li class="toclevel-[\s\S]*?<\/ul>\s*)+/gi, '');

  return result;
}

export function fixContent(content: string, pagePath: string): string {
  let result = stripMediaWikiEditArtifacts(content);
  result = stripInlineToc(result);
  result = convertCollapsibleBlocks(result);

  result = result.replace(/\[File:[^\]]*\]\(\/index\.php\?title=Special:Upload[^)]*\)/g, '');
  result = result.replace(
    /\[File:[^\]]*\]\([^)]*Special:Upload[^)]*\)/g,
    '',
  );
  result = result.replace(
    /!\[([^\]]*)\]\(\/index\.php\?title=Special:Upload[^)]*wpDestFile=([^)&]+)[^)]*\)/g,
    (_match, alt, filename) => `![${alt}](${assetPathForFilename(decodeURIComponent(filename))})`,
  );
  result = result.replace(/\[([^\]]+)\]\([^)]*Special:Upload[^)]*\)/g, '');
  result = result.replace(/\[([^\]]+)\]\(\/index\.php\?title=[^)]*redlink=1[^)]*\)/g, '$1');

  result = result.replace(
    /\[([^\]]*)\]\(https?:\/\/[^/]+\/(?:wiki\/)?([^)#\s"]+)(#[^)\s"]*)?\s*(?:"[^"]*")?\)/g,
    (_match, text, page, anchor) => rewriteWikiPageLink(text, page, anchor),
  );

  result = result.replace(
    /\[([^\]]*)\]\(\/wiki\/([^)#\s"]+)(#[^)\s"]*)?\s*(?:"[^"]*")?\)/g,
    (_match, text, page, anchor) => rewriteWikiPageLink(text, page, anchor),
  );

  const selfUrlPattern = new RegExp(
    `\\[([^\\]]*)\\]\\(https?://[^)]*${escapeRegex(pagePath)}#([^)\\s"]*)\\s*(?:"[^"]*")?\\)`,
    'g',
  );
  result = result.replace(selfUrlPattern, (_match, text, fragment) => {
    return `[${text}](#${slugify(decodeURIComponent(fragment))})`;
  });

  result = result.replace(
    /\[([^\]]*)\]\(#([^)\s"]+)\s*(?:"[^"]*")?\)/g,
    (_match, text, fragment) => `[${text}](#${slugify(decodeURIComponent(fragment))})`,
  );

  // Inline HTML hash links (turndown leaves some <a href="#..."> intact)
  result = result.replace(
    /<a([^>]*)\bhref="#([^"]+)"([^>]*)>/gi,
    (_match, pre, fragment, post) =>
      `<a${pre}href="#${slugify(decodeURIComponent(fragment))}"${post}>`,
  );

  result = rewriteImagePaths(result);

  result = result.replace(/\[\s*\]\([^)]*\)/g, '');
  result = result.replace(/\n{3,}/g, '\n\n');

  return result;
}
