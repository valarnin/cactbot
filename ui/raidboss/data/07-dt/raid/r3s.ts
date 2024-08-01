import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const headMarkerData = {
  // Offsets: 15872,172895
  // Vfx Path: com_share6_5s0c
  tankBuster: '01D3',
} as const;

const triggerSet: TriggerSet<Data> = {
  id: 'AacLightHeavyweightM3Savage',
  zoneId: ZoneId.AacLightHeavyweightM3Savage,
  timelineFile: 'r3s.txt',
  triggers: [
    {
      id: 'R3S Headmarker Tankbuster',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.tankBuster, capture: true },
      response: Responses.tankBuster(),
    },
    {
      id: 'R3S Brutal Impact',
      type: 'StartsUsing',
      netRegex: { id: '9425', source: 'Brute Bomber', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R3S Octuple Lariat Out',
      type: 'StartsUsing',
      netRegex: { id: '93D8', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out + Spread',
        },
      },
    },
    {
      id: 'R3S Octuple Lariat In',
      type: 'StartsUsing',
      netRegex: { id: '93D9', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'In + Spread',
        },
      },
    },
    {
      id: 'R3S Octoboom Dive Proximity',
      type: 'StartsUsing',
      netRegex: { id: '93DE', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Away + Spread',
        },
      },
    },
    {
      id: 'R3S Octoboom Dive Knockback',
      type: 'StartsUsing',
      netRegex: { id: '93DF', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback + Spread',
        },
      },
    },
    {
      id: 'R3S Murderous Mist',
      type: 'StartsUsing',
      netRegex: { id: '93FE', source: 'Brute Bomber', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'R3S Quadroboom Dive Proximity',
      type: 'StartsUsing',
      netRegex: { id: '93E0', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Away + Partners',
        },
      },
    },
    {
      id: 'R3S Quadroboom Dive Knockback',
      type: 'StartsUsing',
      netRegex: { id: '93E1', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback + Partners',
        },
      },
    },
    {
      id: 'R3S Quadruple Lariat Out',
      type: 'StartsUsing',
      netRegex: { id: '93DA', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out + Partners',
        },
      },
    },
    {
      id: 'R3S Quadruple Lariat In',
      type: 'StartsUsing',
      netRegex: { id: '93DB', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'In + Partners',
        },
      },
    },
    {
      id: 'R3S Short Fuse',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB8', capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Short Fuse',
        },
      },
    },
    {
      id: 'R3S Long Fuse',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB9', capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Long Fuse',
        },
      },
    },
  ],
};

export default triggerSet;
