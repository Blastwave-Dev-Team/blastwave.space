import { fixContent } from '../content-fix.js';
import { parseCliContext } from '../config.js';
import { WikiJsClient } from '../wikijs-client.js';

export async function run(argv: string[]): Promise<void> {
  const context = parseCliContext(argv);
  const wiki = new WikiJsClient({
    graphqlUrl: context.wikiGraphqlUrl,
    apiKey: context.wikiApiKey,
    uploadFolderId: context.uploadFolderId,
  });

  const pages = await wiki.listPages();
  console.log(`Found ${pages.length} pages to process`);

  let updated = 0;

  for (const page of pages) {
    if (page.path === 'home') continue;

    const { content, tags } = await wiki.getPageContent(page.id);
    const fixed = fixContent(content, page.path);

    if (fixed === content) {
      console.log(`skip ${page.path} (no changes)`);
      continue;
    }

    if (context.dryRun) {
      const diffLines = content.split('\n').length - fixed.split('\n').length;
      console.log(
        `[dry-run] would update ${page.path} (${diffLines > 0 ? '-' : '+'}${Math.abs(diffLines)} lines)`,
      );
      continue;
    }

    try {
      await wiki.updateAndRender(page.id, fixed, tags);
      console.log(`updated ${page.path}`);
      updated++;
    } catch (error) {
      console.error(`FAILED ${page.path}: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (!context.dryRun && updated > 0) {
    await wiki.flushCache();
    console.log('cache flushed');
  }
}
