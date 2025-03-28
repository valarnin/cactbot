import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  witchHuntBaits: ('near' | 'far')[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'RecollectionExtreme',
  zoneId: ZoneId.RecollectionExtreme,
  timelineFile: 'zelenia-ex.txt',
  initData: () => ({
    witchHuntBaits: [],
  }),
  triggers: [
    {
      id: 'ZeleniaEx Escalon Bait Collect',
      type: 'GainsEffect',
      // count: 2F6 = near, 2F7 = far
      netRegex: { effectId: 'B9A', count: ['2F6', '2F7'] },
      preRun: (data, matches) => data.witchHuntBaits.push(matches.count === '2F6' ? 'near' : 'far'),
      suppressSeconds: (data) => data.witchHuntBaits.length > 1 ? 20 : 0,
      infoText: (data, _matches, output) => {
        const [bait1, bait2] = data.witchHuntBaits;
        if (bait1 === undefined || bait2 === undefined)
          return;

        data.witchHuntBaits = [];

        if (bait1 === bait2) {
          return output.swapAfterFirst!();
        }
        return output.swapAfterSecond!();
      },
      outputStrings: {
        swapAfterFirst: {
          en: 'Swap after first+third',
        },
        swapAfterSecond: {
          en: 'Swap after second',
        },
      },
    },
  ],
};

export default triggerSet;
