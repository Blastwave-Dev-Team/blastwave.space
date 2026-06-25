export function wikiBaseUrl(graphqlUrl: string): string {
  const url = new URL(graphqlUrl);
  url.pathname = url.pathname.replace(/\/graphql\/?$/, '/');
  return url.toString().replace(/\/$/, '');
}

export function wikiAssetUrl(graphqlUrl: string, filename: string): string {
  return `${wikiBaseUrl(graphqlUrl)}/${encodeURIComponent(filename)}`;
}
