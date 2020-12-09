import Conditions from '../../../../../resources/conditions.js';
import NetRegexes from '../../../../../resources/netregexes.js';
import { Responses } from '../../../../../resources/responses.js';
import ZoneId from '../../../../../resources/zone_id.js';

export default {
  zoneId: ZoneId.EdensPromiseLitanySavage,
  timelineFile: 'e10s.txt',
  triggers: [
    {
      id: 'E10S Deepshadow Nova',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '573E', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '573E', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '573E', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '573E', capture: false }),
      condition: Conditions.caresAboutAOE(),
      response: Responses.aoe(),
    },
    // TODO: back front implosion??
    // 56F0 is be on shadow, 56F3 is be away from shadow
    {
      id: 'E10S Throne Of Shadow',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5717', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5717', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5717', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5717', capture: false }),
      response: Responses.getOut('alert'),
    },
    // TODO: giga slash from shadow
    {
      id: 'E10S Umbra Smash',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5BAA' }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5BAA' }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5BAA' }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5BAA' }),
      condition: Conditions.caresAboutPhysical(),
      response: Responses.tankBusterSwap(),
      run: (data, matches) => {
        data.umbraTarget = matches.target;
      },
    },
    {
      id: 'E10S Darkness Unleashed',
      // Cast on self, with no player target.
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5B0E', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5B0E', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5B0E', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5B0E', capture: false }),
      alertText: (data, _, output) => {
        if (data.me === data.umbraTarget)
          return output.avoidStack();
        return output.stack();
      },
      outputStrings: {
        avoidStack: {
          en: 'Avoid Stack!',
          de: 'Nicht Sammeln!',
        },
        stack: {
          en: 'Stack',
          de: 'Sammeln',
          fr: 'Packez-vous',
          ja: '頭割り',
          cn: '分摊',
          ko: '쉐어뎀',
        },
      },
    },
    {
      id: 'E10S Shadow\'s Edge',
      // Cast on self, with no player target.
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5B0C' }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5B0C' }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5B0C' }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5B0C' }),
      response: Responses.tankCleave(),
    },
    {
      id: 'E10S Shadow Cleave',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5718', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5718', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5718', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5718', capture: false }),
      alertText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Drop Shadow Out',
          de: 'Schatten draußen ablegen',
        },
      },
    },
    {
      // TODO: use headmarkers for this
      id: 'E10S Dualspell 1',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '573A', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '573A', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '573A', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '573A', capture: false }),
      infoText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          en: '1 out, 2+3 in',
          de: '1 raus, 2+3 rein',
        },
      },
    },
    {
      // TODO: use headmarkers for this
      id: 'E10S Dualspell 2',
      netRegex: NetRegexes.ability({ source: 'Shadowkeeper', id: '573A', capture: false }),
      netRegexDe: NetRegexes.ability({ source: 'Schattenkönig', id: '573A', capture: false }),
      netRegexFr: NetRegexes.ability({ source: 'Roi De L\'Ombre', id: '573A', capture: false }),
      netRegexJa: NetRegexes.ability({ source: '影の王', id: '573A', capture: false }),
      infoText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          en: '2 out, 1+3 in',
          de: '2 raus, 1+3 rein',
        },
      },
    },
    {
      // TODO: use headmarkers for this
      id: 'E10S Dualspell 3',
      netRegex: NetRegexes.ability({ source: 'Shadowkeeper', id: '573A', capture: false }),
      netRegexDe: NetRegexes.ability({ source: 'Schattenkönig', id: '573A', capture: false }),
      netRegexFr: NetRegexes.ability({ source: 'Roi De L\'Ombre', id: '573A', capture: false }),
      netRegexJa: NetRegexes.ability({ source: '影の王', id: '573A', capture: false }),
      delaySeconds: 3,
      infoText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          en: '3 out, 1+2 in',
          de: '3 raus, 1+2 rein',
        },
      },
    },
    {
      id: 'E10S Shadowkeeper 1',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5720', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5720', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5720', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5720', capture: false }),
      suppressSeconds: 99999,
      alertText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Drop Shadow Max Melee',
          de: 'Lege den Schatten im max Melee Bereich ab',
        },
      },
    },
    {
      id: 'E10S Swath of Silence',
      netRegex: NetRegexes.startsUsing({ source: 'Shadow Of A Hero', id: '5BBF', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schatten Eines Helden', id: '5BBF', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Ombre De Héros', id: '5BBF', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '英雄の影', id: '5BBF', capture: false }),
      suppressSeconds: 3,
      response: Responses.getUnder(),
    },
    // TODO: giga slash headmarkers? tethers?
    {
      id: 'E10S Distant Scream',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5716', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5716', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5716', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5716', capture: false }),
      response: Responses.knockback('alert'),
    },
    {
      id: 'E10S Umbral Orbs',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5731', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5731', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5731', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5731', capture: false }),
      // TODO: maybe 4?
      delaySeconds: 3.5,
      infoText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Orbs',
          de: 'Orbs',
        },
      },
    },
    {
      id: 'E10S Shadow Warrior',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5739', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5739', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5739', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5739', capture: false }),
      infoText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Watch Tethered Dog',
          de: 'Achte auf den verbundenen Hund',
        },
      },
    },
    {
      id: 'E10S Fade To Shadow',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '572B', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '572B', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '572B', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '572B', capture: false }),
      delaySeconds: 4,
      infoText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          // TODO: this could be better if we knew where the shadow was
          // TODO: this also happens twice, with tethers
          en: 'Be On Squiggles',
          de: 'Sei auf dem Kringel',
        },
      },
    },
    {
      id: 'E10S Cloak of Shadows 1',
      netRegex: NetRegexes.ability({ source: 'Shadowkeeper', id: '5B13', capture: false }),
      netRegexDe: NetRegexes.ability({ source: 'Schattenkönig', id: '5B13', capture: false }),
      netRegexFr: NetRegexes.ability({ source: 'Roi De L\'Ombre', id: '5B13', capture: false }),
      netRegexJa: NetRegexes.ability({ source: '影の王', id: '5B13', capture: false }),
      delaySeconds: 4,
      infoText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          // TODO: this could be better if we knew where the shadow was
          en: 'Away From Squiggles',
          de: 'Weg vom Kringel',
        },
      },
    },
    // TODO: could use giga slash "get in" here for four slashes
    {
      id: 'E10S Voidgate',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5734', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5734', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5734', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5734', capture: false }),
      infoText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Cleaves with towers',
          de: 'Cleaves mit Türmen',
        },
      },
    },
    {
      id: 'E10S Voidgate Second Tower',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5734', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5734', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5734', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5734', capture: false }),
      delaySeconds: 23.3,
      infoText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Towers first, then cleaves',
          de: 'Zuerst Türme, dann cleaves',
        },
      },
    },
    {
      // TODO: use a headmarker here
      id: 'E10S Pitch Bog',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5721', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5721', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5721', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5721', capture: false }),
      infoText: (data, _, output) => {
        if (data.seenPitchBog)
          return data.secondPitchBog();
        return data.firstPitchBog();
      },
      run: (data) => data.seenPitchBog = true,
      outputStrings: {
        firstPitchBog: {
          en: 'Puddles outside',
          de: 'Flächen nach draußen',
        },
        secondPitchBog: {
          en: 'Puddles on intercardinals',
          de: 'Flächen interkardinal ablegen',
        },
      },
    },
    {
      // TODO: use a tether line for this, and use a12s output strings
      id: 'E10S Shackled Apart',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5BAC', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5BAC', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5BAC', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5BAC', capture: false }),
      infoText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Far Tethers',
          de: 'Entfernte Verbindung',
        },
      },
    },
    {
      // TODO: use a tether line for this, and use a12s output strings
      // TODO: this doesn't hit everybody
      id: 'E10S Shackled Together',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '572E', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '572E', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '572E', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '572E', capture: false }),
      infoText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Close Tethers',
          de: 'Nahe Verbindung',
        },
      },
    },
    {
      // TODO: this mechanic needs a lot more love
      id: 'E10S Voidgate Amplifier',
      netRegex: NetRegexes.startsUsing({ source: 'Shadowkeeper', id: '5BCF', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ source: 'Schattenkönig', id: '5BCF', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ source: 'Roi De L\'Ombre', id: '5BCF', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ source: '影の王', id: '5BCF', capture: false }),
      infoText: (data, _, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Pick up Puddles',
          de: 'Fläche nehmen',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Shadowkeeper': 'Schattenkönig',
        'Shadow Of A Hero': 'Schatten eines Helden',
        'Shadefire': 'Schattenfeuer',
      },
      'replaceText': {
        'Deepshadow Nova': 'Dunkelschatten-Nova',
        'Implosion': 'Implosion',
        'Throne Of Shadow': 'Schattenthron',
        'Giga Slash': 'Giga-Schlag',
        'Umbra Smash': 'Schattenschlag',
        'Darkness Unleashed': 'Schattenentfesselung',
        'Shadow\'s Edge': 'Schattenhieb',
        'Shadow Cleave': 'Schattenpein',
        'Dualspell': 'Doppelzauber',
        'Blighting Blitz': 'Vernichtungsaktion',
        'Shadowkeeper': 'Schattenkönig',
        'Swath Of Silence': 'Schwade der Stille',
        'Shadow Servant': 'Schattendiener',
        'Distant Scream': 'Ferner Schrei',
        'Umbral Orbs': 'Schattenkugel',
        'Flameshadow': 'Schattenflamme',
        'Spawn Shadow': 'Schattenerscheinung',
        'Shadow Warrior': 'Schattenkrieger',
        'Fade To Shadow': 'Schattenimmersion',
        'Cloak Of Shadows': 'Mantel des Schattens',
        'Voidgate(?! Amplifier)': 'Nichtsportal',
        'Void Pulse': 'Nichtspulsieren',
        'Pitch Bog': 'Schattensumpf',
        'Shackled Apart': 'Kettenbruch',
        'Voidgate Amplifier': 'Verstärktes Nichtsportal',
        'Shadowy Eruption': 'Schatteneruption',
        'Shackled Together': 'Schattenfesseln',
        'Doom Arc': 'Verhängnisvoller Bogen',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Shadowkeeper': 'Ordre royal',
        'Shadow Of A Hero': 'ombre de héros',
        'Shadefire': 'Feu ombral',
      },
      'replaceText': {
        'Deepshadow Nova': 'Nova de la pleine-ombre',
        'Implosion': 'Implosion',
        'Throne Of Shadow': 'Trône de l\'Ombre',
        'Giga Slash': 'Taillade tournoyante',
        'Umbra Smash': 'Fracas ombral',
        'Darkness Unleashed': 'Déchaînement ombral',
        'Shadow\'s Edge': 'Taillade ombrale',
        'Shadow Cleave': 'Fendoir ombral',
        'Dualspell': 'Double sort',
        'Blighting Blitz': 'Frappe putréfiante',
        'Shadowkeeper': 'Ordre royal',
        'Swath Of Silence': 'Fauchage silencieux',
        'Shadow Servant': 'Serviteur de l\'Ombre',
        'Distant Scream': 'Hurlement de l\'Ombre',
        'Umbral Orbs': 'Orbe ombrale',
        'Flameshadow': 'Flamme ombrale',
        'Spawn Shadow': 'Ombres croissantes',
        'Shadow Warrior': 'Ombre du roi',
        'Fade To Shadow': 'Immersion abyssale',
        'Cloak Of Shadows': 'Cape de l\'Ombre',
        'Voidgate(?! Amplifier)': 'Porte du néant',
        'Void Pulse': 'Pulsation du néant',
        'Pitch Bog': 'Marais ombral',
        'Shackled Apart': 'Chaînes de rupture',
        'Voidgate Amplifier': 'Porte du néant amplifiée',
        'Shadowy Eruption': 'Éruption ombrale',
        'Shackled Together': 'Chaînes d\'union',
        'Doom Arc': 'Arc fatal',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Shadowkeeper': '影の王命',
        'Shadow Of A Hero': '英雄の影',
        'Shadefire': 'シャドウファイア',
      },
      'replaceText': {
        'Deepshadow Nova': 'ディープシャドウノヴァ',
        'Implosion': 'インプロージョン',
        'Throne Of Shadow': '影の王権',
        'Giga Slash': 'ギガスラッシュ',
        'Umbra Smash': 'アンブラスマッシュ',
        'Darkness Unleashed': 'シャドウアンリーシュ',
        'Shadow\'s Edge': 'シャドウスラッシュ',
        'Shadow Cleave': 'シャドウクリーヴ',
        'Dualspell': 'ダブルスペル',
        'Blighting Blitz': 'ブライティングブリッツ',
        'Shadowkeeper': '影の王命',
        'Swath Of Silence': 'サイレントスアス',
        'Shadow Servant': '影の従僕',
        'Distant Scream': '影の遠吠え',
        'Umbral Orbs': 'アンブラルオーブ',
        'Flameshadow': 'シャドウフレイム',
        'Spawn Shadow': 'スポーンシャドウ',
        'Shadow Warrior': '影武者',
        'Fade To Shadow': '影潜り',
        'Cloak Of Shadows': 'クローク・オブ・シャドウ',
        'Voidgate(?! Amplifier)': 'ヴォイドゲート',
        'Void Pulse': 'ヴォイドパルセーション',
        'Pitch Bog': 'シャドウスワンプ',
        'Shackled Apart': '離別の鎖',
        'Voidgate Amplifier': 'ヴォイドゲート・アンプリファイア',
        'Shadowy Eruption': 'シャドウエラプション',
        'Shackled Together': '束縛の鎖',
        'Doom Arc': 'ドゥームアーク',
      },
    },
  ],
};