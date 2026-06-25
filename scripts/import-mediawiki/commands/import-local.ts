import { readFileSync } from 'node:fs';
import { parseCliContext } from '../config.js';
import { extractLocalWikiContent } from '../pipeline/html.js';
import { createTurndownService } from '../pipeline/markdown.js';
import { pageDescriptionForPath } from '../pages.js';
import { WikiJsClient } from '../wikijs-client.js';

type PageDef = {
  file: string;
  path: string;
  title: string;
};

const PAGES: PageDef[] = [
  {
    file: String.raw`C:\Users\robot\Downloads\E.X.P.E.R.I-MENTOR - _tg_station 13 Wiki.html`,
    path: 'experimentor',
    title: 'E.X.P.E.R.I-MENTOR',
  },
  {
    file: String.raw`C:\Users\robot\Downloads\Tactical Game Cards - _tg_station 13 Wiki.html`,
    path: 'tactical-game-cards',
    title: 'Tactical Game Cards',
  },
  {
    file: String.raw`C:\Users\robot\Downloads\Guide to telescience - _tg_station 13 Wiki.html`,
    path: 'guide-to-telescience',
    title: 'Guide to Telescience',
  },
];

export async function run(argv: string[]): Promise<void> {
  const context = parseCliContext(argv, { defaultSource: 'tgstation13' });
  const wiki = new WikiJsClient({
    graphqlUrl: context.wikiGraphqlUrl,
    apiKey: context.wikiApiKey,
    uploadFolderId: context.uploadFolderId,
  });
  const turndown = createTurndownService();

  for (const page of PAGES) {
    const raw = readFileSync(page.file, 'utf-8');
    const contentHtml = extractLocalWikiContent(raw);
    const markdown = turndown.turndown(contentHtml);

    if (context.dryRun) {
      console.log(`[dry-run] would create ${page.path} (${page.title}) [${markdown.length} chars]`);
      continue;
    }

    await wiki.createPage({
      path: page.path,
      locale: context.locale,
      title: page.title,
      description: pageDescriptionForPath(page.path),
      content: markdown,
      editor: 'markdown',
      tags: ['imported', 'tgstation13'],
    });
    console.log(`created ${page.path}`);
  }
}
