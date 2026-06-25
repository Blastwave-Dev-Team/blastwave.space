import { parseCliContext } from '../config.js';
import {
  WikiJsClient,
  type PageRuleInput,
  type UpdateGroupInput,
} from '../wikijs-client.js';

const PLAYER_GROUP_NAME = 'Player';

const PLAYER_GLOBAL_PERMISSIONS = [
  'read:pages',
  'read:assets',
  'write:pages',
  'write:assets',
] as const;

const PLAYER_PAGE_RULES: PageRuleInput[] = [
  {
    id: 'read-all',
    deny: false,
    match: 'START',
    path: '',
    roles: ['read:pages', 'read:assets'],
    locales: [],
  },
  {
    id: 'write-ugc',
    deny: false,
    match: 'START',
    path: 'ugc',
    roles: ['write:pages', 'write:assets'],
    locales: [],
  },
];

const UGC_LANDING_PATH = 'ugc';
const UGC_LANDING_TITLE = 'User Generated Content';
const UGC_LANDING_DESCRIPTION = 'Community-created guides and notes.';
const UGC_LANDING_CONTENT = `# User Generated Content

Pages in this section are created and maintained by players.

Create a new page under \`ugc/your-page-name\` to share guides, notes, or other community content.
`;

function buildPlayerGroupUpdate(groupId: number): UpdateGroupInput {
  return {
    id: groupId,
    name: PLAYER_GROUP_NAME,
    redirectOnLogin: '/ugc',
    permissions: [...PLAYER_GLOBAL_PERMISSIONS],
    pageRules: PLAYER_PAGE_RULES,
  };
}

export async function run(argv: string[]): Promise<void> {
  const context = parseCliContext(argv, { requireSource: false, requireWikiKey: !argv.includes('--dry-run') });
  const client = new WikiJsClient({
    graphqlUrl: context.wikiGraphqlUrl,
    apiKey: context.wikiApiKey,
  });

  const updateInput = buildPlayerGroupUpdate(0);

  if (context.dryRun) {
    console.log('[dry-run] Would ensure Player group with:');
    console.log(`  global permissions: ${updateInput.permissions.join(', ')}`);
    console.log(`  redirectOnLogin: ${updateInput.redirectOnLogin}`);
    console.log(`  page rules: ${updateInput.pageRules.length}`);
    for (const rule of updateInput.pageRules) {
      console.log(
        `    - ${rule.deny ? 'DENY' : 'ALLOW'} ${rule.roles.join(', ')} (START "${rule.path}")`,
      );
    }
    console.log(`[dry-run] Would ensure landing page "${UGC_LANDING_PATH}" exists`);
    return;
  }

  let group = await client.findGroupByName(PLAYER_GROUP_NAME);
  if (!group) {
    group = await client.createGroup(PLAYER_GROUP_NAME);
    console.log(`Created group "${PLAYER_GROUP_NAME}" (id=${group.id})`);
  } else {
    console.log(`Found existing group "${PLAYER_GROUP_NAME}" (id=${group.id})`);
  }

  await client.updateGroup(buildPlayerGroupUpdate(group.id));
  console.log(`Updated group permissions and ${PLAYER_PAGE_RULES.length} page rules`);

  const existingLanding = await client.findPageByPath(UGC_LANDING_PATH, context.locale);
  if (existingLanding === null) {
    const page = await client.createPage({
      path: UGC_LANDING_PATH,
      locale: context.locale,
      title: UGC_LANDING_TITLE,
      description: UGC_LANDING_DESCRIPTION,
      content: UGC_LANDING_CONTENT,
      editor: 'markdown',
      tags: ['ugc'],
    });
    console.log(`Created landing page "${page.path}" (id=${page.id})`);
  } else {
    console.log(`Landing page "${UGC_LANDING_PATH}" already exists (id=${existingLanding})`);
  }

  console.log('Player UGC permissions setup complete.');
  console.log('Assign users to the Player group in Administration → Groups → Player.');
}
