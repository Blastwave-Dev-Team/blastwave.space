import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMaintenanceBannerClientScript } from '../../../book-proxy/src/maintenance-banners.js';
import { parseCliContext } from '../config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const themeDir = join(__dirname, '../../../wiki-theme');

type ThemeConfig = {
  theme: string;
  iconset: string;
  darkMode: boolean;
  tocPosition: string;
};

const GET_THEME_QUERY = `
  query GetThemeConfig {
    theming {
      config {
        theme
        iconset
        darkMode
        tocPosition
      }
    }
  }
`;

const SET_THEME_MUTATION = `
  mutation SetTheme(
    $theme: String!
    $iconset: String!
    $darkMode: Boolean!
    $tocPosition: String
    $injectCSS: String!
    $injectHead: String!
    $injectBody: String!
  ) {
    theming {
      setConfig(
        theme: $theme
        iconset: $iconset
        darkMode: $darkMode
        tocPosition: $tocPosition
        injectCSS: $injectCSS
        injectHead: $injectHead
        injectBody: $injectBody
      ) {
        responseResult { succeeded message }
      }
    }
  }
`;

async function graphql<T>(
  graphqlUrl: string,
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Wiki.js HTTP ${response.status}: ${raw.slice(0, 500)}`);
  }

  const payload = JSON.parse(raw) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }

  if (!payload.data) {
    throw new Error(`Wiki.js GraphQL returned no data: ${raw.slice(0, 500)}`);
  }

  return payload.data;
}

async function getThemeConfig(graphqlUrl: string, apiKey: string): Promise<ThemeConfig> {
  const data = await graphql<{ theming: { config: ThemeConfig } }>(
    graphqlUrl,
    apiKey,
    GET_THEME_QUERY,
  );
  return data.theming.config;
}

export async function run(argv: string[]): Promise<void> {
  const context = parseCliContext(argv);
  const current = await getThemeConfig(context.wikiGraphqlUrl, context.wikiApiKey);
  const tocPosition =
    process.env.WIKIJS_TOC_POSITION ?? current.tocPosition ?? 'right';

  const injectCSS =
    readFileSync(join(themeDir, 'inject.css'), 'utf8') +
    '\n\n/* Maintenance banners */\n\n' +
    readFileSync(join(themeDir, 'maintenance-banners.css'), 'utf8');

  const injectHead = `<script>\n${buildMaintenanceBannerClientScript()}\n</script>`;

  const data = await graphql<{
    theming: {
      setConfig: { responseResult: { succeeded: boolean; message: string } };
    };
  }>(context.wikiGraphqlUrl, context.wikiApiKey, SET_THEME_MUTATION, {
    theme: current.theme || 'default',
    iconset: current.iconset || 'mdi',
    darkMode: current.darkMode,
    tocPosition,
    injectCSS,
    injectHead,
    injectBody: '',
  });

  const result = data.theming.setConfig.responseResult;
  if (!result.succeeded) {
    throw new Error(result.message ?? 'Theme update failed');
  }

  console.log(`Wiki.js theme deployed (tocPosition=${tocPosition})`);
}
