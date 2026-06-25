import { transformMediaWikiHtml } from '../html-transform.js';

export function htmlPipeline(html: string, wikiPath: string): string {
  return transformMediaWikiHtml(html, wikiPath);
}

export function extractLocalWikiContent(html: string): string {
  const startMarker = '<div class="mw-content-ltr mw-parser-output"';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) throw new Error('Could not find mw-parser-output');

  const endMarker = '<div class="printfooter"';
  const endIdx = html.indexOf(endMarker, startIdx);
  if (endIdx === -1) throw new Error('Could not find printfooter');

  return html.slice(startIdx, endIdx);
}
