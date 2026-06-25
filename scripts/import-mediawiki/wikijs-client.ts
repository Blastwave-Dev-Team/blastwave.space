import { parseCliContext } from './config.js';

export type WikiJsPageInfo = {
  id: number;
  path: string;
  title: string;
};

export type CreatePageInput = {
  path: string;
  locale: string;
  title: string;
  description: string;
  content: string;
  editor: 'markdown' | 'code';
  tags: string[];
};

export type WikiJsClientOptions = {
  graphqlUrl: string;
  apiKey: string;
  uploadFolderId?: number;
};

export class WikiJsClient {
  readonly graphqlUrl: string;
  readonly apiKey: string;
  readonly uploadUrl: string;
  readonly uploadFolderId: number;

  constructor(options: WikiJsClientOptions) {
    this.graphqlUrl = options.graphqlUrl;
    this.apiKey = options.apiKey;
    this.uploadFolderId = options.uploadFolderId ?? 0;
    this.uploadUrl = wikiUploadUrl(options.graphqlUrl);
  }

  private async graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new Error(`Wiki.js HTTP ${response.status}: ${raw.slice(0, 500)}`);
    }

    const data = JSON.parse(raw) as { data?: T; errors?: Array<{ message: string }> };
    if (data.errors?.length) {
      throw new Error(data.errors.map((error) => error.message).join('; '));
    }
    if (!data.data) {
      throw new Error(`Wiki.js GraphQL returned no data: ${raw.slice(0, 500)}`);
    }

    return data.data;
  }

  async listPages(): Promise<WikiJsPageInfo[]> {
    const data = await this.graphql<{ pages: { list: WikiJsPageInfo[] } }>(
      '{ pages { list { id path title } } }',
    );
    return data.pages.list;
  }

  async getPageContent(id: number): Promise<{ content: string; tags: string[] }> {
    const data = await this.graphql<{
      pages: { single: { content: string; tags: Array<{ tag: string }> } };
    }>(`{ pages { single(id: ${id}) { content tags { tag } } } }`);

    return {
      content: data.pages.single.content,
      tags: data.pages.single.tags.map((tag) => tag.tag),
    };
  }

  async getPageMeta(id: number): Promise<{ content: string; tags: string[]; description: string }> {
    const data = await this.graphql<{
      pages: { single: { content: string; description: string; tags: Array<{ tag: string }> } };
    }>(`{ pages { single(id: ${id}) { content description tags { tag } } } }`);

    return {
      content: data.pages.single.content,
      description: data.pages.single.description,
      tags: data.pages.single.tags.map((tag) => tag.tag),
    };
  }

  async getPageDescription(id: number): Promise<string> {
    const data = await this.graphql<{
      pages: { single: { description: string } };
    }>(`{ pages { single(id: ${id}) { description } } }`);
    return data.pages.single.description;
  }

  async updatePageDescription(id: number, description: string): Promise<void> {
    const { content, tags } = await this.getPageMeta(id);
    const data = await this.graphql<{
      pages: { update: { responseResult: { succeeded: boolean; message: string } } };
    }>(
      `mutation UpdatePageDescription($id: Int!, $description: String!, $content: String!, $tags: [String]!) {
        pages {
          update(id: $id, description: $description, content: $content, tags: $tags, isPublished: true) {
            responseResult { succeeded message }
          }
        }
      }`,
      { id, description, content, tags },
    );

    const result = data.pages.update.responseResult;
    if (!result.succeeded) {
      throw new Error(result.message ?? `Description update failed for page ${id}`);
    }
  }

  async findPageByPath(path: string, locale: string): Promise<number | null> {
    const data = await this.graphql<{
      pages: { singleByPath: { id: number } | null };
    }>(
      `query FindPage($path: String!, $locale: String!) {
        pages { singleByPath(path: $path, locale: $locale) { id } }
      }`,
      { path, locale },
    );

    return data.pages.singleByPath?.id ?? null;
  }

  async createPage(input: CreatePageInput): Promise<{ id: number; path: string }> {
    const data = await this.graphql<{
      pages: {
        create: {
          responseResult: { succeeded: boolean; message: string };
          page: { id: number; path: string };
        };
      };
    }>(
      `mutation CreatePage(
        $path: String!
        $locale: String!
        $title: String!
        $description: String!
        $content: String!
        $editor: String!
        $isPublished: Boolean!
        $isPrivate: Boolean!
        $tags: [String]!
      ) {
        pages {
          create(
            path: $path
            locale: $locale
            title: $title
            description: $description
            content: $content
            editor: $editor
            isPublished: $isPublished
            isPrivate: $isPrivate
            tags: $tags
          ) {
            responseResult { succeeded message }
            page { id path }
          }
        }
      }`,
      {
        path: input.path,
        locale: input.locale,
        title: input.title,
        description: input.description,
        content: input.content,
        editor: input.editor,
        isPublished: true,
        isPrivate: false,
        tags: input.tags,
      },
    );

    const result = data.pages.create.responseResult;
    if (!result.succeeded) {
      throw new Error(result.message ?? `Failed to create ${input.path}`);
    }

    return data.pages.create.page;
  }

  async deletePage(id: number): Promise<void> {
    const data = await this.graphql<{
      pages: { delete: { responseResult: { succeeded: boolean; message: string } } };
    }>(
      `mutation DeletePage($id: Int!) {
        pages { delete(id: $id) { responseResult { succeeded message } } }
      }`,
      { id },
    );

    const result = data.pages.delete.responseResult;
    if (!result.succeeded) {
      throw new Error(result.message ?? `Delete failed for page ${id}`);
    }
  }

  async updatePageContent(id: number, content: string, tags: string[]): Promise<void> {
    const data = await this.graphql<{
      pages: { update: { responseResult: { succeeded: boolean; message: string } } };
    }>(
      `mutation UpdatePage($id: Int!, $content: String!, $tags: [String]!) {
        pages {
          update(id: $id, content: $content, tags: $tags, isPublished: true) {
            responseResult { succeeded message }
          }
        }
      }`,
      { id, content, tags },
    );

    const result = data.pages.update.responseResult;
    if (!result.succeeded) {
      throw new Error(result.message ?? `Update failed for page ${id}`);
    }
  }

  async updateAndRender(id: number, content: string, tags: string[]): Promise<void> {
    await this.updatePageContent(id, content, tags);
    await this.renderPage(id);
  }

  async renderPage(id: number): Promise<void> {
    const data = await this.graphql<{
      pages: { render: { responseResult: { succeeded: boolean; message: string } } };
    }>(`mutation { pages { render(id: ${id}) { responseResult { succeeded message } } } }`);

    const result = data.pages.render.responseResult;
    if (!result.succeeded) {
      throw new Error(result.message ?? `Render failed for page ${id}`);
    }
  }

  async flushCache(): Promise<void> {
    const data = await this.graphql<{
      pages: { flushCache: { responseResult: { succeeded: boolean; message: string } } };
    }>('mutation { pages { flushCache { responseResult { succeeded message } } } }');

    const result = data.pages.flushCache.responseResult;
    if (!result.succeeded) {
      throw new Error(result.message ?? 'Cache flush failed');
    }
  }

  async uploadAsset(filename: string, bytes: Uint8Array, contentType: string): Promise<void> {
    const form = new FormData();
    form.append('mediaUpload', JSON.stringify({ folderId: this.uploadFolderId }));
    form.append('mediaUpload', new Blob([Buffer.from(bytes)], { type: contentType }), filename);

    const response = await fetch(this.uploadUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new Error(`Upload HTTP ${response.status} for ${filename}: ${raw.slice(0, 500)}`);
    }

    if (raw.trim() === 'ok') {
      return;
    }

    let payload: { succeeded?: boolean; message?: string };
    try {
      payload = JSON.parse(raw) as { succeeded?: boolean; message?: string };
    } catch {
      throw new Error(`Upload returned unexpected body for ${filename}: ${raw.slice(0, 500)}`);
    }

    if (!payload.succeeded) {
      throw new Error(payload.message ?? `Upload failed for ${filename}`);
    }
  }
}

export function wikiUploadUrl(graphqlUrl: string): string {
  const url = new URL(graphqlUrl);
  url.pathname = url.pathname.replace(/\/graphql\/?$/, '/u');
  if (!url.pathname.endsWith('/u')) {
    url.pathname = '/u';
  }
  return url.toString();
}

export function wikiBaseUrl(graphqlUrl: string): string {
  const url = new URL(graphqlUrl);
  url.pathname = url.pathname.replace(/\/graphql\/?$/, '/');
  return url.toString().replace(/\/$/, '');
}

export function parseCommonArgs(argv: string[]): {
  sourceApiUrl: string;
  dryRun: boolean;
  delayMs: number;
  wikiGraphqlUrl: string;
  wikiApiKey: string;
  uploadFolderId: number;
} {
  const context = parseCliContext(argv, { defaultSource: 'novasector13' });

  return {
    sourceApiUrl: context.source.apiUrl,
    dryRun: context.dryRun,
    delayMs: context.delayMs,
    wikiGraphqlUrl: context.wikiGraphqlUrl,
    wikiApiKey: context.wikiApiKey,
    uploadFolderId: context.uploadFolderId,
  };
}

export function guessContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}
