/**
 * Curated meta deck database.
 * win_rate: approximate tournament win rate (%)
 * tier: S / A / B / C
 * format: 'standard' | 'expanded'
 * archetype: aggro | control | combo | midrange | stall
 * energy_types: array of type strings
 * cards: [{ name, qty, set_code, number }]
 *   set_code + number used to match against collection
 *   name used as display + fallback match
 */

export const META_DECKS = [

  // ─── STANDARD ────────────────────────────────────────────────────────────

  {
    id: 'charizard-ex',
    name: 'Charizard ex',
    format: 'standard',
    tier: 'S',
    win_rate: 62,
    archetype: 'midrange',
    energy_types: ['fire'],
    description: 'The most dominant deck in Standard. Pidgeot ex searches any card every turn while Charizard ex hits for massive damage with Burning Darkness.',
    cards: [
      { name: 'Charmander',       qty: 4, set_code: 'OBF', number: '26'  },
      { name: 'Charmeleon',       qty: 2, set_code: 'OBF', number: '27'  },
      { name: 'Charizard ex',     qty: 3, set_code: 'OBF', number: '228' },
      { name: 'Pidgey',           qty: 2, set_code: 'OBF', number: '162' },
      { name: 'Pidgeot ex',       qty: 2, set_code: 'OBF', number: '164' },
      { name: 'Rotom V',          qty: 1, set_code: 'LOR', number: '58'  },
      { name: 'Mew ex',           qty: 1, set_code: 'MEW', number: '151' },
      { name: 'Radiant Charizard',qty: 1, set_code: 'CRZ', number: '20'  },
      { name: 'Arven',            qty: 4, set_code: 'SVI', number: '166' },
      { name: "Professor's Research", qty: 2, set_code: 'SVI', number: '189' },
      { name: 'Iono',             qty: 3, set_code: 'PAL', number: '185' },
      { name: "Boss's Orders",    qty: 2, set_code: 'PAL', number: '172' },
      { name: 'Rare Candy',       qty: 4, set_code: 'SVI', number: '191' },
      { name: 'Ultra Ball',       qty: 4, set_code: 'SVI', number: '196' },
      { name: 'Nest Ball',        qty: 3, set_code: 'SVI', number: '181' },
      { name: 'Pokégear 3.0',     qty: 3, set_code: 'SVI', number: '186' },
      { name: 'Counter Catcher',  qty: 2, set_code: 'PAR', number: '160' },
      { name: 'Forest Seal Stone',qty: 1, set_code: 'SIT', number: '156' },
      { name: 'Lost Vacuum',      qty: 1, set_code: 'LOR', number: '162' },
      { name: 'Defiance Band',    qty: 3, set_code: 'SVI', number: '169' },
      { name: 'Mesagoza',         qty: 3, set_code: 'SVI', number: '178' },
      { name: 'Magma Basin',      qty: 2, set_code: 'BRS', number: '144' },
      { name: 'Fire Energy',      qty: 6, set_code: 'SVE', number: '2'   },
    ],
  },

  {
    id: 'gardevoir-ex',
    name: 'Gardevoir ex',
    format: 'standard',
    tier: 'S',
    win_rate: 60,
    archetype: 'midrange',
    energy_types: ['psychic'],
    description: 'Psychic Embrace attaches psychic energy from discard each turn, fueling Gardevoir ex\'s Psychic Embrace for enormous damage. Consistent and versatile.',
    cards: [
      { name: 'Ralts',              qty: 4, set_code: 'SIT', number: '67'  },
      { name: 'Kirlia',             qty: 3, set_code: 'SIT', number: '68'  },
      { name: 'Gardevoir ex',       qty: 3, set_code: 'SVI', number: '86'  },
      { name: 'Drifloon',           qty: 2, set_code: 'SIT', number: '94'  },
      { name: 'Zacian V',           qty: 1, set_code: 'BST', number: '138' },
      { name: 'Mew ex',             qty: 1, set_code: 'MEW', number: '151' },
      { name: 'Munkidori',          qty: 2, set_code: 'TWM', number: '94'  },
      { name: 'Arven',              qty: 3, set_code: 'SVI', number: '166' },
      { name: 'Iono',               qty: 4, set_code: 'PAL', number: '185' },
      { name: "Professor's Research", qty: 2, set_code: 'SVI', number: '189' },
      { name: "Boss's Orders",      qty: 2, set_code: 'PAL', number: '172' },
      { name: 'Rare Candy',         qty: 4, set_code: 'SVI', number: '191' },
      { name: 'Ultra Ball',         qty: 4, set_code: 'SVI', number: '196' },
      { name: 'Buddy-Buddy Poffin', qty: 4, set_code: 'TWM', number: '144' },
      { name: 'Technical Machine: Crisis Punch', qty: 1, set_code: 'PAR', number: '177' },
      { name: 'Lost Vacuum',        qty: 2, set_code: 'LOR', number: '162' },
      { name: 'Fog Crystal',        qty: 2, set_code: 'CRE', number: '140' },
      { name: 'Collapsed Stadium',  qty: 2, set_code: 'BRS', number: '137' },
      { name: 'Psychic Energy',     qty: 9, set_code: 'SVE', number: '5'   },
    ],
  },

  {
    id: 'dragapult-ex',
    name: 'Dragapult ex',
    format: 'standard',
    tier: 'S',
    win_rate: 59,
    archetype: 'aggro',
    energy_types: ['psychic', 'dragon'],
    description: 'Phantom Dive spreads 50 damage to benched Pokémon, enabling snipe KOs. Pidgeot ex provides consistency. One of the most oppressive spread decks in Standard.',
    cards: [
      { name: 'Dreepy',             qty: 4, set_code: 'PAR', number: '92'  },
      { name: 'Drakloak',           qty: 2, set_code: 'PAR', number: '93'  },
      { name: 'Dragapult ex',       qty: 3, set_code: 'TWM', number: '130' },
      { name: 'Pidgey',             qty: 2, set_code: 'OBF', number: '162' },
      { name: 'Pidgeot ex',         qty: 2, set_code: 'OBF', number: '164' },
      { name: 'Squawkabilly ex',    qty: 2, set_code: 'PAL', number: '169' },
      { name: 'Iono',               qty: 4, set_code: 'PAL', number: '185' },
      { name: "Professor's Research", qty: 2, set_code: 'SVI', number: '189' },
      { name: "Boss's Orders",      qty: 2, set_code: 'PAL', number: '172' },
      { name: 'Arven',              qty: 3, set_code: 'SVI', number: '166' },
      { name: 'Rare Candy',         qty: 4, set_code: 'SVI', number: '191' },
      { name: 'Ultra Ball',         qty: 4, set_code: 'SVI', number: '196' },
      { name: 'Buddy-Buddy Poffin', qty: 2, set_code: 'TWM', number: '144' },
      { name: 'Counter Catcher',    qty: 2, set_code: 'PAR', number: '160' },
      { name: 'Collapsed Stadium',  qty: 3, set_code: 'BRS', number: '137' },
      { name: 'Defiance Band',      qty: 2, set_code: 'SVI', number: '169' },
      { name: 'Psychic Energy',     qty: 7, set_code: 'SVE', number: '5'   },
    ],
  },

  {
    id: 'raging-bolt-ex',
    name: 'Raging Bolt ex',
    format: 'standard',
    tier: 'A',
    win_rate: 56,
    archetype: 'aggro',
    energy_types: ['lightning', 'fire'],
    description: 'Ogerpon ex accelerates energy from deck while Raging Bolt ex dishes out massive damage quickly. Fast and explosive.',
    cards: [
      { name: 'Raging Bolt ex',           qty: 4, set_code: 'TEF', number: '123' },
      { name: 'Teal Mask Ogerpon ex',     qty: 4, set_code: 'TWM', number: '25'  },
      { name: 'Bloodmoon Ursaluna ex',    qty: 2, set_code: 'TWM', number: '141' },
      { name: 'Squawkabilly ex',          qty: 2, set_code: 'PAL', number: '169' },
      { name: 'Iono',                     qty: 4, set_code: 'PAL', number: '185' },
      { name: "Professor's Research",     qty: 3, set_code: 'SVI', number: '189' },
      { name: "Boss's Orders",            qty: 2, set_code: 'PAL', number: '172' },
      { name: 'Kieran',                   qty: 2, set_code: 'TWM', number: '154' },
      { name: 'Ultra Ball',               qty: 4, set_code: 'SVI', number: '196' },
      { name: 'Energy Switch',            qty: 4, set_code: 'SVI', number: '173' },
      { name: 'Counter Catcher',          qty: 2, set_code: 'PAR', number: '160' },
      { name: 'Defiance Band',            qty: 3, set_code: 'SVI', number: '169' },
      { name: 'Collapsed Stadium',        qty: 2, set_code: 'BRS', number: '137' },
      { name: 'Lightning Energy',         qty: 7, set_code: 'SVE', number: '4'   },
      { name: 'Fire Energy',              qty: 4, set_code: 'SVE', number: '2'   },
    ],
  },

  {
    id: 'regidrago-vstar',
    name: 'Regidrago VSTAR',
    format: 'standard',
    tier: 'A',
    win_rate: 54,
    archetype: 'combo',
    energy_types: ['dragon', 'grass', 'fire'],
    description: 'Legacy Star copies the attacks of Dragon types in your discard pile. Uses Giratina VSTAR, Roaring Moon, and other dragons for massive combo potential.',
    cards: [
      { name: 'Regidrago V',       qty: 3, set_code: 'SIT', number: '135' },
      { name: 'Regidrago VSTAR',   qty: 2, set_code: 'SIT', number: '136' },
      { name: 'Giratina V',        qty: 2, set_code: 'LOR', number: '130' },
      { name: 'Giratina VSTAR',    qty: 2, set_code: 'LOR', number: '131' },
      { name: 'Roaring Moon ex',   qty: 2, set_code: 'PAR', number: '124' },
      { name: 'Dondozo',           qty: 2, set_code: 'PAL', number: '50'  },
      { name: 'Squawkabilly ex',   qty: 2, set_code: 'PAL', number: '169' },
      { name: 'Radiant Greninja',  qty: 1, set_code: 'ASR', number: '46'  },
      { name: 'Iono',              qty: 4, set_code: 'PAL', number: '185' },
      { name: "Professor's Research", qty: 3, set_code: 'SVI', number: '189' },
      { name: "Boss's Orders",     qty: 2, set_code: 'PAL', number: '172' },
      { name: 'Ultra Ball',        qty: 4, set_code: 'SVI', number: '196' },
      { name: 'Mirage Gate',       qty: 4, set_code: 'LOR', number: '163' },
      { name: 'Lost Vacuum',       qty: 2, set_code: 'LOR', number: '162' },
      { name: 'Collapsed Stadium', qty: 2, set_code: 'BRS', number: '137' },
      { name: 'Grass Energy',      qty: 4, set_code: 'SVE', number: '1'   },
      { name: 'Fire Energy',       qty: 4, set_code: 'SVE', number: '2'   },
    ],
  },

  {
    id: 'miraidon-ex',
    name: 'Miraidon ex',
    format: 'standard',
    tier: 'A',
    win_rate: 53,
    archetype: 'aggro',
    energy_types: ['lightning'],
    description: 'Tandem Unit fills your bench with Miraidon ex and Regieleki VMAX for fast setup. Electric Generator accelerates energy. Simple and fast.',
    cards: [
      { name: 'Miraidon ex',       qty: 4, set_code: 'SVI', number: '81'  },
      { name: 'Regieleki VMAX',    qty: 2, set_code: 'EVS', number: '57'  },
      { name: 'Regieleki V',       qty: 2, set_code: 'EVS', number: '56'  },
      { name: 'Flaaffy',           qty: 3, set_code: 'EVS', number: '55'  },
      { name: 'Mareep',            qty: 3, set_code: 'FST', number: '68'  },
      { name: 'Raichu V',          qty: 1, set_code: 'CPA', number: '45'  },
      { name: 'Iono',              qty: 4, set_code: 'PAL', number: '185' },
      { name: "Professor's Research", qty: 2, set_code: 'SVI', number: '189' },
      { name: "Boss's Orders",     qty: 2, set_code: 'PAL', number: '172' },
      { name: 'Arven',             qty: 2, set_code: 'SVI', number: '166' },
      { name: 'Ultra Ball',        qty: 4, set_code: 'SVI', number: '196' },
      { name: 'Nest Ball',         qty: 4, set_code: 'SVI', number: '181' },
      { name: 'Electric Generator',qty: 4, set_code: 'SVI', number: '170' },
      { name: 'Counter Catcher',   qty: 2, set_code: 'PAR', number: '160' },
      { name: 'Defiance Band',     qty: 2, set_code: 'SVI', number: '169' },
      { name: 'Path to the Peak',  qty: 2, set_code: 'CRE', number: '148' },
      { name: 'Lightning Energy',  qty: 8, set_code: 'SVE', number: '4'   },
    ],
  },

  {
    id: 'iron-thorns-stall',
    name: 'Iron Thorns ex Stall',
    format: 'standard',
    tier: 'A',
    win_rate: 52,
    archetype: 'stall',
    energy_types: ['lightning'],
    description: 'Iron Thorns ex blocks all Special Energy, choking most modern decks. Path to the Peak shuts off Rule Box abilities. Grind opponents out of resources.',
    cards: [
      { name: 'Iron Thorns ex',    qty: 4, set_code: 'PAR', number: '120' },
      { name: 'Ditto',             qty: 2, set_code: 'MEW', number: '132' },
      { name: 'Manaphy',           qty: 2, set_code: 'BRS', number: '41'  },
      { name: 'Iono',              qty: 4, set_code: 'PAL', number: '185' },
      { name: "Professor's Research", qty: 2, set_code: 'SVI', number: '189' },
      { name: "Boss's Orders",     qty: 2, set_code: 'PAL', number: '172' },
      { name: 'Arven',             qty: 3, set_code: 'SVI', number: '166' },
      { name: 'Ultra Ball',        qty: 4, set_code: 'SVI', number: '196' },
      { name: 'Nest Ball',         qty: 4, set_code: 'SVI', number: '181' },
      { name: 'Penny',             qty: 3, set_code: 'SVI', number: '183' },
      { name: 'Counter Catcher',   qty: 2, set_code: 'PAR', number: '160' },
      { name: 'Heavy Baton',       qty: 2, set_code: 'PAR', number: '167' },
      { name: 'Path to the Peak',  qty: 4, set_code: 'CRE', number: '148' },
      { name: 'Collapsed Stadium', qty: 2, set_code: 'BRS', number: '137' },
      { name: 'Lightning Energy',  qty: 8, set_code: 'SVE', number: '4'   },
      { name: 'Gift Energy',       qty: 2, set_code: 'LOR', number: '171' },
    ],
  },

  {
    id: 'lost-box',
    name: 'Lost Box',
    format: 'standard',
    tier: 'B',
    win_rate: 49,
    archetype: 'control',
    energy_types: ['colorless', 'grass'],
    description: 'Comfey + Colress\'s Experiment fills the Lost Zone. Cramorant, Sableye, and Radiant Charizard attack for free or cheap once you hit 10 Lost Zone cards.',
    cards: [
      { name: 'Comfey',            qty: 4, set_code: 'LOR', number: '79'  },
      { name: 'Cramorant',         qty: 2, set_code: 'LOR', number: '50'  },
      { name: 'Sableye',           qty: 3, set_code: 'LOR', number: '70'  },
      { name: 'Radiant Charizard', qty: 1, set_code: 'CRZ', number: '20'  },
      { name: 'Radiant Greninja',  qty: 1, set_code: 'ASR', number: '46'  },
      { name: 'Manaphy',           qty: 2, set_code: 'BRS', number: '41'  },
      { name: 'Colress\'s Experiment', qty: 4, set_code: 'LOR', number: '155' },
      { name: 'Iono',              qty: 2, set_code: 'PAL', number: '185' },
      { name: "Professor's Research", qty: 2, set_code: 'SVI', number: '189' },
      { name: "Boss's Orders",     qty: 2, set_code: 'PAL', number: '172' },
      { name: 'Mirage Gate',       qty: 4, set_code: 'LOR', number: '163' },
      { name: 'Nest Ball',         qty: 4, set_code: 'SVI', number: '181' },
      { name: 'Escape Rope',       qty: 2, set_code: 'BST', number: '125' },
      { name: 'Lost Vacuum',       qty: 4, set_code: 'LOR', number: '162' },
      { name: 'Collapsed Stadium', qty: 3, set_code: 'BRS', number: '137' },
      { name: 'Grass Energy',      qty: 4, set_code: 'SVE', number: '1'   },
      { name: 'Fire Energy',       qty: 4, set_code: 'SVE', number: '2'   },
    ],
  },

  {
    id: 'lugia-vstar',
    name: 'Lugia VSTAR',
    format: 'standard',
    tier: 'B',
    win_rate: 48,
    archetype: 'midrange',
    energy_types: ['colorless'],
    description: 'Summoning Star puts two Archeops from discard into play, who then accelerate Special Energy onto Lugia VSTAR. Hits hard with Tempest Dive.',
    cards: [
      { name: 'Lugia V',          qty: 3, set_code: 'SIT', number: '138' },
      { name: 'Lugia VSTAR',      qty: 2, set_code: 'SIT', number: '139' },
      { name: 'Archeops',         qty: 4, set_code: 'SIT', number: '147' },
      { name: 'Yveltal',          qty: 2, set_code: 'SIT', number: '86'  },
      { name: 'Minccino',         qty: 2, set_code: 'SHF', number: '57'  },
      { name: 'Cinccino',         qty: 2, set_code: 'SHF', number: '58'  },
      { name: 'Iono',             qty: 4, set_code: 'PAL', number: '185' },
      { name: "Professor's Research", qty: 2, set_code: 'SVI', number: '189' },
      { name: "Boss's Orders",    qty: 2, set_code: 'PAL', number: '172' },
      { name: 'Arven',            qty: 2, set_code: 'SVI', number: '166' },
      { name: 'Ultra Ball',       qty: 4, set_code: 'SVI', number: '196' },
      { name: 'Nest Ball',        qty: 2, set_code: 'SVI', number: '181' },
      { name: 'Lost Vacuum',      qty: 2, set_code: 'LOR', number: '162' },
      { name: 'Capturing Aroma',  qty: 2, set_code: 'SIT', number: '153' },
      { name: 'Collapsed Stadium',qty: 2, set_code: 'BRS', number: '137' },
      { name: 'Jet Energy',       qty: 4, set_code: 'PAL', number: '190' },
      { name: 'Double Turbo Energy', qty: 4, set_code: 'BRS', number: '151' },
    ],
  },

  {
    id: 'roaring-moon-ex',
    name: 'Roaring Moon ex',
    format: 'standard',
    tier: 'B',
    win_rate: 47,
    archetype: 'aggro',
    energy_types: ['dark'],
    description: 'Frenzied Gouging discards energy but hits for 200. Dark Patch (via Squawkabilly) reattaches energy from discard. Pure aggression.',
    cards: [
      { name: 'Roaring Moon ex',  qty: 4, set_code: 'PAR', number: '124' },
      { name: 'Squawkabilly ex',  qty: 3, set_code: 'PAL', number: '169' },
      { name: 'Radiant Greninja', qty: 1, set_code: 'ASR', number: '46'  },
      { name: 'Mew ex',           qty: 1, set_code: 'MEW', number: '151' },
      { name: 'Iono',             qty: 4, set_code: 'PAL', number: '185' },
      { name: "Professor's Research", qty: 3, set_code: 'SVI', number: '189' },
      { name: "Boss's Orders",    qty: 2, set_code: 'PAL', number: '172' },
      { name: 'Ultra Ball',       qty: 4, set_code: 'SVI', number: '196' },
      { name: 'Dark Patch',       qty: 4, set_code: 'ASR', number: '139' },
      { name: 'Battle VIP Pass',  qty: 4, set_code: 'FST', number: '225' },
      { name: 'Defiance Band',    qty: 3, set_code: 'SVI', number: '169' },
      { name: 'Collapsed Stadium',qty: 3, set_code: 'BRS', number: '137' },
      { name: 'Darkness Energy',  qty: 8, set_code: 'SVE', number: '7'   },
    ],
  },

  // ─── EXPANDED ─────────────────────────────────────────────────────────────

  {
    id: 'lost-box-expanded',
    name: 'Lost Box (Expanded)',
    format: 'expanded',
    tier: 'S',
    win_rate: 65,
    archetype: 'control',
    energy_types: ['colorless', 'grass'],
    description: 'The most oppressive deck in Expanded. Access to VS Seeker, Computer Search, and older consistency cards makes the Lost Zone engine even faster.',
    cards: [
      { name: 'Comfey',              qty: 4, set_code: 'LOR',  number: '79'  },
      { name: 'Cramorant',           qty: 2, set_code: 'LOR',  number: '50'  },
      { name: 'Sableye',             qty: 3, set_code: 'LOR',  number: '70'  },
      { name: 'Radiant Charizard',   qty: 1, set_code: 'CRZ',  number: '20'  },
      { name: 'Radiant Greninja',    qty: 1, set_code: 'ASR',  number: '46'  },
      { name: 'Jirachi',             qty: 2, set_code: 'TEU',  number: '99'  },
      { name: 'Colress\'s Experiment', qty: 4, set_code: 'LOR', number: '155' },
      { name: "Professor's Research", qty: 2, set_code: 'SVI', number: '189' },
      { name: "Boss's Orders",       qty: 2, set_code: 'PAL',  number: '172' },
      { name: 'VS Seeker',           qty: 4, set_code: 'PHF',  number: '109' },
      { name: 'Computer Search',     qty: 1, set_code: 'BCR',  number: '137' },
      { name: 'Mirage Gate',         qty: 4, set_code: 'LOR',  number: '163' },
      { name: 'Lost Vacuum',         qty: 4, set_code: 'LOR',  number: '162' },
      { name: 'Nest Ball',           qty: 4, set_code: 'SVI',  number: '181' },
      { name: 'Escape Rope',         qty: 2, set_code: 'BST',  number: '125' },
      { name: 'Collapsed Stadium',   qty: 2, set_code: 'BRS',  number: '137' },
      { name: 'Grass Energy',        qty: 4, set_code: 'SVE',  number: '1'   },
      { name: 'Fire Energy',         qty: 4, set_code: 'SVE',  number: '2'   },
    ],
  },

  {
    id: 'wailord-stall',
    name: 'Wailord Stall (Expanded)',
    format: 'expanded',
    tier: 'A',
    win_rate: 59,
    archetype: 'stall',
    energy_types: ['water'],
    description: 'Wailord EX has 250 HP. Stall with Team Flare Grunt, Enhanced Hammer, and Team Skull Grunt to deck your opponent out. The ultimate patience test.',
    cards: [
      { name: 'Wailord EX',         qty: 4, set_code: 'PRC', number: '38'  },
      { name: 'Oranguru',           qty: 2, set_code: 'SUM', number: '113' },
      { name: 'Hoopa',              qty: 1, set_code: 'SHL', number: 'RC37' },
      { name: 'Team Flare Grunt',   qty: 4, set_code: 'XY',  number: '129' },
      { name: 'Team Skull Grunt',   qty: 4, set_code: 'SUM', number: '133' },
      { name: 'Plumeria',           qty: 4, set_code: 'BUS', number: '120' },
      { name: 'Enhanced Hammer',    qty: 4, set_code: 'PHF', number: '94'  },
      { name: 'Crushing Hammer',    qty: 4, set_code: 'SUM', number: '115' },
      { name: 'Delinquent',         qty: 3, set_code: 'BKP', number: '98'  },
      { name: 'N',                  qty: 4, set_code: 'FCO', number: '105' },
      { name: 'Lusamine',           qty: 4, set_code: 'CIN', number: '96'  },
      { name: 'VS Seeker',          qty: 4, set_code: 'PHF', number: '109' },
      { name: 'Rough Seas',         qty: 4, set_code: 'PRC', number: '137' },
      { name: 'Water Energy',       qty: 7, set_code: 'SVE', number: '3'   },
    ],
  },

  {
    id: 'arceus-vstar-expanded',
    name: 'Arceus VSTAR (Expanded)',
    format: 'expanded',
    tier: 'A',
    win_rate: 55,
    archetype: 'midrange',
    energy_types: ['colorless'],
    description: 'Trinity Nova attaches 3 Basic Energy from deck to any Pokémon. Pairs with Inteleon for sniping or Giratina VSTAR for heavy hitters. Extremely versatile.',
    cards: [
      { name: 'Arceus V',           qty: 4, set_code: 'BRS', number: '122' },
      { name: 'Arceus VSTAR',       qty: 3, set_code: 'BRS', number: '123' },
      { name: 'Giratina V',         qty: 2, set_code: 'LOR', number: '130' },
      { name: 'Giratina VSTAR',     qty: 2, set_code: 'LOR', number: '131' },
      { name: 'Inteleon',           qty: 2, set_code: 'CRE', number: '43'  },
      { name: 'Drizzile',           qty: 2, set_code: 'SHF', number: '26'  },
      { name: 'Sobble',             qty: 3, set_code: 'CRE', number: '41'  },
      { name: 'Jirachi',            qty: 2, set_code: 'TEU', number: '99'  },
      { name: "Professor's Research", qty: 2, set_code: 'SVI', number: '189' },
      { name: "Boss's Orders",      qty: 2, set_code: 'PAL', number: '172' },
      { name: 'N',                  qty: 2, set_code: 'FCO', number: '105' },
      { name: 'VS Seeker',          qty: 3, set_code: 'PHF', number: '109' },
      { name: 'Ultra Ball',         qty: 4, set_code: 'SVI', number: '196' },
      { name: 'Rare Candy',         qty: 3, set_code: 'SVI', number: '191' },
      { name: 'Escape Rope',        qty: 2, set_code: 'BST', number: '125' },
      { name: 'Collapsed Stadium',  qty: 2, set_code: 'BRS', number: '137' },
      { name: 'Grass Energy',       qty: 4, set_code: 'SVE', number: '1'   },
      { name: 'Psychic Energy',     qty: 4, set_code: 'SVE', number: '5'   },
    ],
  },

  {
    id: 'mewtwo-vmax-expanded',
    name: 'Mewtwo VMAX (Expanded)',
    format: 'expanded',
    tier: 'B',
    win_rate: 53,
    archetype: 'aggro',
    energy_types: ['psychic'],
    description: 'Max Miracle for 220 damage ignoring all effects. Dimension Valley reduces Psychic attack costs. Supported by the full expanded Psychic toolkit.',
    cards: [
      { name: 'Mewtwo V',           qty: 4, set_code: 'PR-SW', number: '158' },
      { name: 'Mewtwo VMAX',        qty: 3, set_code: 'PR-SW', number: '159' },
      { name: 'Cresselia',          qty: 2, set_code: 'LOR',   number: '74'  },
      { name: 'Mew',                qty: 2, set_code: 'CRE',   number: '11'  },
      { name: 'Jirachi',            qty: 2, set_code: 'TEU',   number: '99'  },
      { name: 'Fog Crystal',        qty: 4, set_code: 'CRE',   number: '140' },
      { name: 'Quick Ball',         qty: 4, set_code: 'SSH',   number: '179' },
      { name: 'Ultra Ball',         qty: 4, set_code: 'SVI',   number: '196' },
      { name: "Cynthia",            qty: 3, set_code: 'UPR',   number: '119' },
      { name: 'N',                  qty: 3, set_code: 'FCO',   number: '105' },
      { name: "Boss's Orders",      qty: 2, set_code: 'PAL',   number: '172' },
      { name: 'VS Seeker',          qty: 4, set_code: 'PHF',   number: '109' },
      { name: 'Dimension Valley',   qty: 4, set_code: 'PHF',   number: '93'  },
      { name: 'Psychic Energy',     qty: 9, set_code: 'SVE',   number: '5'   },
    ],
  },

  {
    id: 'turbo-dark-expanded',
    name: 'Turbo Dark (Expanded)',
    format: 'expanded',
    tier: 'B',
    win_rate: 52,
    archetype: 'aggro',
    energy_types: ['dark'],
    description: 'Darkrai EX + Dark Patch accelerates Darkness Energy from discard. Yveltal EX and Umbreon VMAX hit hard once loaded. Classic Expanded aggro.',
    cards: [
      { name: 'Darkrai EX',         qty: 3, set_code: 'DEX', number: '63'  },
      { name: 'Yveltal EX',         qty: 2, set_code: 'XY',  number: '79'  },
      { name: 'Umbreon VMAX',       qty: 2, set_code: 'EVS', number: '95'  },
      { name: 'Umbreon V',          qty: 2, set_code: 'EVS', number: '94'  },
      { name: 'Hoopa EX',           qty: 1, set_code: 'AOR', number: '36'  },
      { name: 'Tapu Lele GX',       qty: 2, set_code: 'GRI', number: '60'  },
      { name: "Professor's Research", qty: 3, set_code: 'SVI', number: '189' },
      { name: "Boss's Orders",      qty: 2, set_code: 'PAL', number: '172' },
      { name: 'N',                  qty: 2, set_code: 'FCO', number: '105' },
      { name: 'VS Seeker',          qty: 4, set_code: 'PHF', number: '109' },
      { name: 'Ultra Ball',         qty: 4, set_code: 'SVI', number: '196' },
      { name: 'Dark Patch',         qty: 4, set_code: 'ASR', number: '139' },
      { name: 'Float Stone',        qty: 3, set_code: 'BKT', number: '137' },
      { name: 'Sky Field',          qty: 3, set_code: 'ROS', number: '89'  },
      { name: 'Darkness Energy',    qty: 9, set_code: 'SVE', number: '7'   },
    ],
  },
]

export const FORMATS = ['standard', 'expanded']
export const TIERS   = ['S', 'A', 'B', 'C']
export const ARCHETYPES = ['aggro', 'control', 'combo', 'midrange', 'stall']
export const ENERGY_TYPES = ['fire','water','grass','lightning','psychic','fighting','dark','metal','dragon','colorless']

export const TIER_COLORS = { S: '#c9a84c', A: '#4caf50', B: '#2196f3', C: '#9e9e9e' }

/** Deck total card count */
export function deckTotal(deck) {
  return deck.cards.reduce((s, c) => s + c.qty, 0)
}

/**
 * Given a collection map of { "SET-NUMBER": qty, ... } or { "name": qty }
 * compute how many cards from the deck the player owns.
 */
export function countOwned(deck, collection) {
  return deck.cards.reduce((sum, c) => {
    const key = `${c.set_code}-${c.number}`.toLowerCase()
    const nameKey = c.name.toLowerCase()
    const have = collection[key] ?? collection[nameKey] ?? 0
    return sum + Math.min(have, c.qty)
  }, 0)
}

/**
 * Return array of missing card objects with quantities.
 */
export function missingCards(deck, collection) {
  return deck.cards.flatMap(c => {
    const key     = `${c.set_code}-${c.number}`.toLowerCase()
    const nameKey = c.name.toLowerCase()
    const have    = collection[key] ?? collection[nameKey] ?? 0
    const need    = c.qty - have
    if (need <= 0) return []
    return [{ ...c, need, have }]
  })
}

/**
 * Estimate cost to complete a deck given missing cards and price map.
 * priceMap: { "SET-NUMBER": priceUSD, ... }
 */
export function costToComplete(deck, collection, priceMap = {}) {
  return missingCards(deck, collection).reduce((sum, c) => {
    const key = `${c.set_code}-${c.number}`.toLowerCase()
    const price = priceMap[key] ?? 0
    return sum + price * c.need
  }, 0)
}

/**
 * The composite Value Score (0–100).
 * weights: { winrate: 0–1, ownership: 0–1, cost: 0–1 } — should sum to 1.
 * maxCost: dollar amount that represents "full price" (default $300).
 */
export function deckScore(deck, collection, priceMap = {}, weights = { winrate: 0.4, ownership: 0.4, cost: 0.2 }, maxCost = 300) {
  const total     = deckTotal(deck)
  const owned     = countOwned(deck, collection)
  const ownerPct  = total > 0 ? owned / total : 0
  const missing$  = costToComplete(deck, collection, priceMap)
  const costScore = Math.max(0, 1 - missing$ / maxCost)
  const winScore  = (deck.win_rate ?? 50) / 100

  const raw = (winScore * weights.winrate) + (ownerPct * weights.ownership) + (costScore * weights.cost)
  const wSum = weights.winrate + weights.ownership + weights.cost
  return Math.round((raw / wSum) * 100)
}
