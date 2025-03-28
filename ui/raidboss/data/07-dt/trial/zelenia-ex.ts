import conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

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

type MapEffectTile = `bloomTile${TileInnerOuterType}${TileLocsType}`;

type MapEffectData = {
  [tile in MapEffectTile]: {
    readonly location: string;
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

console.assert(mapEffectData);

const headMarkerData = {
  // Thorns tether purple markers during Bloom 4
  'thorns': '000C',
  // Adds red headmarker showing you're tethered
  'addsTether': '0017',
  // Escalon 2 stack marker
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

export interface Data extends RaidbossData {
  escalonFallBaits: ('near' | 'far')[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'RecollectionExtreme',
  zoneId: ZoneId.RecollectionExtreme,
  timelineFile: 'zelenia-ex.txt',
  initData: () => ({
    escalonFallBaits: [],
  }),
  triggers: [
    {
      id: 'ZeleniaEx Thorned Catharsis',
      type: 'StartsUsing',
      netRegex: { id: 'A89E', source: 'Zelenia', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'ZeleniaEx Shock Spread',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.shockSpread, capture: true },
      condition: conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'ZeleniaEx Bloom 4 Stack',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.bloom4Stack, capture: false },
      infoText: (_data, _matches, output) => output.stacks!(),
      outputStrings: {
        stacks: Outputs.stacks,
      },
    },
    {
      id: 'ZeleniaEx Alexandrian Holy',
      type: 'StartsUsing',
      netRegex: { id: 'A8C0', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Specter of the Lost',
      type: 'StartsUsing',
      netRegex: { id: ['A89F', 'A8A0'], source: 'Zelenia', capture: false },
      response: Responses.tankBuster(),
    },
    {
      id: 'ZeleniaEx Stock Break',
      type: 'StartsUsing',
      netRegex: { id: 'A8D5', source: 'Zelenia', capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'ZeleniaEx Blessed Barricade A8B5',
      type: 'StartsUsing',
      netRegex: { id: 'A8B5', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Spearpoint Push A8B3',
      type: 'StartsUsing',
      netRegex: { id: 'A8B3', source: 'Zelenia\'s Shade', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Spearpoint Push A8B4',
      type: 'StartsUsing',
      netRegex: { id: 'A8B4', source: 'Zelenia\'s Shade', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Perfumed Quietus',
      type: 'StartsUsing',
      netRegex: { id: ['A8B7', 'A8CD'], source: 'Zelenia', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'ZeleniaEx Roseblood Bloom A8B9',
      type: 'StartsUsing',
      netRegex: { id: 'A8B9', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Alexandrian Thunder II A8BE',
      type: 'StartsUsing',
      netRegex: { id: 'A8BE', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Alexandrian Thunder II A8BF',
      type: 'StartsUsing',
      netRegex: { id: 'A8BF', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Alexandrian Thunder III',
      type: 'StartsUsing',
      netRegex: { id: ['A8E3', 'A8E4', 'A8E6'], source: 'Zelenia', capture: false },
      suppressSeconds: 5,
      response: Responses.spread(),
    },
    {
      id: 'ZeleniaEx Roseblood: 2nd Bloom AA14',
      type: 'StartsUsing',
      netRegex: { id: 'AA14', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Thunder Slash A8D0',
      type: 'StartsUsing',
      netRegex: { id: 'A8D0', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Thunder Slash A9B8',
      type: 'StartsUsing',
      netRegex: { id: 'A9B8', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Thunder Slash A9B9',
      type: 'StartsUsing',
      netRegex: { id: 'A9B9', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Alexandrian Thunder IV',
      type: 'StartsUsing',
      netRegex: { id: ['A9BA', 'A9BB'], source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Roseblood: 3rd Bloom',
      type: 'StartsUsing',
      netRegex: { id: 'AA15', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Bud of Valor',
      type: 'StartsUsing',
      netRegex: { id: 'A8B2', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Roseblood: 4th Bloom AA16',
      type: 'StartsUsing',
      netRegex: { id: 'AA16', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Encircling Thorns',
      type: 'StartsUsing',
      netRegex: { id: 'A8C3', source: 'Zelenia', capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'ZeleniaEx Alexandrian Banish III',
      type: 'StartsUsing',
      netRegex: { id: 'A8E8', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.stacks!(),
      outputStrings: {
        stacks: {
          en: 'Stacks',
          de: 'Sammeln',
          fr: 'Package',
          cn: '分摊',
          ko: '쉐어',
        },
      },
    },
    {
      id: 'ZeleniaEx Power Break A8B0',
      type: 'StartsUsing',
      netRegex: { id: 'A8B0', source: 'Zelenia\'s Shade', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Power Break A8B1',
      type: 'StartsUsing',
      netRegex: { id: 'A8B1', source: 'Zelenia\'s Shade', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Roseblood: 5th Bloom',
      type: 'StartsUsing',
      netRegex: { id: 'AA17', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Valorous Ascension A8C6',
      type: 'StartsUsing',
      netRegex: { id: 'A8C6', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Valorous Ascension A8C7',
      type: 'StartsUsing',
      netRegex: { id: 'A8C7', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Valorous Ascension A8CA',
      type: 'StartsUsing',
      netRegex: { id: 'A8CA', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Roseblood: 6th Bloom AA18',
      type: 'StartsUsing',
      netRegex: { id: 'AA18', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Holy Hazard A8DF',
      type: 'StartsUsing',
      netRegex: { id: 'A8DF', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Holy Hazard A8E2',
      type: 'StartsUsing',
      netRegex: { id: 'A8E2', source: 'Zelenia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
          de: 'Benutzerdefinierter Text',
          fr: 'Texte personnalisé',
          cn: '自定义文本',
        },
      },
    },
    {
      id: 'ZeleniaEx Escalon Bait Collect',
      type: 'GainsEffect',
      // count: 2F6 = near, 2F7 = far
      netRegex: { effectId: 'B9A', count: ['2F6', '2F7'] },
      preRun: (data, matches) =>
        data.escalonFallBaits.push(matches.count === '2F6' ? 'near' : 'far'),
      suppressSeconds: (data) => data.escalonFallBaits.length > 1 ? 20 : 0,
      infoText: (data, _matches, output) => {
        const [bait1, bait2] = data.escalonFallBaits;
        if (bait1 === undefined || bait2 === undefined)
          return;

        data.escalonFallBaits = [];

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
  ],
};

export default triggerSet;
