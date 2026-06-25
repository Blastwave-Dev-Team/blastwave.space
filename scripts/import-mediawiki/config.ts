import { DEFAULT_SOURCES, type MediaWikiSource } from './pages.js';

export type CliContext = {
  source: MediaWikiSource;
  dryRun: boolean;
  delayMs: number;
  uploadFolderId: number;
  wikiGraphqlUrl: string;
  wikiApiKey: string;
  locale: string;
};

export function requireEnv(name: string, options?: { allowEmpty?: boolean }): string {
  const value = process.env[name];
  if (!value && !options?.allowEmpty) {
    throw new Error(`${name} is required`);
  }
  return value ?? '';
}

export function resolveSource(flag: string | undefined, defaultName?: string): MediaWikiSource {
  const nameOrUrl = flag ?? defaultName;
  if (!nameOrUrl) {
    throw new Error('--source=<preset|url> is required');
  }

  if (nameOrUrl.startsWith('http://') || nameOrUrl.startsWith('https://')) {
    return { name: 'custom', apiUrl: nameOrUrl };
  }

  const preset = DEFAULT_SOURCES.find((entry) => entry.name === nameOrUrl);
  if (!preset) {
    throw new Error(
      `Unknown source "${nameOrUrl}". Presets: ${DEFAULT_SOURCES.map((entry) => entry.name).join(', ')}`,
    );
  }

  return preset;
}

export function parseCliContext(
  argv: string[],
  options?: {
    defaultSource?: string;
    requireWikiKey?: boolean;
  },
): CliContext {
  const dryRun = argv.includes('--dry-run');
  const sourceArg =
    argv.find((arg) => arg.startsWith('--source='))?.split('=')[1] ??
    argv.find((arg) => arg.startsWith('--source-api='))?.split('=')[1];

  const source = resolveSource(sourceArg, options?.defaultSource);

  const delayArg = argv.find((arg) => arg.startsWith('--delay-ms='))?.split('=')[1];
  const folderArg = argv.find((arg) => arg.startsWith('--folder-id='))?.split('=')[1];

  const wikiGraphqlUrl = process.env.WIKIJS_GRAPHQL_URL;
  if (!wikiGraphqlUrl && !dryRun) {
    throw new Error('WIKIJS_GRAPHQL_URL is required');
  }

  const requireKey = options?.requireWikiKey !== false;
  const wikiApiKey = process.env.WIKIJS_API_KEY ?? '';
  if (requireKey && !wikiApiKey && !dryRun) {
    throw new Error('WIKIJS_API_KEY is required');
  }

  return {
    source,
    dryRun,
    delayMs: delayArg ? Number(delayArg) : 100,
    uploadFolderId: folderArg ? Number(folderArg) : 0,
    wikiGraphqlUrl: wikiGraphqlUrl ?? 'http://127.0.0.1:3000/graphql',
    wikiApiKey,
    locale: process.env.WIKIJS_LOCALE ?? 'en',
  };
}
