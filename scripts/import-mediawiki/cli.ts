type CommandRunner = (argv: string[]) => Promise<void>;

type CommandRoute = {
  modulePath: string;
  argv: string[];
};

const HELP = `
Blastwave Wiki import tool

Usage:
  tsx cli.ts <command> [subcommand] [options]

Commands:
  import markdown [--source=<preset|url>] [--dry-run]
  import html [--source=<preset|url>] [--only=<path>] [--dry-run]
  import local [--dry-run]

  images scrape [--source=<preset|url>] [--dry-run] [--delay-ms=N] [--folder-id=N]
  images unresolved [--source=<preset|url>] [--analyze]

  reimport [--source=<preset|url>] [--dry-run] [--delay-ms=N] [--folder-id=N]
  fix links [--dry-run]
  fix descriptions [--dry-run]
  fix anchors [--source=<preset|url>] [--only=<path>] [--dry-run]

  deploy theme
  tag add <page-path> <tag> [tag...]

Options:
  --source=<preset|url>   MediaWiki source preset (tgstation13, novasector13) or API URL
  --source-api=<url>      Alias for --source when passing a URL directly
  --only=<path>           Limit to a single wiki page path
  --dry-run               Preview changes without writing
  --delay-ms=<n>          Delay between MediaWiki API requests (default: 100)
  --folder-id=<n>         Wiki.js asset upload folder ID

Environment:
  WIKIJS_API_KEY          Required for Wiki.js mutations (unless --dry-run)
  WIKIJS_GRAPHQL_URL      Required for Wiki.js mutations (unless --dry-run)
  WIKIJS_LOCALE           Wiki.js locale (default: en)
  WIKIJS_TOC_POSITION     Override TOC position for deploy theme
`.trim();

function resolveRoute(argv: string[]): CommandRoute {
  const [first, second, ...rest] = argv;

  if (!first || first === '--help' || first === '-h') {
    console.log(HELP);
    process.exit(first ? 0 : 1);
  }

  if (first === 'import') {
    switch (second) {
      case 'markdown':
        return { modulePath: './commands/import-markdown.js', argv: rest };
      case 'html':
        return { modulePath: './commands/import-html.js', argv: rest };
      case 'local':
        return { modulePath: './commands/import-local.js', argv: rest };
      default:
        throw new Error(`Unknown import subcommand "${second ?? ''}". Expected markdown, html, or local.`);
    }
  }

  if (first === 'images') {
    switch (second) {
      case 'scrape':
        return { modulePath: './commands/scrape-images.js', argv: rest };
      case 'unresolved':
        return { modulePath: './commands/images-unresolved.js', argv: rest };
      default:
        throw new Error(`Unknown images subcommand "${second ?? ''}". Expected scrape or unresolved.`);
    }
  }

  if (first === 'fix') {
    switch (second) {
      case 'links':
        return { modulePath: './commands/fix-links.js', argv: rest };
      case 'descriptions':
        return { modulePath: './commands/update-descriptions.js', argv: rest };
      case 'anchors':
        return { modulePath: './commands/fix-wiki-anchors.js', argv: rest };
      default:
        throw new Error(`Unknown fix subcommand "${second ?? ''}". Expected links, descriptions, or anchors.`);
    }
  }

  if (first === 'reimport') {
    return { modulePath: './commands/reimport.js', argv: [second, ...rest].filter(Boolean) };
  }

  if (first === 'deploy' && second === 'theme') {
    return { modulePath: './commands/deploy-theme.js', argv: rest };
  }

  if (first === 'tag' && second === 'add') {
    return { modulePath: './commands/tag-add.js', argv: rest };
  }

  throw new Error(`Unknown command "${first}${second ? ` ${second}` : ''}". Run with --help for usage.`);
}

async function main(): Promise<void> {
  const route = resolveRoute(process.argv.slice(2));
  const module = (await import(route.modulePath)) as { run: CommandRunner };
  await module.run(route.argv);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
