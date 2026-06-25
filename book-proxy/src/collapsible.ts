const COLLAPSIBLE_CONTAINER = /\bmw-collapsible(?!-content)\b/;

function hasCollapsibleContainerClass(classAttr: string): boolean {
  return COLLAPSIBLE_CONTAINER.test(classAttr);
}

function extractClassAttr(openTag: string): string {
  return openTag.match(/class="([^"]*)"/i)?.[1] ?? '';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripTagsToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripSummaryHtml(header: string): string {
  return stripTagsToText(header);
}

function extractHeadlineTitle(header: string): { title: string; remainder: string } | null {
  const cleaned = header.replace(/<span class="mw-editsection">[\s\S]*?<\/span>/gi, '');

  const headlineMatch = cleaned.match(
    /<h[1-6][^>]*>[\s\S]*?<span[^>]*class="[^"]*mw-headline[^"]*"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/h[1-6]>/i,
  );
  if (headlineMatch) {
    return {
      title: stripTagsToText(headlineMatch[1]),
      remainder: cleaned.replace(headlineMatch[0], '').trim(),
    };
  }

  const headingMatch = cleaned.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
  if (headingMatch) {
    return {
      title: stripTagsToText(headingMatch[1]),
      remainder: cleaned.replace(headingMatch[0], '').trim(),
    };
  }

  return null;
}

function cleanDescriptionHtml(html: string): string {
  let result = html.replace(/<span class="mw-editsection">[\s\S]*?<\/span>/gi, '').trim();
  if (!result) return '';

  const paragraphMatch = result.match(/^<p[^>]*>([\s\S]*)<\/p>$/i);
  if (paragraphMatch) result = paragraphMatch[1].trim();

  const smallSpanMatch = result.match(/^<span[^>]*style="[^"]*font-size:\s*0\.9em[^"]*"[^>]*>([\s\S]*)<\/span>$/i);
  if (smallSpanMatch) result = smallSpanMatch[1].trim();

  return result.trim();
}

function buildSummaryHtml(header: string): string {
  const parsed = extractHeadlineTitle(header);
  if (!parsed?.title) {
    return stripSummaryHtml(header) || 'Expand';
  }

  const descInner = cleanDescriptionHtml(parsed.remainder);
  let summary = `<span class="collapsible-title">${escapeHtml(parsed.title)}</span>`;
  if (descInner) {
    summary += `<p class="collapsible-desc">${descInner}</p>`;
  }
  return summary;
}

function findBalancedDivClose(html: string, searchFrom: number): number {
  let depth = 1;
  let index = searchFrom;

  while (index < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', index);
    const nextClose = html.indexOf('</div>', index);
    if (nextClose === -1) return -1;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      index = nextOpen + 4;
      continue;
    }

    depth -= 1;
    index = nextClose + 6;
    if (depth === 0) return index;
  }

  return -1;
}

function findNextCollapsibleOpen(html: string, fromIndex: number): { index: number; tag: string } | null {
  const pattern = /<div\b[^>]*class="[^"]*"[^>]*>/gi;
  pattern.lastIndex = fromIndex;

  for (let match = pattern.exec(html); match; match = pattern.exec(html)) {
    const classAttr = extractClassAttr(match[0]);
    if (hasCollapsibleContainerClass(classAttr)) {
      return { index: match.index, tag: match[0] };
    }
  }

  return null;
}

function convertTableCollapsible(
  html: string,
  openIndex: number,
  openTag: string,
  classAttr: string,
): { replacement: string; end: number } | null {
  const openEnd = openIndex + openTag.length;
  const afterOpen = html.slice(openEnd).match(/^\s*(<table[\s\S]*?<\/table>)\s*<\/div>/i);
  if (!afterOpen) return null;

  const openAttr = classAttr.includes('mw-collapsed') ? '' : ' open';
  const table = afterOpen[1];
  const end = openEnd + afterOpen[0].length;

  return {
    replacement: `<details class="mw-collapsible"${openAttr}><summary><span class="collapsible-title">Click to expand table</span></summary><div class="mw-collapsible-content">${table}</div></details>`,
    end,
  };
}

function convertStandardCollapsible(
  html: string,
  openIndex: number,
  openTag: string,
  classAttr: string,
): { replacement: string; end: number } | null {
  const openEnd = openIndex + openTag.length;
  const contentOpen = html.indexOf('<div class="mw-collapsible-content">', openEnd);
  if (contentOpen === -1) return null;

  const header = html.slice(openEnd, contentOpen);
  const contentStart = contentOpen + '<div class="mw-collapsible-content">'.length;
  const contentEnd = findBalancedDivClose(html, contentStart);
  if (contentEnd === -1) return null;

  const outerEnd = findBalancedDivClose(html, openEnd);
  if (outerEnd === -1 || outerEnd < contentEnd) return null;

  const content = html.slice(contentStart, contentEnd - 6);
  const summary = buildSummaryHtml(header);
  const openAttr = classAttr.includes('mw-collapsed') ? '' : ' open';

  return {
    replacement: `<details class="mw-collapsible"${openAttr}><summary>${summary}</summary><div class="mw-collapsible-content">${content}</div></details>`,
    end: outerEnd,
  };
}

/** Convert MediaWiki collapsible divs to native <details> (no JS required). */
export function convertCollapsibleBlocks(html: string): string {
  let result = html;
  let searchFrom = 0;

  while (searchFrom < result.length) {
    const open = findNextCollapsibleOpen(result, searchFrom);
    if (!open) break;

    const classAttr = extractClassAttr(open.tag);
    const converted =
      convertTableCollapsible(result, open.index, open.tag, classAttr) ??
      convertStandardCollapsible(result, open.index, open.tag, classAttr);

    if (!converted) {
      searchFrom = open.index + open.tag.length;
      continue;
    }

    result =
      result.slice(0, open.index) + converted.replacement + result.slice(converted.end);
    searchFrom = open.index + converted.replacement.length;
  }

  return result;
}
