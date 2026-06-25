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
