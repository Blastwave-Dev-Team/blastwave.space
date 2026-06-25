import { parseCliContext } from '../config.js';
import { DEFAULT_USER_AGENT, MediaWikiClient } from '../mediawiki-client.js';
import { markdownPipeline } from '../pipeline/markdown.js';
import { HTML_IMPORT_PATHS, TEXTBOOK_PAGES } from '../pages.js';
import { WikiJsClient } from '../wikijs-client.js';

export async function run(argv: string[]): Promise<void> {
  const context = parseCliContext(argv, { defaultSource: 'novasector13' });
  const mediaWiki = new MediaWikiClient({
    apiUrl: context.source.apiUrl,
    userAgent: DEFAULT_USER_AGENT,
    delayMs: context.delayMs,
  });
  const wiki = new WikiJsClient({
    graphqlUrl: context.wikiGraphqlUrl,
    apiKey: context.wikiApiKey,
    uploadFolderId: context.uploadFolderId,
  });

  const wikiPages = await wiki.listPages();
  const pagesByPath = new Map(wikiPages.map((page) => [page.path, page]));

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const [mediaWikiTitle, wikiPath] of Object.entries(TEXTBOOK_PAGES)) {
    if (HTML_IMPORT_PATHS.has(wikiPath)) {
      console.log(`skip ${wikiPath} (HTML import — use import html)`);
      skipped++;
      continue;
    }

    const targetPage = pagesByPath.get(wikiPath);
    if (!targetPage) {
      console.warn(`skip missing wiki page: ${wikiPath}`);
      skipped++;
      continue;
    }

    const sourcePage = await mediaWiki.fetchPage(mediaWikiTitle);
    if (!sourcePage) {
      console.warn(`skip missing source page: ${mediaWikiTitle}`);
      skipped++;
      continue;
    }

    const markdown = markdownPipeline(sourcePage.html, wikiPath);
    const { content: existingContent, tags } = await wiki.getPageContent(targetPage.id);

    if (markdown === existingContent) {
      console.log(`skip ${wikiPath} (no changes)`);
      skipped++;
      continue;
    }

    if (context.dryRun) {
      const delta = markdown.length - existingContent.length;
      console.log(`[dry-run] would update ${wikiPath} (${delta >= 0 ? '+' : ''}${delta} chars)`);
      continue;
    }

    try {
      await wiki.updateAndRender(targetPage.id, markdown, tags);
      console.log(`updated ${wikiPath}`);
      updated++;
    } catch (error) {
      failed++;
      console.error(`FAILED ${wikiPath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (!context.dryRun && updated > 0) {
    await wiki.flushCache();
    console.log('cache flushed');
  }

  console.log(`done: updated=${updated} skipped=${skipped} failed=${failed}`);
}
