import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

const effectB9AMap = {
  orangeDiamondFront: '2D3',
  blueCircleBack: '2D4',
} as const;

type B9AMapKeys = keyof typeof effectB9AMap;
type B9AMapValues = typeof effectB9AMap[B9AMapKeys];

export interface Data extends RaidbossData {
  expectedBlasts: 3 | 4 | 5;
  storedBlasts: B9AMapValues[];
}

const b9aValueToNorthSouth = (
  searchValue: B9AMapValues | undefined,
): 'north' | 'south' | 'unknown' => {
  if (searchValue === effectB9AMap.blueCircleBack) {
    return 'north';
  } else if (searchValue === effectB9AMap.orangeDiamondFront) {
    return 'south';
  }

  return 'unknown';
};

const isEffectB9AValue = (value: string | undefined): value is B9AMapValues => {
  if (value === undefined)
    return false;
  return Object.values<string>(effectB9AMap).includes(value);
};

// TODO: Map out MapEffect data if needed? Might be useful for prep for savage.
// TODO: Better triggers for Sidewise Spark. Some sort of phase detection and collect setup is needed
// as well as identifying the clones based on npc ID or something
// TODO: Same thing for Bewitching Flight, collector for the loop to combine trigger with clone
// TODO: Witch Hunt, determine starting point and figure out how to word the dodge

// TODO: Might be able to use these to detect phase push, I didn't look into it very much
const npcYellData = {
  // Offsets: 456920,494045,510794
  '43D4': {
    'yellId': '43D4',
    'text': 'M-My body...',
    'npcIds': ['3301'],
  },
  // Offsets: 482233,519355,536125
  '43D5': {
    'yellId': '43D5',
    'text': 'Ugh... How is this possible...?',
    'npcIds': ['3301'],
  },
  // Offsets: 507543,544663,561452,569975,595291
  '43D7': {
    'yellId': '43D7',
    'text': '<pant> <pant>',
    'npcIds': ['3301'],
  },
} as const;
console.assert(npcYellData);

const headMarkerData = {
  // Vfx Path: com_share3t
  stack: '00A1',
  // Vfx Path: com_share5a1
  multiHitStack: '013C',
  // Vfx Path: tag_ae5m_8s_0v
  spread: '0159',
  // Vfx Path: tank_laser_5sec_lockon_c0a1
  tankBusterLine: '01D7',
} as const;
console.assert(headMarkerData);

const triggerSet: TriggerSet<Data> = {
  id: 'AacLightHeavyweightM4',
  zoneId: ZoneId.AacLightHeavyweightM4,
  timelineFile: 'r4n.txt',
  initData: () => ({
    expectedBlasts: 3,
    storedBlasts: [],
  }),
  triggers: [
    {
      id: 'R4N Headmarker Soaring Soulpress Stack',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.stack, capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R4N Headmarker Wicked Bolt Multi Hit Stack',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.multiHitStack, capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R4N Headmarker Thunderstorm Spread',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.spread, capture: false },
      suppressSeconds: 5,
      response: Responses.spread(),
    },
    {
      id: 'R4N Headmarker Wicked Jolt Tankbuster',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.tankBusterLine, capture: true },
      response: Responses.tankBuster(),
    },
    {
      id: 'R4N Wrath of Zeus',
      type: 'StartsUsing',
      netRegex: { id: '92C7', source: 'Wicked Thunder', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R4N Sidewise Spark Go Left',
      type: 'StartsUsing',
      netRegex: { id: ['92BC', '92BE'], source: 'Wicked Thunder', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'R4N Sidewise Spark Go Right',
      type: 'StartsUsing',
      netRegex: { id: ['92BD', '92BF'], source: 'Wicked Thunder', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'R4N Left Roll',
      type: 'Ability',
      netRegex: { id: '92AC', source: 'Wicked Thunder', capture: false },
      response: Responses.goWest(),
    },
    {
      id: 'R4N Right Roll',
      type: 'Ability',
      netRegex: { id: '92AB', source: 'Wicked Thunder', capture: false },
      response: Responses.goEast(),
    },
    {
      id: 'R4N Threefold Blast Initializer',
      type: 'StartsUsing',
      netRegex: { id: ['92AD', '92B0'], source: 'Wicked Thunder', capture: false },
      run: (data) => data.expectedBlasts = 3,
    },
    {
      id: 'R4N Fourfold Blast Initializer',
      type: 'StartsUsing',
      netRegex: { id: ['9B4F', '9B55'], source: 'Wicked Thunder', capture: false },
      run: (data) => data.expectedBlasts = 4,
    },
    {
      id: 'R4N Fivefold Blast Initializer',
      type: 'StartsUsing',
      netRegex: { id: ['9B56', '9B57'], source: 'Wicked Thunder', capture: false },
      run: (data) => data.expectedBlasts = 5,
    },
    {
      id: 'R4N XFold Blast Collector',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A', count: Object.values(effectB9AMap), capture: true },
      condition: (data, matches) => {
        const count = matches.count;

        if (!isEffectB9AValue(count))
          return false;
        data.storedBlasts.push(count);

        return data.storedBlasts.length >= data.expectedBlasts;
      },
      durationSeconds: (data) => {
        if (data.expectedBlasts === 3)
          return 14.4;
        if (data.expectedBlasts === 4)
          return 18.9;
        return 23.2;
      },
      infoText: (data, _matches, output) => {
        const expectedBlasts = data.expectedBlasts;
        data.expectedBlasts = 3;
        const storedBlasts = data.storedBlasts;
        data.storedBlasts = [];
        switch (expectedBlasts) {
          case 3:
            return output.three!({
              first: b9aValueToNorthSouth(storedBlasts[0]),
              second: b9aValueToNorthSouth(storedBlasts[1]),
              third: b9aValueToNorthSouth(storedBlasts[2]),
            });
          case 4:
            return output.four!({
              first: b9aValueToNorthSouth(storedBlasts[0]),
              second: b9aValueToNorthSouth(storedBlasts[1]),
              third: b9aValueToNorthSouth(storedBlasts[2]),
              fourth: b9aValueToNorthSouth(storedBlasts[3]),
            });
          case 5:
            return output.five!({
              first: b9aValueToNorthSouth(storedBlasts[0]),
              second: b9aValueToNorthSouth(storedBlasts[1]),
              third: b9aValueToNorthSouth(storedBlasts[2]),
              fourth: b9aValueToNorthSouth(storedBlasts[3]),
              fifth: b9aValueToNorthSouth(storedBlasts[5]),
            });
          default:
            return output.unknown!();
        }
      },
      outputStrings: {
        south: Outputs.south,
        north: Outputs.north,
        unknown: Outputs.unknown,
        three: {
          en: '${first} => ${second} => ${third}',
        },
        four: {
          en: '${first} => ${second} => ${third} => ${fourth}',
        },
        five: {
          en: '${first} => ${second} => ${third} => ${fourth} => ${fifth}',
        },
      },
    },
    {
      id: 'R4N Bewitching Flight Right Safe',
      type: 'StartsUsing',
      netRegex: { id: '8DE4', source: 'Wicked Thunder', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'East offset safe',
        },
      },
    },
    {
      id: 'R4N Bewitching Flight South Safe',
      type: 'StartsUsing',
      netRegex: { id: '8DE4', source: 'Wicked Replica', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'South offset safe',
        },
      },
    },
    {
      id: 'R4N Bewitching Flight Left Safe',
      type: 'StartsUsing',
      netRegex: { id: '8DE6', source: 'Wicked Thunder', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'West offset safe',
        },
      },
    },
    {
      id: 'R4N Bewitching Flight North Safe',
      type: 'StartsUsing',
      netRegex: { id: '8DE6', source: 'Wicked Replica', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'North offset safe',
        },
      },
    },
  ],
};

export default triggerSet;
