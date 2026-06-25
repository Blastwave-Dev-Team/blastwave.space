/** Pages imported as raw HTML (table-heavy guides). */
export const HTML_IMPORT_PAGES: Record<string, string> = {
  Guide_to_chemistry: 'guide-to-chemistry',
  Guide_to_medicine: 'guide-to-medicine',
  Surgery: 'surgery',
  Guide_to_food: 'guide-to-food',
  Guide_to_drinks: 'guide-to-drinks',
  Tactical_Game_Cards: 'tactical-game-cards',
};

export const HTML_IMPORT_PATHS = new Set(Object.values(HTML_IMPORT_PAGES));

/** In-game textbook page_link values mapped to preferred Wiki.js paths. */
export const TEXTBOOK_PAGES: Record<string, string> = {
  Guide_to_chemistry: 'guide-to-chemistry',
  Guide_to_construction: 'guide-to-construction',
  Guide_to_engineering: 'guide-to-engineering',
  Space_Law: 'space-law',
  Corporate_Regulations: 'corporate-regulations',
  Infections: 'infections',
  Guide_to_telescience: 'guide-to-telescience',
  Hacking: 'hacking',
  Detective: 'detective',
  Guide_to_drinks: 'guide-to-drinks',
  Guide_to_robotics: 'guide-to-robotics',
  Guide_to_Research_and_Development: 'guide-to-research-and-development',
  Experimentor: 'experimentor',
  Guide_to_food: 'guide-to-food',
  Guide_to_Telecommunications: 'guide-to-telecommunications',
  Guide_to_Atmospherics: 'guide-to-atmospherics',
  Guide_to_medicine: 'guide-to-medicine',
  Surgery: 'surgery',
  Grenade: 'grenade',
  Guide_to_toxins: 'guide-to-toxins',
  Guide_to_plumbing: 'guide-to-plumbing',
  Guide_to_cytology: 'guide-to-cytology',
  Tactical_Game_Cards: 'tactical-game-cards',
  Guide_to_Mediguns: 'guide-to-mediguns',
};

/** Wiki.js page descriptions (shown in page meta / listings). */
export const PAGE_DESCRIPTIONS: Record<string, string> = {
  'guide-to-chemistry':
    'Chemical recipes, reagents, reaction mechanics, and chemist machinery.',
  'guide-to-construction':
    'Building and deconstructing station structures, materials, and tools.',
  'guide-to-engineering':
    'Station engineering systems, power, maintenance, and departmental equipment.',
  'space-law': 'Space Law, crime categories, and sentencing guidelines for security.',
  'corporate-regulations':
    'Nanotrasen corporate regulations for station law, order, and procedure.',
  infections: 'Virology, diseases, symptoms, and infection treatment.',
  'guide-to-telescience': 'Bluespace teleportation science and telescience equipment.',
  hacking: 'Hacking airlocks, doors, APCs, and other secure systems.',
  detective: 'Detective investigation procedures, forensics, and evidence handling.',
  'guide-to-drinks': 'Bartender recipes, drink mixing, and bar equipment.',
  'guide-to-robotics': 'Robotics, cyborgs, mechs, and exosuit construction.',
  'guide-to-research-and-development':
    'Research and development, tech trees, and departmental fabrication.',
  experimentor: 'Using the experimentor for R&D discovery and material research.',
  'guide-to-food': 'Cooking recipes, ingredients, and kitchen equipment.',
  'guide-to-telecommunications':
    'Subspace telecommunications, networks, and signal routing.',
  'guide-to-atmospherics':
    'Atmospheric systems, gases, pipe networks, and air management.',
  'guide-to-medicine':
    'Medical treatment, chemicals, damage types, and patient care.',
  surgery: 'Surgical procedures, organs, implants, and operating tools.',
  grenade: 'Chemical grenade construction, payloads, and deployment.',
  'guide-to-toxins': 'Ordnance, explosives, toxins, and bomb assembly.',
  'guide-to-plumbing': 'Chemical plumbing, factories, and automated reagent processing.',
  'guide-to-cytology': 'Xenobiology, slimes, cytology, and organic research.',
  'tactical-game-cards': 'Tactical Game Cards rules, decks, and card reference.',
  'guide-to-mediguns': 'Cellgun and medigun systems, cells, and medical weaponry.',
};

export function pageDescriptionForPath(path: string): string {
  return PAGE_DESCRIPTIONS[path] ?? `Station reference: ${path.replace(/-/g, ' ')}.`;
}

export function pageDescriptionForMediaWikiTitle(title: string): string {
  return pageDescriptionForPath(mediaWikiTitleToPath(title));
}

export type MediaWikiSource = {
  name: string;
  apiUrl: string;
};

export const DEFAULT_SOURCES: MediaWikiSource[] = [
  { name: 'tgstation13', apiUrl: 'https://wiki.tgstation13.org/api.php' },
  { name: 'novasector13', apiUrl: 'https://wiki.novasector13.com/api.php' },
];

export function mediaWikiTitleToPath(title: string): string {
  return title
    .replace(/ /g, '-')
    .replace(/_/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}
