export type LoreSection = {
  id: string;
  title: string;
  content: string[];
};

export const LORE_INTRO =
  'Blastwave takes place aboard Gliese 667-C Orbital Research Platform 13, better known as Redline Station. Redline is a NanoTrasen orbital facility operating in the Gliese 667 C subsystem, located within the Scorpius Sector. After the disaster known as the Blastwave Incident, the region became more commonly known as the Blastwave Zone.';

export const LORE_SECTIONS: LoreSection[] = [
  {
    id: 'basics',
    title: 'The Basics',
    content: [
      'You are on Redline Station.',
      'Officially: Gliese 667-C Orbital Research Platform 13. Commonly: Redline Station.',
      'Redline is owned and operated by NanoTrasen. NT holds the corporate claim over the local system assets. The station serves as NT\'s primary foothold in the Blastwave Zone.',
    ],
  },
  {
    id: 'tulimaa',
    title: 'Tulimaa (Lavaland)',
    content: [
      'The station operates near Tulimaa, commonly called Lavaland.',
      'Tulimaa is a harsh volcanic world once considered mostly barren. It was useful to NT mainly for mining, research, and survey work.',
      'The Blastwave Incident changed everything. A nearby star underwent an unexplained supernova-class event. The resulting blast struck Tulimaa and tore open parts of its surface.',
      'Beneath the rock and ash were vast magma caverns, hostile ecosystems, unusual mineral formations, and signs of life that earlier surveys had missed.',
    ],
  },
  {
    id: 'moons',
    title: 'The Moons',
    content: [
      'Tulimaa has two major moons.',
      'Nivara is an ice moon. Hamara is a forested terrestrial moon with vast cave systems beneath its surface.',
      'Both moons were shielded from the worst of the initial blast by Tulimaa\'s shadow.',
    ],
  },
  {
    id: 'solfed',
    title: 'Sol Federation',
    content: [
      'Sol Federation oversight is present.',
      'The scale of the Blastwave Incident made the region more than a normal corporate holding. SolFed has stationed a cruiser nearby and assigned a federal delegate aboard Redline.',
    ],
  },
];
