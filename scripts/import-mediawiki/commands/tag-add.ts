import { parseCliContext } from '../config.js';
import { WikiJsClient } from '../wikijs-client.js';

export async function run(argv: string[]): Promise<void> {
  const positional = argv.filter((arg) => !arg.startsWith('--'));
  const [pagePath, ...newTags] = positional;
  if (!pagePath || newTags.length === 0) {
    throw new Error('Usage: wiki tag add <page-path> <tag> [tag...]');
  }

  const context = parseCliContext(argv);
  const client = new WikiJsClient({
    graphqlUrl: context.wikiGraphqlUrl,
    apiKey: context.wikiApiKey,
    uploadFolderId: context.uploadFolderId,
  });

  const pages = await client.listPages();
  const page = pages.find((entry) => entry.path === pagePath);
  if (!page) {
    throw new Error(`No page found for path: ${pagePath}`);
  }

  const meta = await client.getPageMeta(page.id);
  const tags = [...new Set([...meta.tags, ...newTags])];

  await client.updateAndRender(page.id, meta.content, tags);

  console.log(`Updated tags on ${pagePath}: ${tags.join(', ')}`);
}
