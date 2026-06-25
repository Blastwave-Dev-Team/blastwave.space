import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetPathForFilename } from '../content-fix.js';
import { parseCliContext } from '../config.js';
import { DEFAULT_USER_AGENT, MediaWikiClient } from '../mediawiki-client.js';
import { guessContentType, WikiJsClient } from '../wikijs-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(__dirname, '..', '.wiki-image-manifest.json');

type ImageManifest = Record<string, { assetPath: string; uploadedAt: string }>;

function loadManifest(): ImageManifest {
  if (!existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as ImageManifest;
}

function saveManifest(manifest: ImageManifest): void {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function downloadImage(url: string, userAgent: string): Promise<Uint8Array> {
  const response = await fetch(url, {
    headers: { 'User-Agent': userAgent },
  });
  if (!response.ok) {
    throw new Error(`Download HTTP ${response.status} for ${url}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

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

  const manifest = loadManifest();
  const images = await mediaWiki.collectTextbookImages();
  const filenames = [...images.keys()].sort();

  console.log(`Found ${filenames.length} unique images across textbook pages`);

  const unresolved = filenames.filter((name) => !manifest[name]);
  const urlMap = await mediaWiki.resolveImageUrls(unresolved);
  console.log(`Resolved ${urlMap.size}/${unresolved.length} download URLs`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  const missingOnSource: string[] = [];

  for (const filename of filenames) {
    if (manifest[filename]) {
      skipped++;
      continue;
    }

    const downloadUrl = urlMap.get(filename);
    if (!downloadUrl) {
      missingOnSource.push(filename);
      failed++;
      continue;
    }

    if (context.dryRun) {
      console.log(`[dry-run] would upload ${filename} from ${downloadUrl}`);
      continue;
    }

    try {
      const bytes = await downloadImage(downloadUrl, DEFAULT_USER_AGENT);
      await wiki.uploadAsset(filename, bytes, guessContentType(filename));
      manifest[filename] = {
        assetPath: assetPathForFilename(filename),
        uploadedAt: new Date().toISOString(),
      };
      saveManifest(manifest);
      uploaded++;
      if (uploaded % 25 === 0) {
        console.log(`uploaded ${uploaded}...`);
      }
    } catch (error) {
      failed++;
      console.error(`FAILED ${filename}: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (missingOnSource.length > 0) {
    console.warn(
      `skip unresolved (${missingOnSource.length} not on source wiki): ${missingOnSource.slice(0, 15).join(', ')}${missingOnSource.length > 15 ? '...' : ''}`,
    );
  }

  console.log(`done: uploaded=${uploaded} skipped=${skipped} failed=${failed}`);
}
