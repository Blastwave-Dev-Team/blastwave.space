export type WikiPage = {
  title: string;
  render: string;
  updatedAt: string;
};

export type WikiClientConfig = {
  graphqlUrl: string;
  apiKey: string;
  locale: string;
};

const PAGE_QUERY = `
  query PageByPath($path: String!, $locale: String!) {
    pages {
      singleByPath(path: $path, locale: $locale) {
        title
        render
        updatedAt
      }
    }
  }
`;

type GraphqlResponse = {
  data?: {
    pages?: {
      singleByPath?: WikiPage | null;
    };
  };
  errors?: Array<{ message: string }>;
};

export class WikiClient {
  constructor(private readonly config: WikiClientConfig) {}

  async fetchPage(path: string): Promise<WikiPage | null> {
    const response = await fetch(this.config.graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        query: PAGE_QUERY,
        variables: { path, locale: this.config.locale },
      }),
    });

    if (!response.ok) {
      throw new Error(`Wiki.js GraphQL HTTP ${response.status}`);
    }

    const payload = (await response.json()) as GraphqlResponse;

    if (payload.errors?.length) {
      throw new Error(payload.errors.map((e) => e.message).join('; '));
    }

    return payload.data?.pages?.singleByPath ?? null;
  }
}
