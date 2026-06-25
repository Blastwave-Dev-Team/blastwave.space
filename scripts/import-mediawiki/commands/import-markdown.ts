import { parseCliContext } from '../config.js';
import { DEFAULT_USER_AGENT, MediaWikiClient } from '../mediawiki-client.js';
import { markdownPipeline } from '../pipeline/markdown.js';
import { pageDescriptionForPath, TEXTBOOK_PAGES } from '../pages.js';
import { WikiJsClient } from '../wikijs-client.js';

export async function run(argv: string[]): Promise<void> {
  const context = parseCliContext(argv, { defaultSource: 'tgstation13' });
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

  for (const [mediaWikiTitle, wikiPath] of Object.entries(TEXTBOOK_PAGES)) {
    const page = await mediaWiki.fetchPage(mediaWikiTitle);
    if (!page) {
      console.warn(`skip missing page: ${mediaWikiTitle}`);
      continue;
    }

    const markdown = markdownPipeline(page.html, wikiPath);

    if (context.dryRun) {
      console.log(`[dry-run] would create ${wikiPath} (${page.title})`);
      continue;
    }

    await wiki.createPage({
      path: wikiPath,
      locale: context.locale,
      title: page.title,
      description: pageDescriptionForPath(wikiPath),
      content: markdown,
      editor: 'markdown',
      tags: ['imported', context.source.name],
    });
    console.log(`created ${wikiPath}`);
  }
}
