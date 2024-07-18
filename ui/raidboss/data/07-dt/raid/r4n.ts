import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

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
      type: 'StartsUsing',
      netRegex: { id: '92AC', source: 'Wicked Thunder', capture: false },
      response: Responses.goWest(),
    },
    {
      id: 'R4N Right Roll',
      type: 'StartsUsing',
      netRegex: { id: '92AB', source: 'Wicked Thunder', capture: false },
      response: Responses.goEast(),
    },
    {
      id: 'R4N Threefold Blast S N S',
      type: 'StartsUsing',
      netRegex: { id: '92AD', source: 'Wicked Thunder', capture: false },
      durationSeconds: 14.4,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'S => N => S',
        },
      },
    },
    {
      id: 'R4N Threefold Blast N S N',
      type: 'StartsUsing',
      netRegex: { id: '92B0', source: 'Wicked Thunder', capture: false },
      durationSeconds: 14.4,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'N => S => N',
        },
      },
    },
    {
      id: 'R4N Fourfold Blast S N N S',
      type: 'StartsUsing',
      netRegex: { id: '9B4F', source: 'Wicked Thunder', capture: false },
      durationSeconds: 18.9,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'S => N => stay N => S',
        },
      },
    },
    {
      id: 'R4N Fourfold Blast N S S N',
      type: 'StartsUsing',
      netRegex: { id: '9B55', source: 'Wicked Thunder', capture: false },
      durationSeconds: 18.9,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'N => S => stay S => N',
        },
      },
    },
    {
      id: 'R4N Bewitching Flight Left Safe',
      type: 'StartsUsing',
      netRegex: { id: '8DE4', source: 'Wicked Thunder', capture: false },
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
      netRegex: { id: '8DE4', source: 'Wicked Replica', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'North offset safe',
        },
      },
    },
    {
      id: 'R4N Bewitching Flight Right Safe',
      type: 'StartsUsing',
      netRegex: { id: '8DE6', source: 'Wicked Thunder', capture: false },
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
      netRegex: { id: '8DE6', source: 'Wicked Replica', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'South offset safe',
        },
      },
    },
    {
      id: 'R4N Fivefold Blast S N S N N',
      type: 'StartsUsing',
      netRegex: { id: '9B56', source: 'Wicked Thunder', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'S => N => S => N, stay N',
        },
      },
    },
    {
      id: 'R4N Fivefold Blast N S N S S',
      type: 'StartsUsing',
      netRegex: { id: '9B57', source: 'Wicked Thunder', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'N => S => N => S, stay S',
        },
      },
    },
  ],
};

export default triggerSet;
