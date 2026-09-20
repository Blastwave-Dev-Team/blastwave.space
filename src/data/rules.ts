export type RuleEntry = {
  id: string;
  number: number;
  title: string;
  summary: string[];
  clarifications?: string[];
};

export type StaffRole = {
  title: string;
  description: string;
  level: number;
};

export const RULES: RuleEntry[] = [
  {
    id: 'rule-0',
    number: 0,
    title: 'Admins have final say',
    summary: [
      'An admin can make any decision on a case that they feel benefits the server, whether that\'s to punish something not in the scope of the rules or to let something go that is.',
      'Once an ahelp is closed, please do not reopen it in-game for the same issue. You can appeal anything that seemed unfair outside of the round with a ticket in the Discord.',
    ],
  },
  {
    id: 'rule-1',
    number: 1,
    title: 'Multikeying',
    summary: [
      'This server prefers that you stick to one ckey per player. If we find you using multiple, we may have you pick the one you wish to keep using and ban the rest.',
    ],
  },
  {
    id: 'rule-2',
    number: 2,
    title: '18+',
    summary: [
      'This server requires you to be over the age of 18 to play.',
      'If the administration has reason to believe you are breaking this rule, we may ask to verify.',
    ],
  },
  {
    id: 'rule-3',
    number: 3,
    title: 'It\'s Okay To "Lose"',
    summary: [
      'This is, despite its roleplay element, a game. There are times when your character will be interrupted, harmed, killed, modified, or removed from the round. Reversing these circumstances via admin intervention would be an extremely rare exception, and should not be expected.',
    ],
  },
  {
    id: 'rule-4',
    number: 4,
    title: 'Metagaming',
    summary: [
      'You do not need to pretend not to know game mechanics in order to stay in character. Your character can be assumed to know what the antags are, what other jobs are, what each round type is, etc.',
      'However, any knowledge about events in-round that was not gained in-character (aka talking with other players out of game, witnessing an event while dead) cannot be acted on or shared.',
      'Additionally, knowledge of events from previous rounds also cannot be acted on. While anecdotes that multiple characters are privy to might help roleplay, don\'t act like you owe another player a gift or an ass-whooping.',
    ],
  },
  {
    id: 'rule-5',
    number: 5,
    title: 'Self-antagging, Griefing',
    summary: [
      'Self-antagging: Do not sabotage the station, kill the crew, or bait other players into giving you justification for such acts while not mechanically an antagonist.',
      'Griefing: In short, don\'t be a dick. Antagonizing other players for no good reason or generally making the game too annoying is frowned upon.',
      'Antags get a pass if it helps their objectives, but Arrivals and the Interlink are off-limits.',
      'This doesn\'t stop you from roleplaying an abrasive character or getting in social fights.',
    ],
  },
  {
    id: 'rule-6',
    number: 6,
    title: 'Stay In Character',
    summary: [
      'Your character is a unique existence separate from yourself who exists in a different reality. Act within this framework.',
      'Names should either be reasonable for a real, median human, or follow naming conventions provided to a race. Clowns/Mimes/Silicons can be sillier, but nobody should reference pre-existing characters or people.',
      'Don\'t reference OOC terms in IC ("round/antag/greentext", leetspeak, etc)',
      'Additionally, ERP is not allowed. We\'re not here for that. Full stop.',
      'Ghosts can relax this rule for as long as they\'re ghosts, and talk about the current round\'s events with anyone. They cannot take information gained while they were ghosts back into the round when they enter it again.',
      'Once the round ends, IC/OOC rules are free to be ignored.',
      'As in Rule 3, your character\'s personality or motivations are liable to be modified by outside forces without your consent, such as forceborging or "mind control" from various antag types. So long as such applied directives are in-character from the perpetrator\'s standpoint, do your best to follow them. For forceborging in particular, you are subject to SILICON RULES listed at the bottom.',
    ],
  },
  {
    id: 'rule-7',
    number: 7,
    title: 'Do Your Job',
    summary: [
      'The game part of this game demands that you spare at least a small amount of time towards actually doing the job assigned to you.',
      'Station-critical roles such as command and AI are expected to ahelp and secure sensitive items if they intend to leave before one hour of station time.',
      'If a department is staffed, expect them to be doing their job too. Solicit their help before considering breaking in for a service their role would render, and assume there will be IC consequences if you try to handle it yourself anyway.',
      'The impulse to do what you\'ve signed on to a stellar voyage for can be considered a core part of your character. There are even job codes for people outright being lazy and shirking as a habit (unassigned Assistant, \'tourist\', etc). Taking up a slot with specific access without performing its functions is looked at unfavorably RP-wise (rule 6)',
    ],
  },
  {
    id: 'rule-8',
    number: 8,
    title: 'Powergaming',
    summary: [
      'Don\'t go out of your way to obtain unnecessary extra power outside of your job without an IC reason. Anything within your job that you have valid access to is fair game, and other departments can always willingly give you things, but obtaining them illicitly is what would break this rule.',
      'Blue alert alone is not an IC reason for getting more power, but knowing there is a credible threat or previous attempt on your life specifically is. Red alert, or a station crisis that would justify it, is similarly a valid reason.',
    ],
  },
  {
    id: 'rule-9',
    number: 9,
    title: 'Do Your Objectives',
    summary: [
      'Solo antagonists are expected to play towards their objectives. Team antagonists are expected not to harm their team, additionally. While it\'s still Okay To Lose, you should not intentionally make it impossible for yourself to "win."',
      'Murderboning (acts of mass murder with no or forced/very poor escalation) goes against a solo antagonist\'s objectives.',
      'On the other hand, extreme acts of sabotage to the station, even if they kill or round remove a lot of people, are allowed as long as they don\'t logically work against your objectives.',
      'If it\'s roundstart and you absolutely don\'t want to antag (or something just came up), ahelp before you spend your antag role\'s resources. If you have to leave before you\'ve done anything illicit but you have bought things, gather up any role item you can carry and ahelp before you cryosleep. This isn\'t a "station critical" role, but since conflict is what drives stories, missing our source of conflict is something we\'d also like to avoid.',
    ],
  },
];

export const SILICON_RULES: string[] = [
  'A silicon\'s lawset is an existential contract and must be followed to the letter. Laws higher up on the list have a higher authority and override lower laws if a conflict arises. If your laws are too ambiguous, interpret them in one way and stay consistent with that. (Rule 6)',
  'Furthermore, your laws can possibly be changed in any way a player with the right amount of access to your upload deems fit, at any point in the round. You have to deal with these changes as they happen in-character. The only exception to this is if someone\'s breaking Rule 5 to make you round-remove yourself or otherwise be absolutely useless. (Rule 3)',
  'An absence of laws restricting murder is not an excuse to murderbone. If your laws do not COMPEL you to harm other beings, act like a normal crewman would (Rule 5)',
  'If you are compelled by laws to act in a way that can only break Rule 5 or can only help another player break Rule 8 and you follow them consistently, the player who set your laws to that state is fully responsible. (We might ask you to walk us through your interpretation.)',
];

export const STAFF_ROLES: StaffRole[] = [
  {
    level: 0,
    title: 'Host',
    description:
      'Pays the bills, manages server finances. Has final say over any policy or code direction. Also has the responsibilities of a systems manager by default.',
  },
  {
    level: 1,
    title: 'Head Admin',
    description:
      'Decides on server policy and design direction. Responsible for delegating any necessary roles — aka assigning and recruiting staff. Has final say on anything not code related. Has veto power on code changes, but not approval power.',
  },
  {
    level: 2,
    title: 'Administrators',
    description:
      'Inherits all responsibilities of the three "Moderator" roles. Expected to take a more active role in server administration and threat management; so at least one should generally be ghosted out to keep an eye on the round. Has no say in code direction/decisions.',
  },
  {
    level: 3,
    title: 'Trial Admin',
    description:
      'Staff that have been approved in an application or headhunted by a head admin but not yet deemed ready to act independently.',
  },
];
