import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCliContext } from '../config.js';
import { DEFAULT_USER_AGENT, MediaWikiClient } from '../mediawiki-client.js';
import { TEXTBOOK_PAGES } from '../pages.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(__dirname, '..', '.wiki-image-manifest.json');
const UNRESOLVED_PATH = join(__dirname, '..', '.wiki-unresolved-images.json');

type ImageManifest = Record<string, { assetPath: string; uploadedAt: string }>;

type UnresolvedEntry = {
  filename: string;
  pages: string[];
};

type AnalyzeResult = {
  filename: string;
  pages: string[];
  recoverableFromHtml: boolean;
  htmlImagePaths: string[];
};

function loadManifest(): ImageManifest {
  if (!existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as ImageManifest;
}

function mediaWikiTitlesForWikiPath(wikiPath: string): string[] {
  return Object.entries(TEXTBOOK_PAGES)
    .filter(([, path]) => path === wikiPath)
    .map(([title]) => title);
}

function extractHtmlImagePaths(html: string): string[] {
  const matches = html.match(/\/images\/[^"'>\s]+/gi) ?? [];
  return [...new Set(matches)];
}

function filenameMatchesHtmlPath(filename: string, htmlPath: string): boolean {
  const normalizedFilename = filename.replace(/ /g, '_').toLowerCase();
  return htmlPath.toLowerCase().includes(normalizedFilename);
}

async function collectUnresolved(
  context: ReturnType<typeof parseCliContext>,
): Promise<UnresolvedEntry[]> {
  const manifest = loadManifest();
  const mediaWiki = new MediaWikiClient({
    apiUrl: context.source.apiUrl,
    userAgent: DEFAULT_USER_AGENT,
    delayMs: context.delayMs,
  });

  const images = await mediaWiki.collectTextbookImages();
  const unresolved: UnresolvedEntry[] = [];

  for (const [filename, pages] of images) {
    if (manifest[filename]) continue;
    unresolved.push({
      filename,
      pages: [...pages].sort(),
    });
  }

  return unresolved.sort((a, b) => a.filename.localeCompare(b.filename));
}

async function analyzeUnresolved(
  context: ReturnType<typeof parseCliContext>,
  unresolved: UnresolvedEntry[],
): Promise<AnalyzeResult[]> {
  const mediaWiki = new MediaWikiClient({
    apiUrl: context.source.apiUrl,
    userAgent: DEFAULT_USER_AGENT,
    delayMs: context.delayMs,
  });

  const results: AnalyzeResult[] = [];

  for (const entry of unresolved) {
    const htmlImagePaths = new Set<string>();

    for (const wikiPath of entry.pages) {
      for (const mediaWikiTitle of mediaWikiTitlesForWikiPath(wikiPath)) {
        const sourcePage = await mediaWiki.fetchPage(mediaWikiTitle);
        if (!sourcePage) continue;

        for (const htmlPath of extractHtmlImagePaths(sourcePage.html)) {
          if (filenameMatchesHtmlPath(entry.filename, htmlPath)) {
            htmlImagePaths.add(htmlPath);
          }
        }
      }
    }

    results.push({
      filename: entry.filename,
      pages: entry.pages,
      recoverableFromHtml: htmlImagePaths.size > 0,
      htmlImagePaths: [...htmlImagePaths].sort(),
    });
  }

  return results;
}

export async function run(argv: string[]): Promise<void> {
  const context = parseCliContext(argv, { defaultSource: 'novasector13' });
  const unresolved = await collectUnresolved(context);

  if (argv.includes('--analyze')) {
    const results = await analyzeUnresolved(context, unresolved);
    const recoverable = results.filter((entry) => entry.recoverableFromHtml);
    const notRecoverable = results.filter((entry) => !entry.recoverableFromHtml);

    console.log(`Unresolved images: ${results.length}`);
    console.log(`Potentially recoverable from HTML: ${recoverable.length}`);
    console.log(`Not found in rendered HTML: ${notRecoverable.length}`);

    for (const entry of recoverable.slice(0, 20)) {
      console.log(`  ${entry.filename}: ${entry.htmlImagePaths.join(', ')}`);
    }
    if (recoverable.length > 20) {
      console.log(`  ... and ${recoverable.length - 20} more`);
    }

    return;
  }

  writeFileSync(UNRESOLVED_PATH, `${JSON.stringify(unresolved, null, 2)}\n`);
  console.log(`Wrote ${unresolved.length} unresolved images to ${UNRESOLVED_PATH}`);

  const grouped = new Map<string, number>();
  for (const entry of unresolved) {
    for (const page of entry.pages) {
      grouped.set(page, (grouped.get(page) ?? 0) + 1);
    }
  }

  console.log('Unresolved by page:');
  for (const [page, count] of [...grouped.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${page}: ${count}`);
  }
}
