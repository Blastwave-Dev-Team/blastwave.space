import { slugify } from '../content-fix.js';
import { parseCliContext } from '../config.js';
import { DEFAULT_USER_AGENT, MediaWikiClient } from '../mediawiki-client.js';
import { markdownPipeline } from '../pipeline/markdown.js';
import { HTML_IMPORT_PATHS, TEXTBOOK_PAGES } from '../pages.js';
import { WikiJsClient } from '../wikijs-client.js';

function remainingUnderscoreAnchors(content: string): string[] {
  const matches = content.match(/#([a-z0-9]+(?:_[a-z0-9]+)+)/gi) ?? [];
  return [...new Set(matches.map((match) => match.toLowerCase()))];
}

export async function run(argv: string[]): Promise<void> {
  const context = parseCliContext(argv, { defaultSource: 'novasector13' });
  const onlyArg = argv.find((arg) => arg.startsWith('--only='))?.split('=')[1];

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

  const entries = Object.entries(TEXTBOOK_PAGES).filter(([, path]) => {
    if (HTML_IMPORT_PATHS.has(path)) return false;
    if (!onlyArg) return true;
    return path === onlyArg || path === onlyArg.replace(/_/g, '-');
  });

  if (entries.length === 0) {
    throw new Error(`No pages matched --only=${onlyArg ?? '(none)'}`);
  }

  const pagesByPath = new Map((await wiki.listPages()).map((page) => [page.path, page]));

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const [mediaWikiTitle, wikiPath] of entries) {
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
    const badAnchors = remainingUnderscoreAnchors(markdown);

    if (badAnchors.length > 0) {
      console.warn(`${wikiPath}: leftover underscore anchors: ${badAnchors.join(', ')}`);
    }

    const { content: existingContent, tags } = await wiki.getPageContent(targetPage.id);

    if (markdown === existingContent) {
      console.log(`skip ${wikiPath} (no changes)`);
      skipped++;
      continue;
    }

    if (context.dryRun) {
      console.log(`[dry-run] would update ${wikiPath}`);
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

  console.log(
    `done: updated=${updated} skipped=${skipped} failed=${failed} (e.g. ${slugify('Can_We_Fix_It?')})`,
  );
}
