import TurndownService from 'turndown';
import { fixContent } from '../content-fix.js';
import { transformMediaWikiHtml } from '../html-transform.js';

let turndownInstance: TurndownService | null = null;

export function createTurndownService(): TurndownService {
  if (!turndownInstance) {
    turndownInstance = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
  }
  return turndownInstance;
}

export function markdownPipeline(html: string, wikiPath: string): string {
  const transformed = transformMediaWikiHtml(html, wikiPath);
  return fixContent(createTurndownService().turndown(transformed), wikiPath);
}
