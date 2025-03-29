import conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// TODO:
// Bloom 3 - Seems like strats for positioning could vary here, so only calling out roses vs towers for now
// Maybe more with Escelon 2?

type Phase =
  | 'phase1'
  | 'escelon1'
  | 'adds'
  | 'phase2'
  | 'bloom1'
  | 'bloom2'
  | 'bloom3'
  | 'escelon2'
  | 'bloom4'
  | 'escelon3'
  | 'bloom5'
  | 'bloom6'
  | 'bloom1Repeat'
  | 'softEnrage';

const bloomTileFlags = {
  red: '01000040',
  despawningRed: '00200004',
  spawningGrey: '01000040',
  grey: '00020001',
  greyToRed: '00800040',
  clearOnWipe: '00040004',
  pulseSpread: '10000040',
  pulseStack: '20000040',
  pulseTower: '40000040',
  overlapRoses: '80000040',
} as const;

const tileLocs = ['NNE', 'ENE', 'ESE', 'SSE', 'SSW', 'WSW', 'WNW', 'NNW'] as const;
type TileLocsType = (typeof tileLocs)[number];
const tileInnerOuter = ['Inner', 'Outer'] as const;
type TileInnerOuterType = (typeof tileInnerOuter)[number];

const tileSlots = [
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '0A',
  '0B',
  '0C',
  '0D',
  '0E',
  '0F',
  '10',
  '11',
  '12',
  '13',
] as const;
type TileSlotsType = (typeof tileSlots)[number];

type MapEffectTile = `bloomTile${TileInnerOuterType}${TileLocsType}`;

type MapEffectData = {
  [tile in MapEffectTile]: {
    readonly location: TileSlotsType;
  } & typeof bloomTileFlags;
};

const mapEffectData: MapEffectData = {
  'bloomTileInnerNNE': {
    'location': '04',
    ...bloomTileFlags,
  },

  'bloomTileInnerENE': {
    'location': '05',
    ...bloomTileFlags,
  },

  'bloomTileInnerESE': {
    'location': '06',
    ...bloomTileFlags,
  },

  'bloomTileInnerSSE': {
    'location': '07',
    ...bloomTileFlags,
  },

  'bloomTileInnerSSW': {
    'location': '08',
    ...bloomTileFlags,
  },

  'bloomTileInnerWSW': {
    'location': '09',
    ...bloomTileFlags,
  },

  'bloomTileInnerWNW': {
    'location': '0A',
    ...bloomTileFlags,
  },

  'bloomTileInnerNNW': {
    'location': '0B',
    ...bloomTileFlags,
  },

  'bloomTileOuterNNE': {
    'location': '0C',
    ...bloomTileFlags,
  },

  'bloomTileOuterENE': {
    'location': '0D',
    ...bloomTileFlags,
  },

  'bloomTileOuterESE': {
    'location': '0E',
    ...bloomTileFlags,
  },

  'bloomTileOuterSSE': {
    'location': '0F',
    ...bloomTileFlags,
  },

  'bloomTileOuterSSW': {
    'location': '10',
    ...bloomTileFlags,
  },

  'bloomTileOuterWSW': {
    'location': '11',
    ...bloomTileFlags,
  },

  'bloomTileOuterWNW': {
    'location': '12',
    ...bloomTileFlags,
  },

  'bloomTileOuterNNW': {
    'location': '13',
    ...bloomTileFlags,
  },
} as const;

const mapEffectTiles: MapEffectTile[] = Object.keys(mapEffectData) as MapEffectTile[];

const isTileLoc = (loc: string): loc is TileSlotsType => {
  return tileSlots.includes(loc as TileSlotsType);
};

const getTileNameFromLocation = (loc: string): MapEffectTile => {
  if (!isTileLoc(loc))
    throw new UnreachableCode();

  const entry = Object.entries(mapEffectData).find((entry) => entry[1].location === loc);

  if (entry === undefined)
    throw new UnreachableCode();

  const [key] = entry;

  if (key === undefined)
    throw new UnreachableCode();

  return key as MapEffectTile;
};

const headMarkerData = {
  // Thorns tether purple markers during Bloom 4
  'thorns': '000C',
  // Adds red headmarker showing you're tethered
  'addsTether': '0017',
  // Escelon 2 stack marker
  'fourPlayerStack': '005D',
  // Bloom 1 clockwise rotation indicator
  'clockwise': '00A7',
  // Bloom 1 counterclockwise rotation indicator
  'counterclockwise': '00A8',
  // "Shock" donut marker
  'shockDonut': '0244',
  // "Shock" spread marker
  'shockSpread': '0245',
  // "Stock Break" multi-hit marker
  'fiveHitStack': '024E',
  // Rose/Flower headmarker
  'roseFlower': '0250',
  // Rose spread marker
  'roseSpread': '0254',
  // Stack marker during Bloom 4, for "Alexandrian Banish III"
  'bloom4Stack': '0255',
} as const;

const defaultTileState = () => ({
  bloomTileInnerNNE: 'unknown',
  bloomTileInnerENE: 'unknown',
  bloomTileInnerESE: 'unknown',
  bloomTileInnerSSE: 'unknown',
  bloomTileInnerSSW: 'unknown',
  bloomTileInnerWSW: 'unknown',
  bloomTileInnerWNW: 'unknown',
  bloomTileInnerNNW: 'unknown',
  bloomTileOuterNNE: 'unknown',
  bloomTileOuterENE: 'unknown',
  bloomTileOuterESE: 'unknown',
  bloomTileOuterSSE: 'unknown',
  bloomTileOuterSSW: 'unknown',
  bloomTileOuterWSW: 'unknown',
  bloomTileOuterWNW: 'unknown',
  bloomTileOuterNNW: 'unknown',
} as const);

export interface Data extends RaidbossData {
  phase: Phase;
  tileState: {
    [loc in MapEffectTile]: 'unknown' | 'red' | 'grey';
  };
  escelonFallBaits: ('near' | 'far')[];
  bloom1StartDir?: number;
  bloom4RoseDirNorth: boolean;
  bloom5FirstDirSafe: 'dirNE' | 'dirNW' | 'dirSE' | 'dirSW' | 'unknown';
  bloom5SecondDirSafe: 'dirNE' | 'dirNW' | 'dirSE' | 'dirSW' | 'unknown';
  bloom6Rose: boolean;
}

const triggerSet: TriggerSet<Data> = {
  id: 'RecollectionExtreme',
  zoneId: ZoneId.RecollectionExtreme,
  timelineFile: 'zelenia-ex.txt',
  initData: () => ({
    escelonFallBaits: [],
    phase: 'phase1',
    tileState: { ...defaultTileState() },
    bloom4RoseDirNorth: false,
    bloom5FirstDirSafe: 'unknown',
    bloom5SecondDirSafe: 'unknown',
    bloom6Rose: false,
  }),
  triggers: [
    {
      id: 'ZeleniaEx Tile Tracker',
      type: 'MapEffect',
      netRegex: {
        location: tileSlots,
        flags: [bloomTileFlags.red, bloomTileFlags.grey, bloomTileFlags.greyToRed],
        capture: true,
      },
      run: (data, matches) => {
        let newState: 'unknown' | 'red' | 'grey' = 'unknown';

        switch (matches.flags) {
          case bloomTileFlags.red:
          case bloomTileFlags.greyToRed:
            newState = 'red';
            break;
          case bloomTileFlags.grey:
            newState = 'grey';
            break;
        }
        data.tileState[getTileNameFromLocation(matches.location)] = newState;
      },
    },
    {
      id: 'ZeleniaEx Phase Tracker',
      type: 'StartsUsing',
      netRegex: {
        id: [
          'A8AD',
          'A8B5',
          'A8CD',
          'A8B9',
          'AA14',
          'AA15',
          'A8C1',
          'AA16',
          'A8E8',
          'AA17',
          'AA18',
        ],
        capture: true,
      },
      suppressSeconds: 5,
      run: (data, matches) => {
        switch (matches.id) {
          case 'A8AD': // Escelons' Fall (happens 3 times, only check first for phase1)
            if (data.phase === 'phase1')
              data.phase = 'escelon1';
            break;
          case 'A8B5': // Blessed Barricade
            data.phase = 'adds';
            break;
          case 'A8CD': // Perfumed Quietus
            data.phase = 'phase2';
            break;
          case 'A8B9': // Roseblood Bloom (happens twice, check for bloom 6)
            data.phase = 'bloom1';
            break;
          case 'AA14': // Roseblood: 2nd Bloom
            data.phase = 'bloom2';
            break;
          case 'AA15': // Roseblood: 3rd Bloom
            data.phase = 'bloom3';
            break;
          case 'A8C1': // Explosion (happens 2 times, bloom 3 => escelon 2, bloom 6 ignore)
            if (data.phase === 'bloom3')
              data.phase = 'escelon2';
            break;
          case 'AA16': // Roseblood: 4th Bloom
            data.phase = 'bloom4';
            break;
          case 'A8E8': // Alexandrian Banish III
            data.phase = 'escelon3';
            break;
          case 'AA17': // Roseblood: 5th Bloom
            data.phase = 'bloom5';
            break;
          case 'AA18': // Roseblood: 6th Bloom
            data.phase = 'bloom6';
            break;
        }
      },
    },
    {
      id: 'ZeleniaEx Escelon Bait Collect',
      type: 'GainsEffect',
      // count: 2F6 = near, 2F7 = far
      netRegex: { effectId: 'B9A', count: ['2F6', '2F7'] },
      preRun: (data, matches) =>
        data.escelonFallBaits.push(matches.count === '2F6' ? 'near' : 'far'),
    },
    {
      id: 'ZeleniaEx Escelon Bait Cleanup',
      type: 'GainsEffect',
      // count: 2F6 = near, 2F7 = far
      netRegex: { effectId: 'B9A', count: ['2F6', '2F7'], capture: false },
      delaySeconds: 30,
      suppressSeconds: 30,
      run: (data) => data.escelonFallBaits = [],
    },
    {
      id: 'ZeleniaEx Escelon Bait',
      type: 'GainsEffect',
      // count: 2F6 = near, 2F7 = far
      netRegex: { effectId: 'B9A', count: ['2F6', '2F7'], capture: false },
      durationSeconds: 19,
      suppressSeconds: (data) => data.escelonFallBaits.length > 1 ? 20 : 0,
      infoText: (data, _matches, output) => {
        if (data.escelonFallBaits.length !== 2)
          return;
        const [bait1, bait2] = data.escelonFallBaits;
        if (bait1 === undefined || bait2 === undefined)
          return;

        if (bait1 === bait2) {
          return output.swapAfterFirst!({
            first: output[bait1]!(),
          });
        }
        return output.swapAfterSecond!({
          first: output[bait1]!(),
        });
      },
      outputStrings: {
        near: {
          en: 'Near',
        },
        far: {
          en: 'Far',
        },
        swapAfterFirst: {
          en: '${first} bait first, Swap after first+third',
        },
        swapAfterSecond: {
          en: '${first} bait first, Swap after second',
        },
      },
    },
    {
      id: 'ZeleniaEx Thorned Catharsis',
      type: 'StartsUsing',
      netRegex: { id: 'A89E', source: 'Zelenia', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'ZeleniaEx Shock P1 Tower',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.shockDonut, capture: true },
      condition: (data, matches) =>
        conditions.targetIsYou()(data, matches) && data.phase === 'phase1',
      infoText: (_data, _matches, output) => output.tower!(),
      outputStrings: {
        tower: {
          en: 'Donut on you, get tower',
        },
      },
    },
    {
      id: 'ZeleniaEx Shock Spread',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.shockSpread, capture: true },
      condition: conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'ZeleniaEx Shock Spread Move Reminder',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.shockSpread, capture: true },
      condition: conditions.targetIsYou(),
      delaySeconds: 7,
      response: Responses.moveAway(),
    },
    {
      id: 'ZeleniaEx Bloom 4 Stack',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.bloom4Stack, capture: false },
      infoText: (_data, _matches, output) => output.stacks!(),
      outputStrings: {
        stacks: {
          en: 'Support/DPS stacks',
        },
      },
    },
    {
      id: 'ZeleniaEx Power Break',
      type: 'StartsUsing',
      netRegex: { id: ['A8B0', 'A8B1'], source: 'Zelenia\'s Shade', capture: true },
      infoText: (_data, matches, output) => {
        // A8B0 = cleaving right
        // A8B1 = cleaving left
        const isNorth = Directions.hdgTo4DirNum(parseFloat(matches.heading)) === 2;
        let cleavingEast = matches.id === 'A8B0';
        // flip cleave dir if north
        if (isNorth)
          cleavingEast = !cleavingEast;

        if (cleavingEast)
          return output.west!();
        return output.east!();
      },
      outputStrings: {
        west: outputs.west,
        east: outputs.east,
      },
    },
    {
      id: 'ZeleniaEx Specter of the Lost',
      type: 'StartsUsing',
      netRegex: { id: 'A89F', source: 'Zelenia', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tetherBuster: outputs.tetherBusters,
          busterAvoid: outputs.avoidTetherBusters,
        };

        if (data.role === 'tank')
          return { alertText: output.tetherBuster!() };
        return { infoText: output.busterAvoid!() };
      },
    },
    {
      id: 'ZeleniaEx Stock Break',
      type: 'StartsUsing',
      netRegex: { id: 'A8D5', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack x5',
          de: 'Sammeln x5',
          fr: 'Package x5',
          ja: '頭割り x5',
          cn: '5次分摊',
          ko: '쉐어 5번',
        },
      },
    },
    {
      id: 'ZeleniaEx Blessed Barricade',
      type: 'StartsUsing',
      netRegex: { id: 'A8B5', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Supports west, DPS east',
        },
      },
    },
    {
      id: 'ZeleniaEx Spearpoint Push',
      type: 'StartsUsing',
      netRegex: { id: ['A8B3', 'A8B4'], source: 'Zelenia\'s Shade', capture: true },
      condition: conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Point sword cleave out',
        },
      },
    },
    {
      id: 'ZeleniaEx Perfumed Quietus',
      type: 'StartsUsing',
      netRegex: { id: 'A8CD', source: 'Zelenia', capture: false },
      delaySeconds: 3.9,
      response: Responses.bigAoe(),
    },
    {
      id: 'ZeleniaEx Bloom 1 Rotation Collector',
      type: 'MapEffect',
      netRegex: {
        location: tileSlots,
        flags: [bloomTileFlags.red, bloomTileFlags.grey, bloomTileFlags.greyToRed],
        capture: false,
      },
      condition: (data) => data.phase === 'bloom1',
      delaySeconds: 0.5,
      suppressSeconds: 100,
      run: (data) => {
        let dirIdx = 1;
        let foundGrey = false;

        // Find the 1st inner tile clockwise that's grey
        for (const key of mapEffectTiles) {
          if (!key.includes('Inner'))
            continue;
          if (foundGrey) {
            if (data.tileState[key] === 'red') {
              // Special edge case, NNW is safe
              dirIdx = 15;
            } else {
              dirIdx += 2;
            }
            break;
          }

          if (data.tileState[key] === 'grey') {
            foundGrey = true;
            continue;
          }

          dirIdx += 2;
        }

        data.bloom1StartDir = dirIdx;
      },
    },
    {
      id: 'ZeleniaEx Bloom 1 Rotation',
      type: 'HeadMarker',
      netRegex: { id: [headMarkerData.clockwise, headMarkerData.counterclockwise], capture: true },
      infoText: (data, matches, output) =>
        output.text!({
          dir: output[Directions.output16Dir[data.bloom1StartDir ?? -1] ?? 'unknown']!(),
          rotate: matches.id === headMarkerData.clockwise
            ? output.clockwise!()
            : output.counterclockwise!(),
        }),
      outputStrings: {
        ...Directions.outputStrings16Dir,
        clockwise: outputs.clockwise,
        counterclockwise: outputs.counterclockwise,
        text: {
          en: 'Start ${dir}, rotate ${rotate}',
        },
      },
    },
    {
      id: 'ZeleniaEx Bloom 2',
      type: 'StartsUsing',
      netRegex: { id: ['A9BA', 'A9BB'], capture: true },
      condition: (data) => data.phase === 'bloom2',
      durationSeconds: 11.4,
      suppressSeconds: 30,
      infoText: (data, matches, output) => {
        // Only two possible floor patterns here. Thunder slash pattern is always the same.
        const inSafeFirst = matches.id === 'A9BB';
        const inOneTileSafeWest = data.tileState.bloomTileInnerWNW === 'red';

        if (inSafeFirst) {
          if (inOneTileSafeWest)
            return output.inWest!();
          return output.inEast!();
        }
        if (inOneTileSafeWest)
          return output.outEast!();
        return output.outWest!();
      },
      outputStrings: {
        inWest: {
          en: 'In WSW => Out WNW => Out WSW',
        },
        inEast: {
          en: 'In ESE => Out ESE => Out ENE',
        },
        outWest: {
          en: 'Out WSW => In WNW => In WSW',
        },
        outEast: {
          en: 'Out ESE => In ESE => In ENE',
        },
      },
    },
    {
      id: 'ZeleniaEx Bloom 3 Rose Headmarker',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.roseFlower, capture: true },
      condition: (data) => data.phase === 'bloom3',
      suppressSeconds: 10,
      infoText: (data, matches, output) => {
        const targetIsDPS = data.party.isDPS(matches.target);
        const youAreDPS = data.party.isDPS(data.me);
        if (targetIsDPS === youAreDPS)
          return output.rose!();

        return output.spread!();
      },
      outputStrings: {
        rose: {
          en: 'Rose Marker on YOU',
        },
        spread: {
          en: 'Spread Marker on YOU',
        },
      },
    },
    {
      id: 'ZeleniaEx Bloom 4 Find Roses Dir',
      type: 'MapEffect',
      netRegex: {
        location: tileSlots,
        flags: [bloomTileFlags.red, bloomTileFlags.grey, bloomTileFlags.greyToRed],
        capture: false,
      },
      condition: (data) => data.phase === 'bloom4',
      delaySeconds: 0.5,
      suppressSeconds: 100,
      infoText: (data, _matches, output) => {
        const rosesNorth = data.tileState.bloomTileOuterSSE === 'red' ||
          data.tileState.bloomTileOuterSSW === 'red';
        data.bloom4RoseDirNorth = rosesNorth;

        if (rosesNorth)
          return output.north!();

        return output.south!();
      },
      outputStrings: {
        north: {
          en: 'Roses north, spreads south',
        },
        south: {
          en: 'Roses south, spreads north',
        },
      },
    },
    {
      id: 'ZeleniaEx Bloom 4 Rose Headmarker',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.roseFlower, capture: true },
      condition: (data) => data.phase === 'bloom4',
      suppressSeconds: 10,
      infoText: (data, matches, output) => {
        const targetIsDPS = data.party.isDPS(matches.target);
        const youAreDPS = data.party.isDPS(data.me);
        const youAreRose = targetIsDPS === youAreDPS;

        let north = data.bloom4RoseDirNorth;

        if (!youAreRose)
          north = !north;

        const northSouth = north ? output.north!() : output.south!();

        if (youAreRose)
          return output.rose!({ northSouth: northSouth });

        return output.spread!({ northSouth: northSouth });
      },
      outputStrings: {
        unknown: outputs.unknown,
        north: outputs.north,
        south: outputs.south,
        rose: {
          en: 'Rose Marker on YOU, spread ${northSouth}',
        },
        spread: {
          en: 'Spread Marker on YOU, spread ${northSouth}',
        },
      },
    },
    {
      id: 'ZeleniaEx Bloom 4 Thorns',
      type: 'StartsUsing',
      netRegex: { id: 'A8C3', capture: false },
      infoText: (_data, _matches, output) => output.thorns!(),
      outputStrings: {
        thorns: {
          en: 'Stack for thorns => break tethers => stack in red tiles',
        },
      },
    },
    {
      id: 'ZeleniaEx Bloom 5 Chakram Collector',
      type: 'ActorSetPos',
      netRegex: { id: '40[0-9A-F]{6}', capture: true },
      condition: (data, matches) => {
        if (data.phase !== 'bloom5')
          return false;

        if (Math.abs(100 - parseFloat(matches.x)) < 2)
          return false;

        if (Math.abs(100 - parseFloat(matches.y)) < 2)
          return false;

        return true;
      },
      suppressSeconds: 9999,
      infoText: (data, matches, output) => {
        const neSwSafe = data.tileState.bloomTileOuterNNE === 'grey';
        const cleaveDir = Directions.hdgTo4DirNum(parseFloat(matches.heading));
        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        const isNorth = y < 100;
        const isWest = x < 100;

        // Consider east safe to start, reverse if needed
        const safeDirs: ('dirNE' | 'dirSE' | 'dirSW' | 'dirNW')[] = neSwSafe
          ? ['dirNE', 'dirSW']
          : ['dirSE', 'dirNW'];

        let firstCleave: ('dirNE' | 'dirSE' | 'dirSW' | 'dirNW')[] = ['dirNE', 'dirSE'];

        if ([1, 3].includes(cleaveDir)) {
          if (isNorth) {
            firstCleave = ['dirNE', 'dirNW'];
          } else {
            firstCleave = ['dirSE', 'dirSW'];
          }
        } else if (isWest) {
          firstCleave = ['dirNW', 'dirSW'];
        }

        data.bloom5FirstDirSafe = safeDirs.find((dir) => !firstCleave.includes(dir)) ?? 'unknown';
        data.bloom5SecondDirSafe = safeDirs.find((dir) => firstCleave.includes(dir)) ?? 'unknown';

        return output.start!({
          startDir: output[data.bloom5FirstDirSafe]!(),
        });
      },
      outputStrings: {
        ...Directions.outputStrings8Dir,
        start: {
          en: 'Start ${startDir}',
        },
      },
    },
    {
      id: 'ZeleniaEx Bloom 5 Movement',
      type: 'StartsUsing',
      netRegex: { id: ['A9BA', 'A9BB'], capture: true },
      condition: (data) => data.phase === 'bloom5',
      durationSeconds: 11.4,
      suppressSeconds: 30,
      infoText: (data, matches, output) => {
        const inSafeFirst = matches.id === 'A9BB';

        return output.text!({
          inOutFirst: inSafeFirst ? output.in!() : output.out!(),
          inOutSecond: inSafeFirst ? output.out!() : output.in!(),
          dirFirst: output[data.bloom5FirstDirSafe]!(),
          dirSecond: output[data.bloom5SecondDirSafe]!(),
        });
      },
      outputStrings: {
        ...Directions.outputStrings8Dir,
        in: outputs.in,
        out: outputs.out,
        text: {
          en: '${inOutFirst} ${dirFirst} Clockwise => ${inOutSecond} ${dirSecond}',
        },
      },
    },
    {
      id: 'ZeleniaEx Bloom 6 Rose Headmarker',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.roseFlower, capture: true },
      condition: (data) => data.phase === 'bloom6',
      suppressSeconds: 10,
      infoText: (data, matches, output) => {
        const targetIsDPS = data.party.isDPS(matches.target);
        const youAreDPS = data.party.isDPS(data.me);
        data.bloom6Rose = targetIsDPS === youAreDPS;

        if (data.bloom6Rose)
          return output.rose!();

        return output.tower!();
      },
      outputStrings: {
        rose: {
          en: 'Rose Marker on YOU',
        },
        tower: {
          en: 'Tower Soaks Later',
        },
      },
    },
    {
      id: 'ZeleniaEx Bloom 6',
      type: 'StartsUsing',
      netRegex: { id: ['A8DF', 'A8E1'], capture: true },
      condition: (data) => data.phase === 'bloom5',
      durationSeconds: 11.4,
      suppressSeconds: 30,
      infoText: (data, matches, output) => {
        const cleavingENEFirst = matches.id === 'A8E1';
        const towerENEOut = data.tileState.bloomTileOuterENE === 'red';

        const placeIn = cleavingENEFirst ? towerENEOut : !towerENEOut;

        if (data.bloom6Rose) {
          return output.rose!({
            inOut: placeIn ? output.in!() : output.out!(),
          });
        }

        return output.tower!();
      },
      outputStrings: {
        ...Directions.outputStrings8Dir,
        in: outputs.in,
        out: outputs.out,
        rose: {
          en: 'Place rose ${inOut} => dodge cleaves',
        },
        tower: {
          en: 'Dodge cleaves => soak tower',
        },
      },
    },
  ],
};

export default triggerSet;
