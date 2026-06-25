import TurndownService from 'turndown';
import { DEFAULT_SOURCES, TEXTBOOK_PAGES, type MediaWikiSource } from './pages.js';

type ImportOptions = {
  wikiGraphqlUrl: string;
  wikiApiKey: string;
  locale: string;
  source: MediaWikiSource;
  dryRun: boolean;
};

type MediaWikiPage = {
  title: string;
  html: string;
};

const CREATE_PAGE_MUTATION = `
  mutation CreatePage(
    $path: String!
    $locale: String!
    $title: String!
    $content: String!
    $editor: String!
    $isPublished: Boolean!
    $tags: [String]!
  ) {
    pages {
      create(
        path: $path
        locale: $locale
        title: $title
        content: $content
        editor: $editor
        isPublished: $isPublished
        tags: $tags
      ) {
        responseResult {
          succeeded
          message
        }
        page {
          id
          path
        }
      }
    }
  }
`;

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

async function fetchMediaWikiPage(
  source: MediaWikiSource,
  title: string,
): Promise<MediaWikiPage | null> {
  const url = new URL(source.apiUrl);
  url.searchParams.set('action', 'parse');
  url.searchParams.set('page', title);
  url.searchParams.set('prop', 'text|displaytitle');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MediaWiki HTTP ${response.status} for ${title}`);
  }

  const payload = (await response.json()) as {
    parse?: { title?: string; text?: { '*': string } };
    error?: { info?: string };
  };

  if (payload.error || !payload.parse?.text?.['*']) {
    return null;
  }

  return {
    title: payload.parse.title ?? title,
    html: payload.parse.text['*'],
  };
}

async function createWikiJsPage(
  options: ImportOptions,
  path: string,
  title: string,
  markdown: string,
): Promise<void> {
  if (options.dryRun) {
    console.log(`[dry-run] would create ${path} (${title})`);
    return;
  }

  const response = await fetch(options.wikiGraphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.wikiApiKey}`,
    },
    body: JSON.stringify({
      query: CREATE_PAGE_MUTATION,
      variables: {
        path,
        locale: options.locale,
        title,
        content: markdown,
        editor: 'markdown',
        isPublished: true,
        tags: ['imported', options.source.name],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Wiki.js HTTP ${response.status} creating ${path}`);
  }

  const payload = (await response.json()) as {
    data?: {
      pages?: {
        create?: {
          responseResult?: { succeeded?: boolean; message?: string };
          page?: { id: number; path: string };
        };
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((e) => e.message).join('; '));
  }

  const result = payload.data?.pages?.create?.responseResult;
  if (!result?.succeeded) {
    throw new Error(result?.message ?? `Failed to create ${path}`);
  }

  console.log(`created ${path}`);
}

function parseArgs(argv: string[]): ImportOptions {
  const sourceName = argv.find((arg) => arg.startsWith('--source='))?.split('=')[1] ?? 'tgstation13';
  const source = DEFAULT_SOURCES.find((entry) => entry.name === sourceName);
  if (!source) {
    throw new Error(`Unknown source ${sourceName}`);
  }

  const wikiGraphqlUrl =
    process.env.WIKIJS_GRAPHQL_URL ?? 'http://127.0.0.1:3000/graphql';
  const wikiApiKey = process.env.WIKIJS_API_KEY;
  if (!wikiApiKey) {
    throw new Error('WIKIJS_API_KEY is required');
  }

  return {
    wikiGraphqlUrl,
    wikiApiKey,
    locale: process.env.WIKIJS_LOCALE ?? 'en',
    source,
    dryRun: argv.includes('--dry-run'),
  };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  for (const [mediaWikiTitle, wikiPath] of Object.entries(TEXTBOOK_PAGES)) {
    const page = await fetchMediaWikiPage(options.source, mediaWikiTitle);
    if (!page) {
      console.warn(`skip missing page: ${mediaWikiTitle}`);
      continue;
    }

    const markdown = turndown.turndown(page.html);
    await createWikiJsPage(options, wikiPath, page.title, markdown);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
