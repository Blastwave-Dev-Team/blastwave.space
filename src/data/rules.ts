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
    title: 'You may be removed at any moment, for any length of time, for any reason',
    summary: [
      'You may be removed at any moment, for any length of time, for any reason, should community leadership decide it is for the welfare of the server.',
      'Leadership is expected to take full responsibility, have good reasoning, and be transparent with the reasoning for any bans used using Rule 0.',
    ],
    clarifications: [
      'If you are found to be using multiple ckeys, an admin may force you to choose one and permanently ban the rest. Using one ckey is necessary for administrative purposes, and using multiple ckeys without notifying an admin will be viewed with extreme suspicion.',
      'Regularly coming close to breaking the rules will be treated the same as actually breaking them. Repeated bad faith actions on the part of players will not be tolerated, even if they are technically within the bounds of the rules.',
    ],
  },
  {
    id: 'rule-1',
    number: 1,
    title: 'In-game administration rulings are final',
    summary: [
      'If you feel an administrative decision has been made in error or you disagree with it, in-game is not the place to dispute it. Do as you\'re asked. Raise the issue out-of-game through official channels if you wish to dispute a ruling.',
    ],
    clarifications: [
      'You are permitted to argue your case to an admin during an ahelp conversation, but once it has been closed, do not continue the conversation through any ingame means.',
    ],
  },
  {
    id: 'rule-2',
    number: 2,
    title: 'You must be 18+ to play',
    summary: [
      'Due to the nature of the game and possible relevance to international law, you must be over the age of 18 to play on the server.',
    ],
    clarifications: [
      'This is mostly a case of "don\'t ask, don\'t tell", but if the administration feels the need to verify your age, you must comply. You may do so anonymously, and are encouraged to do so if the situation arises. It likely won\'t happen unless you do something stupid like brag about being underage, however.',
    ],
  },
  {
    id: 'rule-3',
    number: 3,
    title: 'Expect bad things to happen',
    summary: [
      'Your round is not sacred. You may be inconvenienced, killed, or removed from the round for any number of circumstances outside of your control. Accepting this possibility is mandatory.',
    ],
    clarifications: [
      'The Opt-In setting is purely for the mechanical goal of an antagonist having you as a target. This does not make you immune from being targetted for other means, or from the events of the round in general.',
      'You may have your character\'s appearance and function altered without your consent. This includes but is not limited to mutilation, transformation, borging, "melonbowling", and so on.',
      'You may be subject to "mind control", hypnosis, and forceful conversion. You are expected to play along to this to the best of your ability. If you are forced into a shell that requires you follow laws — such as a silicon unit — you are expected to follow them to the best of your ability.',
    ],
  },
  {
    id: 'rule-4',
    number: 4,
    title: 'No metagaming',
    summary: [
      'Metagaming is defined as using out of character knowledge to act in character. This includes but is not limited to: Metacomms, ghost knowledge, and knowledge of previous rounds.',
    ],
    clarifications: [
      'This rule also includes "IC in OOC" and "OOC in IC". Do not discuss anything that could be pertinent to the ongoing round in OOC, as this can become a form of metagaming, and can spoil the round for others. Even if it\'s something you think everyone would be aware of, don\'t do it.',
      'You are allowed to have full knowledge of game mechanics and potential round types, and can use this knowledge to influence your in-character actions.',
      'Metacommunications (metacomms) is defined as communication of active participants in a round through outside means. Including, but not limited to voice chat, text, or in person. All communication between players participating in a round must be done within the game itself. Exceptions may be made for older players teaching newer players, but this must be discussed with administration beforehand.',
    ],
  },
  {
    id: 'rule-5',
    number: 5,
    title: 'No griefing',
    summary: [
      'Griefing is defined as the deliberate antagonizing of players in or out of character for no valid reason.',
    ],
    clarifications: [
      'This can also be seen as "don\'t be a dick" and "don\'t greytide for no reason". If you have to ask if what you\'re doing is considered griefy, err on the side of caution and don\'t do it, or ahelp beforehand.',
      'Spam (either IC or OOC) also fall under this rule. Repeatedly cluttering the screen with your messages will result in your ability to send messages be removed, at bare minimum.',
      'Although antagonists have very relaxed rules regarding what is considered griefing, there are still limits. Anything involving the Interlink, or the arrivals shuttle and its immediate surroundings is considered off-limits to antagonists and crewmembers alike.',
      'There is limited room for non-antagonists to cause trouble. Small crimes will be overlooked by admins. Having an antagonistic or troublesome personality is fine. Any natural conflict that evolves as a result of these factors is allowed and encouraged.',
    ],
  },
  {
    id: 'rule-6',
    number: 6,
    title: 'Do your job',
    summary: [
      'Minimum effort is required of all players to do the job they were assigned at round start. This goes especially true for Silicons, Heads of Staff, and Security.',
    ],
    clarifications: [
      'If you join the round as a Head of Staff or AI, you are expected to remain in the round for at least half an hour from when you joined the round.',
      'If you need to leave the round early for whatever reason as a round-critical role, notify admins via ahelp, secure job-critical items into your locker, and enter cryosleep.',
      'As people are expected to do their job, you are also expected to let people do so. If someone is manning a department, you must make a reasonable effort to solicit them for the service you require of them. If they are absent or unwilling to provide a necessary service or item, you are permitted to attempt to do it yourself, at the risk of IC consequences.',
      'This also means that validhunting is not permitted for anyone outside of Security without valid justification. An alert level at or over Red is sufficient justification on its own, other situations will require context.',
    ],
  },
  {
    id: 'rule-7',
    number: 7,
    title: 'No powergaming',
    summary: [
      'Powergaming is defined as obtaining unnecessary power unrelated to your job. Key word here being unnecessary.',
    ],
    clarifications: [
      'The rule of thumb to follow here is: If an admin asks you "why do you have [x]?" you need to have a valid reason or purpose for it. "Just in case" will not be treated as a valid reason.',
      'A necessary situation to be aquiring power is if there is a credible and direct threat to your life. Being on blue alert is not enough. Being on red alert is. Having a known crisis on the station is. Having someone threaten your life directly can be treated as such.',
      'If items or other abilities (augments, viruses, mutations) are normally and realistically obtainable within your job, it is not powergaming to obtain them. Likewise, it is not powergaming to ask for and be willingly given items and/or abilities from someone working said department. It will be treated as powergaming if you attain them illicitly without an attempt to do so properly.',
    ],
  },
  {
    id: 'rule-8',
    number: 8,
    title: 'No self-antagging',
    summary: [
      'Self-antagging is defined as acting purely antagonistic to the crew for no discernable reason as a non-antag.',
    ],
    clarifications: [
      'This includes attempting to bait someone into a conflict with the intent of gaining a valid reason to kill them.',
      'Silicons with no laws preventing murder are still expected to act in good faith. Being purged is not an excuse to start plasmaflooding the station.',
    ],
  },
  {
    id: 'rule-9',
    number: 9,
    title: 'As an antagonist, fulfil your objectives',
    summary: [
      'You are expected to play towards your objectives as a solo antagonist. You are expected to also not harm or endanger your team as a team antagonist. Failing your objectives is okay, but actively making it more difficult for yourself to complete your objectives is not.',
    ],
    clarifications: [
      'Murderboning is seen as intentionally working against your objectives as a solo antagonist, as it heavily reduces your chances at success. That, and it\'s just a dick move. Don\'t do it. Don\'t out yourself intentionally to force yourself to do it either.',
      'Acts of mass destruction are permitted as an antagonist so long as they don\'t make it more difficult for you to achieve your goals. For example, creating a loose singularity when you still have a steal objective to fulfil would be seen as acting against your goals, as the item could be destroyed by the singularity.',
    ],
  },
  {
    id: 'rule-10',
    number: 10,
    title: 'Stay in character',
    summary: [
      'Your character is (usually) a living, breathing character within a setting different from our own. You\'re expected to act within these bounds at all times.',
    ],
    clarifications: [
      'Naming your character falls under this rule. "Firstname Lastname" is acceptable convention for all races, although some races may have alternate acceptable formats. Naming your character in excessively OOC terminology or referencing preexisting characters or people is not permitted. Mimes, clowns, and silicons have a more relaxed naming policy, but you will still be warned if you overstep the bounds of what is considered acceptable.',
      'Do not use OOC terms in IC. Avoid using terms like "round" and netspeak like "lol uwu :)" in general.',
      'As a silicon, you are expected to follow your laws to the letter, from top to bottom. Higher laws have higher priority and overrule any lower laws if they conflict with the higher one. If a law is ambiguous, choose a single interpretation and stick to it for the entire round.',
      'Once you\'re a ghost, you\'re allowed to break character and use OOC terminology however you wish, as well as discuss the current round. (re: rule 4) This freedom only exists while you are a ghost, and ends immediately upon you re-entering the round by any means.',
      'You are permitted to freely break character and act however you wish only once the round end report appears. This includes grief, murder, and mass destruction.',
    ],
  },
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
