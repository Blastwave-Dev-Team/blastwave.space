import { readFileSync } from 'node:fs';
import { parseCliContext } from '../config.js';
import { DEFAULT_USER_AGENT, MediaWikiClient } from '../mediawiki-client.js';
import { extractLocalWikiContent, htmlPipeline } from '../pipeline/html.js';
import { HTML_IMPORT_PAGES, pageDescriptionForPath } from '../pages.js';
import { WikiJsClient } from '../wikijs-client.js';

/** Fallback local HTML when Nova API lacks the page (tg-only content). */
const LOCAL_HTML_FALLBACK: Partial<Record<string, string>> = {
  Tactical_Game_Cards: String.raw`C:\Users\robot\Downloads\Tactical Game Cards - _tg_station 13 Wiki.html`,
};

function resolvePages(argv: string[]): Record<string, string> {
  const onlyArg = argv.find((arg) => arg.startsWith('--only='))?.split('=')[1];
  if (!onlyArg) return HTML_IMPORT_PAGES;

  const match = Object.entries(HTML_IMPORT_PAGES).find(
    ([, path]) => path === onlyArg || path === onlyArg.replace(/^Guide_to_/, 'guide-to-'),
  );
  if (!match) throw new Error(`Unknown page ${onlyArg}`);
  return { [match[0]]: match[1] };
}

export async function run(argv: string[]): Promise<void> {
  const context = parseCliContext(argv, {
    defaultSource: 'novasector13',
    requireWikiKey: false,
  });
  const pages = resolvePages(argv);
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

  for (const [mediaWikiTitle, wikiPath] of Object.entries(pages)) {
    let page = await mediaWiki.fetchPage(mediaWikiTitle);
    if (!page) {
      const localFile = LOCAL_HTML_FALLBACK[mediaWikiTitle];
      if (localFile) {
        const raw = readFileSync(localFile, 'utf-8');
        page = {
          title: mediaWikiTitle.replace(/_/g, ' '),
          html: extractLocalWikiContent(raw),
        };
        console.log(`using local HTML for ${mediaWikiTitle}`);
      } else {
        console.warn(`skip missing page: ${mediaWikiTitle}`);
        continue;
      }
    }

    const html = htmlPipeline(page.html, wikiPath);

    if (context.dryRun) {
      console.log(
        `[dry-run] would re-import ${wikiPath} (${page.title}) [${html.length} chars, ${(html.match(/<table/gi) ?? []).length} tables]`,
      );
      continue;
    }

    const existingId = await wiki.findPageByPath(wikiPath, context.locale);
    if (existingId !== null) {
      await wiki.deletePage(existingId);
      console.log(`deleted existing ${wikiPath} (id ${existingId})`);
    }

    const created = await wiki.createPage({
      path: wikiPath,
      locale: context.locale,
      title: page.title,
      description: pageDescriptionForPath(wikiPath),
      content: html,
      editor: 'code',
      tags: ['imported', context.source.name, 'html'],
    });
    console.log(`created ${wikiPath} (id ${created.id})`);
    await wiki.renderPage(created.id);
    console.log(`rendered ${wikiPath}`);
  }

  if (!context.dryRun) {
    await wiki.flushCache();
    console.log('cache flushed');
  }
}
