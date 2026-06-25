import Fastify from 'fastify';
import { TtlCache } from './cache.js';
import { renderBookPage, renderError, renderNotFound } from './template.js';
import { slugCandidates } from './slug.js';
import { WikiClient } from './wikijs.js';

type EnvConfig = {
  host: string;
  port: number;
  cacheTtlSeconds: number;
  wiki: {
    graphqlUrl: string;
    apiKey: string;
    locale: string;
  };
};

function readConfig(): EnvConfig {
  const apiKey = process.env.WIKIJS_API_KEY;
  if (!apiKey) {
    throw new Error('WIKIJS_API_KEY is required');
  }

  return {
    host: process.env.HOST ?? '0.0.0.0',
    port: Number(process.env.PORT ?? 3001),
    cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 300),
    wiki: {
      graphqlUrl: process.env.WIKIJS_GRAPHQL_URL ?? 'http://127.0.0.1:3000/graphql',
      apiKey,
      locale: process.env.WIKIJS_LOCALE ?? 'en',
    },
  };
}

async function main(): Promise<void> {
  const config = readConfig();
  const wiki = new WikiClient(config.wiki);
  const cache = new TtlCache(config.cacheTtlSeconds * 1000);
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ ok: true }));

  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const cached = cache.get(slug);
    if (cached) {
      return reply.type('text/html; charset=utf-8').send(cached);
    }

    try {
      for (const candidate of slugCandidates(slug)) {
        const page = await wiki.fetchPage(candidate);
        if (!page?.render) {
          continue;
        }

        const html = renderBookPage(page.title, page.render);
        cache.set(slug, html);
        cache.set(candidate, html);
        return reply.type('text/html; charset=utf-8').send(html);
      }

      return reply
        .code(404)
        .type('text/html; charset=utf-8')
        .send(renderNotFound(slug));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load wiki page';
      request.log.error(error, 'book proxy fetch failed');
      return reply
        .code(502)
        .type('text/html; charset=utf-8')
        .send(renderError(message));
    }
  });

  await app.listen({ host: config.host, port: config.port });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
