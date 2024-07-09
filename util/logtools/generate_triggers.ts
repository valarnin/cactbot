import fs from 'fs';
import readline from 'readline';

import argparse, { Namespace } from 'argparse';
import inquirer from 'inquirer';

import NetRegexes from '../../resources/netregexes';
import ZoneId from '../../resources/zone_id';
import { CactbotRegExpExecArray } from '../../types/net_trigger';

import { EncounterCollector, ignoredCombatants } from './encounter_tools';

// How long (in ms) for a line to be offset based on encounter start
// to be considered the same instance across encounters
const timeOffsetAllowance = 2000;

const triggerSuggestOptions = [
  'AoE',
  'Donut (in)',
  'Plus (out intercards)',
  'Circle (out)',
  'Away from Front (cone)',
  'Tankbuster',
  'Custom Separate',
  'Custom Joined',
  'Skip',
] as const;

type XIVAPIAbilityResponse = {
  schema: string;
  rows: {
    row_id: number;
    fields: {
      CastType: number;
      EffectRange: number;
      Omen: {
        row_id: number;
        fields: {
          LargeScale: boolean;
          Path: string;
          PathAlly: string;
          RestrictYScale: boolean;
          Type: number;
        };
      };
      XAxisModifier: number;
    };
  }[];
};

type XIVAPILockonResponse = {
  schema: string;
  rows: {
    row_id: number;
    fields: {
      Unknown0: string;
    };
  }[];
};

type TriggerSuggestTypes = typeof triggerSuggestOptions[number];

type GenerateTriggersArgs = {
  'files': string[] | null;
  'zone_id': string | null;
  'trigger_id_prefix': string | null;
  'ignore_id': string[] | null;
  'only_combatants': string[] | null;
  'track_mapeffect': boolean | null;
  'track_battletalk2': boolean | null;
  'track_npcyell': boolean | null;
  'track_actorsetpos': boolean | null;
  'first_headmarker_id': string | null;
  'generate_notes': boolean | null;
};

class ExtendedArgsRequired extends Namespace implements GenerateTriggersArgs {
  'files': string[] | null;
  'zone_id': string | null;
  'trigger_id_prefix': string | null;
  'ignore_id': string[] | null;
  'only_combatants': string[] | null;
  'track_mapeffect': boolean | null;
  'track_battletalk2': boolean | null;
  'track_npcyell': boolean | null;
  'track_actorsetpos': boolean | null;
  'first_headmarker_id': string | null;
  'generate_notes': boolean | null;
}

// TODO: Should we track 'NetworkEffectResult' here as well? There's no `NetRegexes` matcher for it,
// but it could be useful for snapshot vs visual effect difference information.
type AbilityInfo = CactbotRegExpExecArray<
  'StartsUsing' | 'Ability' | 'NetworkAOEAbility' | 'StartsUsingExtra' | 'AbilityExtra'
>;

type HeadMarkerInfo = CactbotRegExpExecArray<'HeadMarker'>;

type MapEffectInfo = CactbotRegExpExecArray<'MapEffect'>;

type BattleTalk2Info = CactbotRegExpExecArray<'BattleTalk2'>;

type NpcYellInfo = CactbotRegExpExecArray<'NpcYell'>;

type ActorSetPosInfo = CactbotRegExpExecArray<'ActorSetPos'>;

type TriggerInfo = {
  start: string;
  duration: number;
  abilities: { [id: string]: AbilityInfo[] };
  headMarkers: { [id: string]: HeadMarkerInfo[] };
  mapEffects?: { [location: string]: MapEffectInfo[] };
  battleTalk2s?: { [id: string]: BattleTalk2Info[] };
  npcYells?: { [id: string]: NpcYellInfo[] };
  actorSetPoses?: { [id: string]: ActorSetPosInfo[] };
};

type AbilityNameMapInfo = {
  name: string;
  ids: string[];
  offsets: number[];
  fights: {
    start: string;
    instances: AbilityInfo[];
  }[];
};

type MapEffectMapInfo = {
  byOffset: {
    offset: number;
    entries: {
      location: string;
      flags: string;
    }[];
  }[];
};

type HeadMarkerMapInfo = {
  byOffset: {
    offset: number;
    vfx: string[];
  }[];
};

type ExtendedArgs = Partial<ExtendedArgsRequired>;

class GenerateTriggersArgParse {
  parser = new argparse.ArgumentParser({
    addHelp: true,
  });
  requiredGroup = this.parser.addMutuallyExclusiveGroup();
}

const timelineParse = new GenerateTriggersArgParse();

timelineParse.parser.addArgument(['--files', '-f'], {
  nargs: '+',
  help: 'Files to scan for zones and encounters.',
});

timelineParse.parser.addArgument(['--zone_id', '-z'], {
  nargs: '?',
  help: 'The zone ID, by name, that should be used. e.g. "ContainmentBayS1T7"',
});

timelineParse.parser.addArgument(['--trigger_id_prefix', '-tp'], {
  nargs: '?',
  help: 'The prefix to use for auto-generated triggers, e.g. "Sephirot"',
});

timelineParse.parser.addArgument(['--ignore_id', '-ii'], {
  nargs: '+',
  help: 'Ability IDs to ignore, e.g. 27EF',
});

timelineParse.parser.addArgument(['--only_combatants', '-o'], {
  nargs: '+',
  help: 'Only include actions from combatants from this list, e.g. "Sephirot"',
});

timelineParse.parser.addArgument(['--track_mapeffect', '-tm'], {
  nargs: '?',
  help: 'Track "MapEffect" lines and generate a mapping table',
});

timelineParse.parser.addArgument(['--track_battletalk2', '-tb'], {
  nargs: '?',
  help: 'Track "BattleTalk2" lines and generate a mapping table',
});

timelineParse.parser.addArgument(['--track_npcyell', '-tn'], {
  nargs: '?',
  help: 'Track "NpcYell" lines and generate a mapping table',
});

timelineParse.parser.addArgument(['--track_actorsetpos', '-ta'], {
  nargs: '?',
  help: 'Track "ActorSetPos" lines and generate a mapping table',
});

timelineParse.parser.addArgument(['--first_headmarker_id', '-hm'], {
  nargs: '?',
  help: 'Specify the first headmarker\'s VFX for randomized headmarkers',
});

timelineParse.parser.addArgument(['--generate_notes', '-gn'], {
  nargs: '?',
  help: 'Generate extended notes and statistics',
});

const printHelpAndExit = (errString: string): void => {
  console.error(errString);
  timelineParse.parser.printHelp();
  process.exit(-1);
};

const validateArgs = (args: ExtendedArgs): void => {
  const hasFile = Array.isArray(args.files) && args.files.length > 0 && args.files[0] !== '';
  const hasZoneId = typeof args.zone_id === 'string' && args?.zone_id !== '';

  if (!hasFile)
    printHelpAndExit('Error: specify at least one file\n');

  if (!hasZoneId)
    printHelpAndExit('Error: Must specify a zone ID to use\n');

  if (!((args.zone_id ?? '') in ZoneId))
    printHelpAndExit('Error: Zone ID specified must exist in "resources/zone_id.ts"\n');

  if (hasFile) {
    for (const file of args.files ?? []) {
      if (!file.includes('.log'))
        printHelpAndExit('Error: Must specify an FFXIV ACT log file, as log.log\n');
    }
  }

  if (typeof args.trigger_id_prefix !== 'string' || args.trigger_id_prefix === '') {
    args['trigger_id_prefix'] = args.zone_id;
  }

  if (args.track_mapeffect === null)
    args['track_mapeffect'] = true;
  if (args.track_battletalk2 === null)
    args['track_battletalk2'] = true;
  if (args.track_npcyell === null)
    args['track_npcyell'] = true;
  if (args.track_actorsetpos === null)
    args['track_actorsetpos'] = true;
};

const makeCollectorFromFiles = async (
  files: string[],
  zoneId: string,
) => {
  const collector = new EncounterCollector();
  const zoneIdHex = ZoneId[zoneId as keyof typeof ZoneId]?.toString(16).toUpperCase() ?? '';

  for (const fileName of files) {
    const file = readline.createInterface({
      input: fs.createReadStream(fileName),
    });
    let inZone = false;
    for await (const line of file) {
      if (line.startsWith('01|')) {
        const parts = line.split('|');
        inZone = parts[2] === zoneIdHex;
      }
      if (inZone)
        collector.process(line, true);
    }
    file.close();
  }
  return collector;
};

const ignoreAbilityEntry = (
  matches: CactbotRegExpExecArray<
    'StartsUsing' | 'Ability' | 'NetworkAOEAbility' | 'StartsUsingExtra' | 'AbilityExtra'
  >,
  args: ExtendedArgs,
): boolean => {
  const abilityId = matches.groups?.id ?? '';
  const abilityName = matches.groups?.ability ?? '';
  const combatant = matches.groups?.source ?? '';
  const combatantId = matches.groups?.sourceId ?? '';
  // Ignore auto-attacks named "attack"
  if (
    abilityName?.toLowerCase() === 'attack' || abilityName === '攻撃' ||
    abilityName?.startsWith('unknown_')
  )
    return true;

  // Ignore abilities from players
  if (combatantId.startsWith('1'))
    return true;

  // Ignore abilities from NPC allies.
  // If a no-name combatant, we will ignore only if its also an unnamed ability, as
  // a named ability has more potential for being relevant to timeline/trigger creation.
  if (ignoredCombatants.includes(combatant) && combatant !== '')
    return true;
  if (combatant === '') {
    if (
      abilityName === undefined ||
      abilityName === '' ||
      abilityName?.toLowerCase().includes('--sync--')
    )
      return true;
  }

  // Ignore abilities by ID
  if (abilityId !== undefined && args.ignore_id?.includes(abilityId))
    return true;

  // If only-combatants was specified, ignore all combatants not in the list.
  if (args.only_combatants && !args.only_combatants?.includes(combatant))
    return true;
  return false;
};

const makeTriggerInfoFromCollector = (collector: EncounterCollector, args: ExtendedArgs) => {
  const triggerInfo: TriggerInfo[] = [];

  const startsUsingMatcher = NetRegexes.startsUsing({ capture: true });
  const networkAOEAbilityMatcher = NetRegexes.ability({ capture: true });
  const startsUsingExtraMatcher = NetRegexes.startsUsingExtra({ capture: true });
  const abilityExtraMatcher = NetRegexes.abilityExtra({ capture: true });
  const headMarkerMatcher = NetRegexes.headMarker({ capture: true });
  const mapEffectMatcher = NetRegexes.mapEffect({ capture: true });
  const battleTalk2Matcher = NetRegexes.battleTalk2({ capture: true });
  const npcYellMatcher = NetRegexes.npcYell({ capture: true });
  const actorSetPosMatcher = NetRegexes.actorSetPos({ capture: true });

  for (const fight of collector.fights) {
    // No log lines means we skip the fight
    if (!((fight.logLines?.length ?? 0) > 0))
      continue;

    const startTimestamp = fight.startLine?.split('|')[1] ?? '';
    const endTimestamp = fight.logLines?.slice(-1)[0] ?? '';
    const fightInfo: TriggerInfo = {
      start: fight.startLine?.split('|')[1] ?? '',
      duration: new Date(endTimestamp).getTime() - new Date(startTimestamp).getTime(),
      abilities: {},
      headMarkers: {},
    };

    if (args.track_mapeffect)
      fightInfo.mapEffects = {};

    if (args.track_battletalk2)
      fightInfo.battleTalk2s = {};

    if (args.track_npcyell)
      fightInfo.npcYells = {};

    if (args.track_actorsetpos)
      fightInfo.actorSetPoses = {};

    let haveLineMatch = false;
    for (const line of fight.logLines ?? []) {
      // Check for ability-related lines

      // For `StartsUsing` lines, we'll initialize the entry if needed
      // Other ability lines will skip if there's not a `StartsUsing` line
      // This pre-filters out abilities that don't have a castbar
      const startsUsing = startsUsingMatcher.exec(line);
      if (startsUsing !== null) {
        const id = startsUsing.groups?.id ?? '';
        if (ignoreAbilityEntry(startsUsing, args))
          continue;

        haveLineMatch = true;
        (fightInfo.abilities[id] ??= []).push(startsUsing);
        continue;
      }
      const networkAOEAbility = networkAOEAbilityMatcher.exec(line);
      if (networkAOEAbility !== null) {
        const id = networkAOEAbility.groups?.id ?? '';
        if (fightInfo.abilities[id] === undefined)
          continue;
        if (ignoreAbilityEntry(networkAOEAbility, args))
          continue;

        haveLineMatch = true;
        fightInfo.abilities[id]?.push(networkAOEAbility);
        continue;
      }
      const startsUsingExtra = startsUsingExtraMatcher.exec(line);
      if (startsUsingExtra !== null) {
        const id = startsUsingExtra.groups?.id ?? '';
        if (fightInfo.abilities[id] === undefined)
          continue;
        if (ignoreAbilityEntry(startsUsingExtra, args))
          continue;

        haveLineMatch = true;
        fightInfo.abilities[id]?.push(startsUsingExtra);
        continue;
      }
      const abilityExtra = abilityExtraMatcher.exec(line);
      if (abilityExtra !== null) {
        const id = abilityExtra.groups?.id ?? '';
        if (fightInfo.abilities[id] === undefined)
          continue;
        if (ignoreAbilityEntry(abilityExtra, args))
          continue;

        haveLineMatch = true;
        fightInfo.abilities[id]?.push(abilityExtra);
        continue;
      }

      const headMarker = headMarkerMatcher.exec(line);
      if (headMarker !== null) {
        const id = headMarker.groups?.id ?? '';

        haveLineMatch = true;
        (fightInfo.headMarkers[id] ??= []).push(headMarker);
        continue;
      }

      // For the rest, only check if we're looking for them

      if (args.track_mapeffect) {
        const mapEffect = mapEffectMatcher.exec(line);
        if (mapEffect !== null) {
          haveLineMatch = true;
          const location = mapEffect.groups?.location ?? '';
          if (fightInfo.mapEffects === undefined)
            continue;
          (fightInfo.mapEffects[location] ??= []).push(mapEffect);
          continue;
        }
      }

      if (args.track_battletalk2) {
        const battleTalk2 = battleTalk2Matcher.exec(line);
        if (battleTalk2 !== null) {
          haveLineMatch = true;
          const id = battleTalk2.groups?.id ?? '';
          if (fightInfo.battleTalk2s === undefined)
            continue;
          (fightInfo.battleTalk2s[id] ??= []).push(battleTalk2);
          continue;
        }
      }

      if (args.track_npcyell) {
        const npcYell = npcYellMatcher.exec(line);
        if (npcYell !== null) {
          haveLineMatch = true;
          const id = npcYell.groups?.id ?? '';
          if (fightInfo.npcYells === undefined)
            continue;
          (fightInfo.npcYells[id] ??= []).push(npcYell);
          continue;
        }
      }

      if (args.track_actorsetpos) {
        const actorSetPos = actorSetPosMatcher.exec(line);
        if (actorSetPos !== null) {
          haveLineMatch = true;
          const id = actorSetPos.groups?.id ?? '';
          if (fightInfo.actorSetPoses === undefined)
            continue;
          (fightInfo.actorSetPoses[id] ??= []).push(actorSetPos);
          continue;
        }
      }
    }

    if (haveLineMatch)
      triggerInfo.push(fightInfo);
  }

  return triggerInfo;
};

const generateFileFromTriggerInfo = async (triggerInfo: TriggerInfo[], args: ExtendedArgs) => {
  let preText = '';

  // Handle pre-TriggerSet text

  if (args.track_mapeffect) {
    // Calculate instances
    const mapEffectMap: MapEffectMapInfo = {
      byOffset: [],
    };

    for (const fight of triggerInfo) {
      for (const [location, instances] of Object.entries(fight.mapEffects ?? [])) {
        for (const instance of instances) {
          const instanceOffset = new Date(instance.groups?.timestamp ?? '').getTime() -
            new Date(fight.start).getTime();
          let byOffsetEntry = mapEffectMap.byOffset
            .find((entry) => Math.abs(entry.offset - instanceOffset) < timeOffsetAllowance);
          if (byOffsetEntry === undefined) {
            byOffsetEntry = {
              entries: [],
              offset: instanceOffset,
            };
            mapEffectMap.byOffset.push(byOffsetEntry);
          }

          byOffsetEntry.entries.push({ flags: instance.groups?.flags ?? '', location: location });
        }
      }
    }

    if (mapEffectMap.byOffset.length > 0) {
      preText += `

const mapEffectData = {`;

      const allLocations = [
        ...new Set(
          mapEffectMap.byOffset.flatMap((entry) =>
            entry.entries.map((subEntry) => subEntry.location)
          ),
        ),
      ].sort();

      for (const location of allLocations) {
        const allOffsets = [
          ...new Set(
            mapEffectMap.byOffset
              .filter((entry) => entry.entries.find((subEntry) => subEntry.location === location))
              .map((entry) => entry.offset),
          ),
        ].sort();
        const allFlags = [
          ...new Set(
            mapEffectMap.byOffset
              .filter((entry) => entry.entries.find((subEntry) => subEntry.location === location))
              .flatMap((entry) => entry.entries.map((subEntry) => subEntry.flags)),
          ),
        ].sort();
        preText += `
  // Offsets: ${allOffsets.join()}
  '${location}': {
    'location': '${location}',`;

        for (let i = 0; i < allFlags.length; ++i) {
          const flags = allFlags[i] ?? '';
          const flagOffsets = [
            ...new Set(
              mapEffectMap.byOffset
                .filter((entry) => entry.entries.find((subEntry) => subEntry.flags === flags))
                .map((entry) => entry.offset),
            ),
          ].sort();
          const flagsKey = flags.match(/^0*?800040*?$/) ? `'clear${i}'` : `'flags${i}'`;
          preText += `
    // Offsets: ${flagOffsets.join()}
    ${flagsKey}: '${flags}',`;
        }

        preText += `
  },
`;
      }

      preText += `} as const;
`;
    }
  }

  const headMarkerMap: HeadMarkerMapInfo = {
    byOffset: [],
  };

  for (const fight of triggerInfo) {
    const firstHeadmarker = Object.values(fight.headMarkers)
      .flatMap((instances) => instances)
      .sort((left, right) =>
        left.groups?.timestamp.localeCompare(right.groups?.timestamp ?? '') ?? 0
      )[0];

    if (firstHeadmarker === undefined)
      continue;

    const headmarkerOffset = parseInt(firstHeadmarker.groups?.id ?? '0', 16) -
      parseInt(args.first_headmarker_id ?? firstHeadmarker.groups?.id ?? '0', 16);
    for (const [id, instances] of Object.entries(fight.headMarkers)) {
      for (const instance of instances) {
        const instanceOffset = new Date(instance.groups?.timestamp ?? '').getTime() -
          new Date(fight.start).getTime();
        let byOffsetEntry = headMarkerMap.byOffset
          .find((entry) => Math.abs(entry.offset - instanceOffset) < timeOffsetAllowance);
        if (byOffsetEntry === undefined) {
          byOffsetEntry = {
            vfx: [],
            offset: instanceOffset,
          };
          headMarkerMap.byOffset.push(byOffsetEntry);
        }

        byOffsetEntry.vfx.push((parseInt(id, 16) - headmarkerOffset).toString(16).toUpperCase());
      }
    }
  }

  if (headMarkerMap.byOffset.length > 0) {
    preText += `

const headMarkerData = {
`;

    const allHeadmarkers = [
      ...new Set(
        headMarkerMap.byOffset.flatMap((entry) => entry.vfx),
      ),
    ].sort();

    const xivapiHeadMarkerInfo: XIVAPILockonResponse | undefined = await (await fetch(
      `https://beta.xivapi.com/api/1/sheet/Lockon?rows=${
        allHeadmarkers.map((hm) => parseInt(hm, 16).toString()).join(',')
      }&fields=Unknown0`,
    )).json() as XIVAPILockonResponse;

    // https://beta.xivapi.com/api/1/sheet/Lockon?rows=79&fields=Unknown0
    for (const headmarker of allHeadmarkers) {
      const allOffsets = [
        ...new Set(
          headMarkerMap.byOffset
            .filter((entry) => entry.vfx.find((subEntry) => subEntry === headmarker))
            .map((entry) => entry.offset),
        ),
      ].sort();
      preText += `  // Offsets: ${allOffsets.join()}
  // Vfx Path: ${
        xivapiHeadMarkerInfo?.rows.find((row) => row.row_id === parseInt(headmarker, 16))?.fields
          .Unknown0 ?? 'Unknown'
      }
  '${headmarker}': '${headmarker}',
`;
    }

    preText += `} as const;
`;
  }

  let triggersText = '';

  const longestFight = triggerInfo.sort((left, right) => left.duration - right.duration)[0];

  if (longestFight === undefined)
    return '';

  const abilitiesByName: AbilityNameMapInfo[] = [];

  for (const fight of triggerInfo) {
    for (const [id, instances] of Object.entries(fight.abilities)) {
      const abilityName = instances[0]?.groups?.ability ?? '';
      // Collect by name
      let mapInfo = abilitiesByName.find((info) => info.name === abilityName);

      if (mapInfo === undefined) {
        mapInfo = {
          name: abilityName,
          fights: [],
          ids: [],
          offsets: [],
        };
        abilitiesByName.push(mapInfo);
      }

      mapInfo.ids = [...new Set([...mapInfo.ids, id])]
        .sort((left, right) => parseInt(left, 16) - parseInt(right, 16));

      let mapInfoFight = mapInfo.fights.find((mFight) => mFight.start === fight.start);

      if (mapInfoFight === undefined) {
        mapInfoFight = {
          start: fight.start,
          instances: [],
        };
        mapInfo.fights.push(mapInfoFight);
      }

      mapInfoFight.instances = [...new Set([...mapInfoFight.instances, ...instances])]
        .sort((left, right) =>
          left.groups?.timestamp.localeCompare(right.groups?.timestamp ?? '') ?? 0
        );

      // Calculate instances
      for (const instance of instances) {
        // Only consider StartsUsing lines
        if (instance.groups?.type !== '20')
          continue;
        const instanceOffset = new Date(instance.groups?.timestamp ?? '').getTime() -
          new Date(fight.start).getTime();
        let newOffset = true;
        for (const pfOffset of mapInfo.offsets) {
          if (Math.abs(instanceOffset - pfOffset) < timeOffsetAllowance) {
            newOffset = false;
            break;
          }
        }
        if (newOffset) {
          mapInfo.offsets.push(instanceOffset);
        }
      }
    }
  }

  const xivapiAbilityInfo: XIVAPIAbilityResponse | undefined = await (await fetch(
    `https://beta.xivapi.com/api/1/sheet/Action?rows=${
      [...new Set(abilitiesByName.flatMap((entry) => entry.ids))].sort().map((id) =>
        parseInt(id, 16).toString()
      ).join(',')
    }&fields=CastType,EffectRange,Omen,XAxisModifier`,
  )).json() as XIVAPIAbilityResponse;

  for (const mapInfo of abilitiesByName) {
    const abilityName = mapInfo.name;
    const instances = mapInfo.fights.flatMap((fight) => fight.instances);
    const abilityLineTypes = [...new Set(instances.map((instance) => instance.groups?.type ?? ''))];

    let suggestedOperation: TriggerSuggestTypes = 'Skip';

    const hitAPlayer = mapInfo.fights
      .find((fight) =>
        fight.instances.find((instance) => (instance.groups?.targetId ?? '').startsWith('1'))
      );

    // TODO: More default suggestions. Figure out how things work for square (CastType=12)
    // vs left/right/etc positioning
    const castTypeSuggestions = new Set<TriggerSuggestTypes>();
    const castTypeFullSuggestions = new Set<TriggerSuggestTypes | string>();
    if (xivapiAbilityInfo !== undefined) {
      const xivApiAbilities = mapInfo.fights
        .flatMap((fight) => fight.instances.filter((instance) => instance.groups?.type === '20'))
        .map((instance) =>
          xivapiAbilityInfo.rows
            .find((row) => row.row_id === parseInt(instance.groups?.id ?? '0', 16))
        );

      // Loop through the abilities we have info for, apply a suggested operation.
      for (const abilityInfo of xivApiAbilities) {
        if (abilityInfo === undefined)
          continue;
        switch (abilityInfo.fields.CastType) {
          case 2: // Circle
          case 5: // Circle, size modified by hitbox
            // If the effect range is massive (greater than 35y), and it's a circle
            // then it's actually a raidwide
            if (abilityInfo.fields.EffectRange >= 35) {
              castTypeSuggestions.add('AoE');
              castTypeFullSuggestions.add(
                `AoE (circle, range = ${abilityInfo.fields.EffectRange})`,
              );
            }
            castTypeSuggestions.add('Circle (out)');
            castTypeFullSuggestions.add('Circle (out)');
            break;
          case 3: // Cone, size modified by hitbox
          case 13: // Cone
            castTypeSuggestions.add('Away from Front (cone)');
            castTypeFullSuggestions.add('Away from Front (cone)');
            break;
          case 4: // Rectangle, size modified by hitbox
          case 12: // Rectangle
          case 8: // Charging rectangle
            castTypeSuggestions.add('Custom Separate');
            castTypeFullSuggestions.add(`Rectangle AoE, CastType = ${abilityInfo.fields.CastType}`);
            break;
          case 10: // Donut
            castTypeSuggestions.add('Donut (in)');
            castTypeFullSuggestions.add('Donut (in)');
            break;
          case 11: // Plus
            castTypeSuggestions.add('Custom Joined');
            castTypeFullSuggestions.add(`Plus AoE`);
            break;
        }
      }
    }

    if (castTypeSuggestions.size !== 0) {
      // Just apply the first entry in the set
      suggestedOperation = [...castTypeSuggestions][0] ?? 'Skip';
    } else {
      if (abilityLineTypes.includes('22') && abilityLineTypes.includes('21')) {
        // Sometimes hits, sometimes doesn't, this is probably a dodgeable mechanic
        suggestedOperation = 'Custom Joined';
      } else if (abilityLineTypes.includes('21') && hitAPlayer) {
        // Never hits more than 1 person, but has hit a person
        // Also has a cast bar, this is probably a dodgeable mechanic
        suggestedOperation = 'Custom Joined';
      } else if (abilityLineTypes.includes('21')) {
        // Has a cast bar, finished casting, never hit a player.
        suggestedOperation = 'Skip';
      } else {
        // Cast, and always hits multiple
        suggestedOperation = 'AoE';
      }
    }

    const result = await inquirer.prompt<{ action: TriggerSuggestTypes | null }>([
      {
        type: 'list',
        name: 'action',
        message: `Ability Information:
Name: ${abilityName},
IDs: ${mapInfo.ids.join(', ')},
Sources: ${
          [
            ...new Set(mapInfo.fights.flatMap((fight) =>
              fight.instances.map((instance) => instance.groups?.source ?? '')
            )),
          ].sort().join(', ')
        },
Line Types: ${abilityLineTypes.sort().join(', ')},
Line Count: ${instances.length},
Offsets: ${mapInfo.offsets.sort().join(', ')},
CastInfo Hints: ${[...castTypeFullSuggestions].join(', ')}
`,
        choices: triggerSuggestOptions.map((e) => {
          return {
            name: e,
            value: e,
          };
        }),
        default: suggestedOperation,
      },
    ]);

    switch (result.action) {
      case 'AoE':
        triggersText += `
    {
      id: '${args.trigger_id_prefix ?? ''} ${abilityName}',
      type: 'StartsUsing',
      netRegex: { id: '${mapInfo.ids.join('|').toUpperCase()}', source: '${
          mapInfo.fights[0]?.instances[0]?.groups?.source ?? 'MISSING SOURCE'
        }', capture: false },
      response: Responses.aoe(),
    },`;
        break;
      case 'Donut (in)':
        triggersText += `
    {
      id: '${args.trigger_id_prefix ?? ''} ${abilityName}',
      type: 'StartsUsing',
      netRegex: { id: '${mapInfo.ids.join('|').toUpperCase()}', source: '${
          mapInfo.fights[0]?.instances[0]?.groups?.source ?? 'MISSING SOURCE'
        }', capture: false },
      response: Responses.getUnder(),
    },`;
        break;
      case 'Plus (out intercards)':
        // TODO: We should probably have this as a `Responses` option,
        // but that's beyond the scope of this PR
        triggersText += `
    {
      id: '${args.trigger_id_prefix ?? ''} ${abilityName}',
      type: 'StartsUsing',
      netRegex: { id: '${mapInfo.ids.join('|').toUpperCase()}', source: '${
          mapInfo.fights[0]?.instances[0]?.groups?.source ?? 'MISSING SOURCE'
        }', capture: false },
      infoText: (_data, _matches, output) => output.intercards!(),
      outputStrings: {
        intercards: {
          en: 'Intercards',
          de: 'Interkardinal',
          fr: 'Intercardinal',
          ja: '斜めへ',
          cn: '四角',
          ko: '대각선 쪽으로',
        },
      },
    },`;
        break;
      case 'Circle (out)':
        triggersText += `
    {
      id: '${args.trigger_id_prefix ?? ''} ${abilityName}',
      type: 'StartsUsing',
      netRegex: { id: '${mapInfo.ids.join('|').toUpperCase()}', source: '${
          mapInfo.fights[0]?.instances[0]?.groups?.source ?? 'MISSING SOURCE'
        }', capture: false },
      response: Responses.getOut(),
    },`;
        break;
      case 'Away from Front (cone)':
        triggersText += `
    {
      id: '${args.trigger_id_prefix ?? ''} ${abilityName}',
      type: 'StartsUsing',
      netRegex: { id: '${mapInfo.ids.join('|').toUpperCase()}', source: '${
          mapInfo.fights[0]?.instances[0]?.groups?.source ?? 'MISSING SOURCE'
        }', capture: false },
      response: Responses.awayFromFront(),
    },`;
        break;
      case 'Tankbuster':
        triggersText += `
    {
      id: '${args.trigger_id_prefix ?? ''} ${abilityName}',
      type: 'StartsUsing',
      netRegex: { id: '${mapInfo.ids.join('|').toUpperCase()}', source: '${
          mapInfo.fights[0]?.instances[0]?.groups?.source ?? 'MISSING SOURCE'
        }', capture: false },
      response: Responses.tankBuster(),
    },`;
        break;
      case 'Custom Joined':
        triggersText += `
    {
      id: '${args.trigger_id_prefix ?? ''} ${abilityName}',
      type: 'StartsUsing',
      netRegex: { id: '${mapInfo.ids.join('|').toUpperCase()}', source: '${
          mapInfo.fights[0]?.instances[0]?.groups?.source ?? 'MISSING SOURCE'
        }', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
        },
      },
    },`;
        break;
      case 'Custom Separate':
        for (const id of mapInfo.ids) {
          triggersText += `
    {
      id: '${args.trigger_id_prefix ?? ''} ${abilityName} ${id}',
      type: 'StartsUsing',
      netRegex: { id: '${id.toUpperCase()}', source: '${
            mapInfo.fights[0]?.instances[0]?.groups?.source ?? 'MISSING SOURCE'
          }', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Custom Text',
        },
      },
    },`;
        }
        break;
    }
  }

  return `// Auto-generated with:
// ${process.argv.join(' ')}
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;${preText}
const triggerSet: TriggerSet<RaidbossData> = {
  id: '${args.zone_id ?? ''}',
  zoneId: ZoneId.${args.zone_id ?? ''},
  timelineFile: '???.txt',
  triggers: [${triggersText}
  ]
};

export default triggerSet;
`;
};

const generateTriggers = async () => {
  const args: ExtendedArgs = new ExtendedArgsRequired({});
  timelineParse.parser.parseArgs(undefined, args);
  validateArgs(args);

  let triggersFile = '';

  if (Array.isArray(args.files) && args.files.length > 0) {
    const collector = await makeCollectorFromFiles(args.files ?? [], args.zone_id ?? '');
    const triggerInfo = makeTriggerInfoFromCollector(collector, args);
    triggersFile = await generateFileFromTriggerInfo(triggerInfo, args);
  }

  // Use process.stdout.write to avoid truncation from console.log
  process.stdout.write(triggersFile);

  process.exit(0);
};

void generateTriggers();
