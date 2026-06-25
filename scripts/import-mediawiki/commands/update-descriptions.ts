import { parseCliContext } from '../config.js';
import { PAGE_DESCRIPTIONS } from '../pages.js';
import { WikiJsClient } from '../wikijs-client.js';

export async function run(argv: string[]): Promise<void> {
  const context = parseCliContext(argv);
  const wiki = new WikiJsClient({
    graphqlUrl: context.wikiGraphqlUrl,
    apiKey: context.wikiApiKey,
    uploadFolderId: context.uploadFolderId,
  });

  const pages = await wiki.listPages();
  const pagesByPath = new Map(pages.map((page) => [page.path, page]));

  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const [path, description] of Object.entries(PAGE_DESCRIPTIONS)) {
    const page = pagesByPath.get(path);
    if (!page) {
      console.warn(`skip missing wiki page: ${path}`);
      missing++;
      continue;
    }

    const current = await wiki.getPageDescription(page.id);
    if (current === description) {
      console.log(`skip ${path} (unchanged)`);
      skipped++;
      continue;
    }

    if (context.dryRun) {
      console.log(`[dry-run] ${path}:`);
      console.log(`  was: ${current}`);
      console.log(`  new: ${description}`);
      continue;
    }

    await wiki.updatePageDescription(page.id, description);
    console.log(`updated ${path}`);
    updated++;
  }

  console.log(`done: updated=${updated} skipped=${skipped} missing=${missing}`);
}
