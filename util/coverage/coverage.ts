import contentList from '../../resources/content_list';
import ContentType from '../../resources/content_type';
import { isLang, Lang, langMap, langToLocale, languages } from '../../resources/languages';
import { UnreachableCode } from '../../resources/not_reached';
import ZoneInfo from '../../resources/zone_info';
import { LocaleObject, LocaleText } from '../../types/trigger';
import { kDirectoryToCategory, kPrefixToCategory } from '../../ui/config/config';
import { MissingTranslationErrorType } from '../find_missing_translations';

import {
  Coverage,
  CoverageEntry,
  CoverageTotalEntry,
  CoverageTotals,
  TranslationTotals,
} from './coverage.d';
import { coverage, coverageTotals, pulls, tags, translationTotals } from './coverage_report';

import './coverage.css';

const emptyTotal: CoverageTotalEntry = {
  raidboss: 0,
  oopsy: 0,
  total: 0,
};

const translationKeyMap: Record<MissingTranslationErrorType, LocaleText> = {
  sync: {
    en: 'Sync',
  },
  code: {
    en: 'Code',
  },
  other: {
    en: 'Other',
  },
  replaceSection: {
    en: 'Replace Section',
  },
  text: {
    en: 'Text',
  },
};

const isTranslationKeyMap = (key: string): key is MissingTranslationErrorType => {
  return key in translationKeyMap;
};

// TODO: make it possible to click on a zone row and highlight/link to it.
type exKeys = Exclude<keyof typeof kPrefixToCategory, '00-misc' | 'user'>;

const exVersionToDirName: readonly exKeys[] = [
  '02-arr',
  '03-hw',
  '04-sb',
  '05-shb',
  '06-ew',
  '07-dt',
] as const;

const exVersionToShortName: Record<exKeys | '00-misc', LocaleText> = {
  '00-misc': {
    en: 'Misc',
  },
  '02-arr': {
    en: 'ARR',
    de: 'ARR',
    fr: 'ARR',
    ja: '新生',
    cn: '2.X',
    ko: '신생',
  },
  '03-hw': {
    en: 'HW',
    de: 'HW',
    fr: 'HW',
    ja: '蒼天',
    cn: '3.X',
    ko: '창천',
  },
  '04-sb': {
    en: 'SB',
    de: 'SB',
    fr: 'SB',
    ja: '紅蓮',
    cn: '4.X',
    ko: '홍련',
  },
  '05-shb': {
    en: 'ShB',
    de: 'ShB',
    fr: 'ShB',
    ja: '漆黒',
    cn: '5.X',
    ko: '칠흑',
  },
  '06-ew': {
    en: 'EW',
    de: 'EW',
    fr: 'EW',
    ja: '暁月',
    cn: '6.X',
    ko: '효월',
  },
  '07-dt': {
    en: 'DT',
    de: 'DT',
    fr: 'DT',
    ja: '黄金',
    cn: '7.X',
    ko: '황금',
  },
};

const contentTypeToLabel: {
  [contentType: number]: {
    full: LocaleText;
    short: LocaleText;
  };
} = {
  [ContentType.Raids]: {
    full: kDirectoryToCategory.raid,
    short: {
      en: 'Raid',
      de: 'Raid',
      fr: 'Raid',
      ja: 'レイド',
      cn: '大型任务',
      ko: '레이드',
    },
  },
  [ContentType.Trials]: {
    full: kDirectoryToCategory.trial,
    short: {
      en: 'Trial',
      de: 'Prfng',
      fr: 'Défi',
      ja: '討伐戦',
      cn: '讨伐战',
      ko: '토벌전',
    },
  },
  [ContentType.UltimateRaids]: {
    full: kDirectoryToCategory.ultimate,
    short: {
      en: 'Ult',
      de: 'Ult',
      fr: 'Fatal',
      ja: '絶',
      cn: '绝境战',
      ko: '절',
    },
  },
  [ContentType.Dungeons]: {
    full: kDirectoryToCategory.dungeon,
    short: {
      en: 'Dgn',
      de: 'Dgn',
      fr: 'Donjon',
      ja: 'ID',
      cn: '迷宫挑战',
      ko: '던전',
    },
  },
  [ContentType.VCDungeonFinder]: {
    full: {
      en: 'Variant & Criterion Dungeon',
    },
    short: {
      en: 'V&C',
      de: 'Gewölbesuche',
      fr: 'Donjon V&C',
      ja: 'ヴァリアント&アナザーダンジョン',
      cn: '多变&异闻迷宫',
      ko: '변형&파생던전',
    },
  },
  [ContentType.ChaoticAllianceRaid]: {
    full: {
      en: 'Chaotic Alliance Raid',
    },
    short: {
      en: 'Chaotic',
      fr: 'Chaotique',
    },
  },
  [ContentType.TheMaskedCarnivale]: {
    full: {
      en: 'The Masked Carnivale',
    },
    short: {
      en: 'BLU',
    },
  },
  [ContentType.Eureka]: {
    full: {
      en: 'Eureka',
    },
    short: {
      en: 'Eureka',
    },
  },
  [ContentType.SaveTheQueen]: {
    full: {
      en: 'Save The Queen',
    },
    short: {
      en: 'Bozja',
    },
  },
  [ContentType.DisciplesOfTheLand]: {
    full: {
      en: 'Ocean Fishing/Diadem',
    },
    short: {
      en: 'Diadem',
    },
  },
  [ContentType.TreasureHunt]: {
    full: {
      en: 'Treasure Hunt',
    },
    short: {
      en: 'Maps',
    },
  },
  [ContentType.DeepDungeons]: {
    full: {
      en: 'Deep Dungeons',
    },
    short: {
      en: 'DD',
    },
  },
  [ContentType.Pvp]: {
    full: {
      en: 'PvP',
    },
    short: {
      en: 'PvP',
    },
  },
} as const;

const contentTypeLabelOrder = [
  ContentType.UltimateRaids,
  ContentType.Raids,
  ContentType.Trials,
  ContentType.Dungeons,
] as const;

// This is also the order of the table columns.
const zoneGridHeaders = {
  name: {
    en: 'Name',
    de: 'Name',
    fr: 'Nom',
    ja: '名前',
    cn: '名称',
    ko: '이름',
  },
  triggers: {
    en: 'Triggers',
    de: 'Triggers',
    fr: 'Triggers',
    ja: 'トリガー',
    cn: '触发器',
    ko: '트리거',
  },
  timeline: {
    en: 'Timeline',
    de: 'Timeline',
    fr: 'Timeline',
    ja: 'タイムライン',
    cn: '时间轴',
    ko: '타임라인',
  },
  oopsy: {
    en: 'Oopsy',
    de: 'Oopsy',
    fr: 'Oopsy',
    ja: 'Oopsy',
    cn: '犯错监控',
    ko: 'Oopsy',
  },
  translated: {
    en: 'Translated',
    de: 'Übersetzt',
    fr: 'Traduit',
    ja: '翻訳済',
    cn: '已翻译',
    ko: '번역됨',
  },
  releaseVersion: {
    en: 'Version',
  },
  comments: {
    en: 'Comments',
  },
} as const;

const miscStrings = {
  // Title at the top of the page.
  title: {
    en: 'Cactbot Content Coverage',
    de: 'Cactbot Inhaltsabdeckung',
    fr: 'Contenus présents dans Cactbot',
    ja: 'Cactbot コンテンツ完成度',
    cn: 'Cactbot 内容覆盖率',
    ko: 'Cactbot 컨텐츠 커버리지',
  },
  // Overall label for the expansion table.
  overall: {
    en: 'Overall',
    de: 'Insgesamt',
    fr: 'Total',
    ja: '概要',
    cn: '总览',
    ko: '전체',
  },
  // Oopsy label for the expansion table.
  oopsy: {
    ...zoneGridHeaders.oopsy,
  },
  // Description about release and latest version differences.
  description: {
    en:
      'This list may contain content that is in development and is not yet included in the latest cactbot release. Anything that is listed as covered here will be included in the next release of cactbot.  If you are using the <a href="https://github.com/OverlayPlugin/cactbot/blob/main/CONTRIBUTING.md#validating-changes-via-remote-urls">overlayplugin.github.io version</a> as the url for your overlays, this list will be up to date.',
    de:
      'Diese Liste kann Inhalte enthalten, welche momentan in Entwicklung sind uns sich noch nicht im aktuellstem Cactbot Release befinden. Alles was hier aufgelistet ist, wird sich im nächsten Release von Cactbot befinden. Wenn du <a href="https://github.com/OverlayPlugin/cactbot/blob/main/CONTRIBUTING.md#validating-changes-via-remote-urls">overlayplugin.github.io version</a> als URL für dein Overlay benutzt, sind die Inhalte in dieser Liste bereits für dich verfügbar.',
    fr:
      'Cette liste peut contenir du contenu en cours de développement et qui n\'est pas encore inclus dans la dernière version de cactbot. Tout ce qui est répertorié comme couvert ici, sera inclus dans la prochaine version de cactbot. Si vous utilisez la <a href="https://github.com/OverlayPlugin/cactbot/blob/main/CONTRIBUTING.md#validating-changes-via-remote-urls">version overlayplugin.github.io</a > comme url pour vos overlays, cette liste sera à jour.',
    ja:
      'このリストは開発中機能や最新リリースバージョンに公開されていないコンテンツを含まれています。リストに含まれているコンテンツは次バージョンに公開される予定があります。また、OverlayPluginのURL欄に<a href="https://github.com/OverlayPlugin/cactbot/blob/main/CONTRIBUTING.md#validating-changes-via-remote-urls">「overlayplugin.github.io」のページのURL</a>を入力している場合はこのリストに含まれているコンテンツと一致し、すべてのコンテンツを使えるようになります。',
    cn:
      '该列表中可能存在正在开发中的功能及未发布在cactbot最新发行版中的更新内容。该列表中显示的更新将会在下一个版本的cactbot发行版中发布。若您在OverlayPlugin中使用的是<a href="https://github.com/OverlayPlugin/cactbot/blob/main/CONTRIBUTING.md#validating-changes-via-remote-urls">「overlayplugin.github.io」开头的URL</a>，则更新进度与该列表一致，即该列表中的所有内容均可用。',
    ko:
      '이 목록에는 아직 개발 중인 컨텐츠가 포함되어 있을 수 있고 최신 cactbot 릴리즈에 포함되어 있지 않을 수 있습니다. 여기에 나열된 컨텐츠 목록은 최소한 다음 릴리즈에는 포함되게 됩니다. 만약 <a href="https://github.com/OverlayPlugin/cactbot/blob/main/CONTRIBUTING.md#validating-changes-via-remote-urls">overlayplugin.github.io 버전</a>을 오버레이 url로 연결해서 사용하고 계시다면, 이 목록이 오버레이의 컨텐츠 커버리지와 일치합니다.',
  },
  // Warning when generator hasn't been run.
  runGenerator: {
    en: 'Error: Run npm run coverage-report to generate data.',
    de: 'Error: Führe npm run coverage-report aus um die Daten zu generieren.',
    fr: 'Erreur : Lancez npm run coverage-report pour générer des données.',
    ja: 'エラー：npm run coverage-report を実行し、データを生成しよう。',
    cn: '错误：请先运行 npm run coverage-report 以生成数据。',
    ko: '에러: 데이터를 생성하려면 node npm run coverage-report를 실행하세요.',
  },
  // Indicator that content is unsupported
  unsupported: {
    en: 'Unsupported',
  },
  // Indicator that content has not had a release yet
  unreleased: {
    en: 'Unreleased',
  },
  // Prefix for hover text of release version column
  mergeDate: {
    en: 'Merge Date: ',
  },
  // Prefix for hover text of release version column
  releaseDate: {
    en: 'Release Date: ',
  },
  raidbossTriggerCount: {
    en: 'Raidboss Trigger Count',
  },
  oopsyTriggerCount: {
    en: 'Oopsy Trigger Count',
  },
  none: {
    en: 'None',
  },
  otherContentType: {
    en: 'Other Content',
  },
  changesSinceLastRelease: {
    en: 'Changes since last release',
  },
  timelineEntries: {
    en: 'Timeline Entries',
  },
  timelineDuration: {
    en: 'Timeline Duration',
  },
  noTranslationInformation: {
    en: 'No Translation Information',
  },
} as const;

const translationGridHeaders = {
  language: {
    en: 'Translations',
    de: 'Übersetzungen',
    fr: 'Traductions',
    ja: '翻訳',
    cn: '翻译',
    ko: '번역',
  },
  coverage: {
    en: 'Coverage',
    de: 'Abdeckung',
    fr: 'Couvert',
    ja: '適用範囲',
    cn: '覆盖率',
    ko: '커버리지',
  },
  errors: {
    en: 'Errors',
    de: 'Fehler',
    fr: 'Erreurs',
    ja: 'エラー',
    cn: '错误',
    ko: '오류',
  },
  missingFiles: {
    en: 'Missing',
    de: 'Fehlend',
    fr: 'Manquant',
    ja: '欠落',
    cn: '缺失',
    ko: '누락됨',
  },
  url: {
    en: 'Link to Missing Translation List',
    de: 'Link zur Liste mit den fehlenden Übersetzungen',
    fr: 'Lien vers la liste des traductions manquantes',
    ja: '欠落している翻訳のリストへのリンク',
    cn: '缺失翻译表链接',
    ko: '번역 누락 리스트 링크',
  },
} as const;

const translate = <T>(object: LocaleObject<T>, lang: Lang): T => {
  return object[lang] ?? object.en;
};

const buildExpansionTable = (container: HTMLElement, lang: Lang, totals: CoverageTotals) => {
  // @TODO: The previous implementation of this table/grid had all cells except the
  // expansion name cells styled with `justify-self: right`, which did not work
  // Should we add the `text-end` class to "fix" this "bug"?

  // Header
  // Blank, `Overall`
  let headerCells = `<th></th><th>${translate(miscStrings.overall, lang)}</th>`;
  for (const contentType of contentTypeLabelOrder) {
    const label = contentTypeToLabel[contentType]?.short;
    const text = label !== undefined ? translate(label, lang) : undefined;
    headerCells += `<th>${text}</th>`;
  }
  headerCells += `<th>${translate(miscStrings.oopsy, lang)}</th>`;
  container.appendChild(templateHtmlToDom(`
<thead>
  <tr>${headerCells}</tr>
</thead>
`));

  // Body
  let tableRows = '';
  // By expansion.
  for (const exKey of exVersionToDirName) {
    let rowCells = '';
    const name = kPrefixToCategory[exKey];
    const exIndex = exVersionToDirName.indexOf(exKey);
    const expansionName = translate(name, lang);
    rowCells += `<th>${expansionName}</th>`;

    const versionInfo = totals.byExpansion[exIndex];
    const overall = versionInfo?.overall ?? emptyTotal;
    rowCells += `<td>${overall.raidboss} / ${overall.total}</td>`;

    for (const contentType of contentTypeLabelOrder) {
      const accum: CoverageTotalEntry = versionInfo?.byContentType[contentType] ?? emptyTotal;
      const text = accum.total ? `${accum.raidboss} / ${accum.total}` : '';
      rowCells += `<td>${text}</td>`;
    }

    rowCells += `<td>${overall.oopsy} / ${overall.total}</td>`;
    tableRows += `<tr>${rowCells}</tr>`;
  }

  // Totals.
  let rowCells = `<td></td><td>${totals.overall.raidboss} / ${totals.overall.total}</td>`;
  for (const contentType of contentTypeLabelOrder) {
    const accum = totals.byContentType[contentType] ?? emptyTotal;
    const text = accum.total ? `${accum.raidboss} / ${accum.total}` : '';
    rowCells += `<td>${text}</td>`;
  }
  rowCells += `<td>${totals.overall.oopsy} / ${totals.overall.total}</td>`;
  tableRows += `<tr>${rowCells}</tr>`;

  container.appendChild(templateHtmlToDom(`<tbody>${tableRows}</tbody>`));
};

const buildTranslationTable = (
  container: HTMLElement,
  thisLang: Lang,
  translationTotals: TranslationTotals,
) => {
  // Header
  let headerCells = '';
  for (const header of Object.values(translationGridHeaders))
    headerCells += `<th>${translate(header, thisLang) ?? ''}</th>`;
  container.appendChild(templateHtmlToDom(`
<thead>
  <tr>${headerCells}</tr>
</thead>
`));

  // Body
  let tableRows = '';
  for (const lang of languages) {
    if (lang === 'en')
      continue;

    const url = `missing_translations_${lang}.html`;
    const aHref = `<a href="${url}">${url}</a>`;

    const langTotals = translationTotals[lang];

    tableRows += `
<tr>
  <th>${translate(langMap, thisLang)[lang] ?? ''}</th>
  <td>${langTotals.translatedFiles} / ${langTotals.totalFiles}</td>
  <td>${langTotals.errors}</td>
  <td>${langTotals.missingFiles === 0 ? '' : langTotals.missingFiles}</td>
  <td>${aHref}</td>
</tr>`;
  }

  container.appendChild(templateHtmlToDom(`<tbody>${tableRows}</tbody>`));
};

const templateHtmlToDom = (template: string) => {
  const templateElem = document.createElement('template');
  templateElem.innerHTML = template.trim();
  const result = templateElem.content.firstChild;
  if (result === null)
    throw new Error('Invalid template markup');
  return result;
};

const buildZoneTableHeader = (container: HTMLElement, lang: Lang) => {
  let cells = '';

  for (const [key, header] of Object.entries(zoneGridHeaders)) {
    cells += `<th id="zone-table-header-${key}">${translate(header, lang)}</th>`;
  }
  const headerRow = templateHtmlToDom(`<thead><tr id="zone-table-header-row">${cells}</tr></th>`);
  container.appendChild(headerRow);
};

const notUndefined = <T>(v: T | undefined): v is T => v !== undefined;

const buildZoneTableContentRow = (
  zoneId: number,
  exDirName: exKeys | '00-misc',
  zone: (typeof ZoneInfo)[number],
  container: HTMLElement,
  lang: Lang,
  coverage: Coverage,
) => {
  const zoneCoverage: CoverageEntry = coverage[zoneId] ?? {
    oopsy: { num: 0 },
    triggers: { num: 0 },
    timeline: {},
    files: [],
    lastModified: 0,
    allTags: [],
    openPRs: [],
    comments: [],
  };
  const openPRs = zoneCoverage.openPRs
    .map((prNum) => pulls.find((pr) => pr.number === prNum))
    .filter(notUndefined);
  const allTags = zoneCoverage.allTags
    .map((tagName) => tags[tagName])
    .filter(notUndefined);

  const version = allTags?.[0];

  const unreleased = version?.tagName === undefined ||
    (version?.tagDate ?? 0) < zoneCoverage.lastModified;

  const hasOopsy = zoneCoverage.oopsy && zoneCoverage.oopsy.num > 0;
  const hasTriggers = zoneCoverage.triggers.num > 0;

  const unsupported = !hasTriggers && !hasOopsy && !zoneCoverage.timeline.hasFile &&
    openPRs.length === 0;

  let name = translate(zoneCoverage.label ?? zone.name, lang);
  name = name.replace('<Emphasis>', '<i>');
  name = name.replace('</Emphasis>', '</i>');

  // Build in order of zone grid headers, so the headers can be rearranged
  // and the data will follow.
  const headerFuncs: Record<keyof typeof zoneGridHeaders, () => string> = {
    name: () => {
      // Add some hidden text to allow searching by expansion or content type
      let hiddenText = '';
      const exShortName = exVersionToShortName[exDirName];
      if (exShortName !== undefined) {
        hiddenText += `${translate(exShortName, lang)} `;
      }
      const exLongName = kPrefixToCategory[exDirName];
      if (exLongName !== undefined) {
        hiddenText += `${translate(exLongName, lang)} `;
      }
      const contentTypeShort = zone.contentType !== undefined
        ? contentTypeToLabel[zone.contentType]?.short
        : undefined;
      if (contentTypeShort !== undefined) {
        hiddenText += `${translate(contentTypeShort, lang)} `;
      }
      const contentTypeLong = zone.contentType !== undefined
        ? contentTypeToLabel[zone.contentType]?.full
        : undefined;
      if (contentTypeLong !== undefined) {
        hiddenText += `${translate(contentTypeLong, lang)} `;
      }

      return `<td class="zone-table-name"><span style="display:none">${hiddenText.trim()}</span>${name}</td>`;
    },
    triggers: () => {
      const emoji = zoneCoverage.triggers.num > 0 ? '✔️' : '';
      return `<td class="emoji zone-table-triggers">${emoji}</td>`;
    },
    timeline: () => {
      let emoji = '';
      if (zoneCoverage.timeline.hasNoTimeline)
        emoji = '➖';
      else if (zoneCoverage.timeline.timelineNeedsFixing)
        emoji = '⚠️';
      else if (zoneCoverage.timeline.hasFile)
        emoji = '✔️';

      return `<td class="emoji zone-table-timeline">${emoji}</td>`;
    },
    oopsy: () => {
      const emoji = zoneCoverage.oopsy && zoneCoverage.oopsy.num > 0 ? '✔️' : '';
      return `<td class="emoji zone-table-oopsy">${emoji}</td>`;
    },
    translated: () => {
      let emoji = '';

      const translations = zoneCoverage.translations?.[lang];

      if (lang === 'en') {
        emoji = '';
      } else if (translations === undefined) {
        emoji = '✔️';
      } else {
        const isMissingSync = translations.sync !== undefined && translations.sync > 0;

        let totalMissing = 0;
        for (const value of Object.values(translations))
          totalMissing += value;

        // Missing a sync translation means that triggers or timelines won't work properly
        // and so count as "not being translated at all". If all syncs are translated but
        // there are missing timeline texts or output strings, that's a "partial" translation
        // given the warning sign.
        if (totalMissing === 0)
          emoji = '✔️';
        else if (!isMissingSync)
          emoji = '⚠️';
      }

      return `<td class="emoji zone-table-translated">${emoji}</td>`;
    },
    releaseVersion: () => {
      if (unsupported) {
        return `<td class="zone-table-releaseVersion table-danger"><span>${
          translate(miscStrings.unsupported, lang)
        }</span></td>`;
      }

      let color = 'table-success';

      if (unreleased || openPRs.length > 0) {
        color = 'table-warning';
      }

      const displayText = version?.tagName ?? translate(miscStrings.unreleased, lang);

      return `<td class="zone-table-releaseVersion ${color}"><span>${displayText}</span></td>`;
    },
    comments: () => {
      const comments = zoneCoverage.comments;
      let text = '';
      if (comments.length > 1) {
        text = `<span class="comment">${
          comments
            .map((c) => translate(c, lang))
            .join('</span><span class="comment">')
        }</span>`;
      } else if (comments.length === 1) {
        const comment = comments[0];
        text = comment ? translate(comment, lang) : '';
      }
      return `<td class="zone-table-comments">${text}</td>`;
    },
  };

  let cells = '';
  for (const func of Object.values(headerFuncs))
    cells += func();

  const id = `zone-table-content-${zoneId}-${
    name.replaceAll(/[^a-zA-Z0-9 ]/g, '').replaceAll(' ', '_')
  }`;

  const contentRow = templateHtmlToDom(`\
<tr id="${id}" class="zone-table-content-row" \
data-bs-toggle="collapse" data-bs-target="#data-${id}" \
aria-expanded="false" aria-controls="data-${id}">${cells}</tr>`);
  container.appendChild(contentRow);

  const detailsColumn = `
      <div class="col">
        <table class="table table-striped">
          <tr><th>${
    translate(miscStrings.raidbossTriggerCount, lang)
  }:</th><td>${zoneCoverage.triggers.num}</td></tr>
          <tr><th>${translate(miscStrings.oopsyTriggerCount, lang)}:</th><td>${
    zoneCoverage.oopsy?.num ?? 0
  }</td></tr>
          <tr><th>${translate(miscStrings.timelineEntries, lang)}:</th><td>${
    zoneCoverage.timeline?.entries ?? 0
  }</td></tr>
          <tr><th>${translate(miscStrings.timelineDuration, lang)}:</th><td>${
    zoneCoverage.timeline?.duration ?? 0
  }</td></tr>
        </table>
      </div>`;

  let translationsColumn = `
      <div class="col"><h3>${translate(miscStrings.noTranslationInformation, lang)}</h3></div>`;
  if (zoneCoverage.translations !== undefined) {
    translationsColumn = `
      <div class="col">
        <table class="table table-striped">
          <thead>
            <tr><th colspan="${Object.keys(translationKeyMap).length + 1}">${
      translate(translationGridHeaders.language, lang)
    }</th></tr>
            <tr><th></th><th>${
      Object.values(translationKeyMap).map((value) => translate(value, lang)).join('</th><th>')
    }</th></tr>
          </thead>
          <tbody>
          <tr>${
      Object.keys(langMap)
        .filter(isLang)
        .map((tlLang) => {
          const translations = zoneCoverage.translations?.[tlLang] ?? {};
          return `
<td>${translate(langMap[lang], tlLang)}</td>
<td>${
            Object.keys(translationKeyMap)
              .filter(isTranslationKeyMap)
              .map((col) => {
                const total = zoneCoverage.translationCount?.[col] ?? 0;
                const missing = total - (translations[col] ?? 0);
                return `${missing}/${total}`;
              })
              .filter(notUndefined)
              .join('</td><td>')
          }</td>`;
        })
        .join('</tr><tr>')
    }</tr>
          </tbody>
        </table>
      </div>`;
  }

  const pullRequestsColumn = `
      <div class="col">
        <h3>Open Pull Requests</h3>
        <ul>
          <li>${
    openPRs.length === 0
      ? translate(miscStrings.none, lang)
      : openPRs.map((pr) => `<a target="_blank" href="${pr.url}">#${pr.number} - ${pr.title}</a>`)
        .join('</li><li>')
  }</li>
        </ul>
      </div>`;

  const releasesColumn = `
      <div class="col">
        <h3>Releases</h3>
        <ul>
          ${
    (!unsupported && unreleased)
      ? `<li class="text-danger">${translate(miscStrings.changesSinceLastRelease, lang)} (${
        new Date(zoneCoverage.lastModified ?? 0).toDateString()
      })</li>`
      : ''
  }<li>${
    allTags.length === 0
      ? translate(miscStrings.none, lang)
      : allTags
        .map((tag) =>
          `<div><a target="_blank" href="https://github.com/OverlayPlugin/cactbot/releases/tag/${tag.tagName}">${tag.tagName} - ${
            new Date(tag.tagDate).toDateString()
          }${
            tag.tagTitle === undefined
              ? ''
              : ` - ${tag.tagTitle.replace(/^v?(?:\d+\.?)+:?/, '').trim()}`
          }</a></div>`
        )
        .join('</li><li>')
  }</li>
        </ul>
      </div>`;

  const dataRow = templateHtmlToDom(`
<tr id="data-${id}" class="collapse">
  <td colspan="${Object.keys(zoneGridHeaders).length}">
    <div class="row">${detailsColumn}${translationsColumn}</div>
    <div class="row">${pullRequestsColumn}${releasesColumn}</div>
  </td>
</tr>`);
  container.appendChild(dataRow);
};

const buildZoneTable = (container: HTMLElement, lang: Lang, coverage: Coverage) => {
  buildZoneTableHeader(container, lang);

  const checkedZoneIds: number[] = [];

  const tbody = document.createElement('tbody');

  // By expansion, then content list.
  for (const exVersion of exVersionToDirName) {
    let lastContentType = '';
    for (const zoneId of contentList) {
      if (zoneId === null)
        continue;
      const zone = ZoneInfo[zoneId];
      if (!zone)
        continue;
      const exDirName = exVersionToDirName[zone.exVersion];
      if (exDirName !== exVersion)
        continue;

      const currentContentTypeLang = zone.contentType !== undefined
        ? contentTypeToLabel[zone.contentType]?.full
        : undefined;
      const currentContentType = currentContentTypeLang !== undefined
        ? translate(currentContentTypeLang, lang)
        : '';

      if (currentContentType !== '' && currentContentType !== lastContentType) {
        lastContentType = currentContentType;
        // Add expansion + content type header row
        tbody.appendChild(
          templateHtmlToDom(
            `<tr class="expansion-row"><th colspan="${Object.keys(zoneGridHeaders).length}">${
              translate(kPrefixToCategory[exVersion], lang)
            } &gt; ${currentContentType}</th></tr>`,
          ),
        );
      }

      buildZoneTableContentRow(zoneId, exDirName, zone, tbody, lang, coverage);

      checkedZoneIds.push(zoneId);
    }

    // Add a divider row between expansions
    tbody.appendChild(
      templateHtmlToDom(
        `<tr class="spacer-row"><td colspan="${
          Object.keys(zoneGridHeaders).length
        }">&nbsp;</th></tr>`,
      ),
    );
  }

  // Everything else
  const miscLabel = translate(kPrefixToCategory['00-misc'], lang);
  const order = [
    ContentType.Dungeons,
    ContentType.Trials,
    ContentType.Raids,
    ContentType.VCDungeonFinder,
    ContentType.ChaoticAllianceRaid,
    ContentType.UltimateRaids,

    // @TODO: Remap categories to group them better
    ContentType.TheMaskedCarnivale,
    ContentType.Eureka,
    ContentType.SaveTheQueen,
    ContentType.DisciplesOfTheLand,
    ContentType.TreasureHunt,
    ContentType.DeepDungeons,
    ContentType.Pvp,

    undefined, // catchall for the rest
  ];
  for (const contentTypeNumber of order) {
    let currentContentType: string = translate(miscStrings.otherContentType, lang);
    if (contentTypeNumber !== undefined) {
      const currentContentTypeLang = contentTypeToLabel[contentTypeNumber]?.full;
      if (currentContentTypeLang === undefined) {
        const contentTypeKey = Object.entries(ContentType).find((ct) => ct[1] === contentTypeNumber)
          ?.[0] ?? 'unknown';
        console.warn(`Missing i18n for content type ${contentTypeNumber} / ${contentTypeKey}`);
      }
      currentContentType = currentContentTypeLang !== undefined
        ? translate(currentContentTypeLang, lang)
        : '';
    }
    const headerRow = templateHtmlToDom(
      `<tr class="expansion-row"><th colspan="${
        Object.keys(zoneGridHeaders).length
      }">${miscLabel} &gt; ${currentContentType}</th></tr>`,
    );
    let builtRow = false;
    tbody.appendChild(headerRow);
    for (const zoneIdStr in coverage) {
      const zoneId = parseInt(zoneIdStr);
      if (zoneId.toString() !== zoneIdStr)
        continue;
      if (checkedZoneIds.includes(zoneId))
        continue;
      const zone = ZoneInfo[zoneId];
      if (!zone)
        continue;

      if (zone.contentType !== contentTypeNumber && contentTypeNumber !== undefined)
        continue;

      const exDirName = exVersionToDirName[zone.exVersion] ?? '00-misc';

      buildZoneTableContentRow(zoneId, exDirName, zone, tbody, lang, coverage);

      builtRow = true;

      checkedZoneIds.push(zoneId);
    }

    if (!builtRow) {
      tbody.removeChild(headerRow);
    }
  }

  container.appendChild(tbody);

  const searchInput = document.getElementById('zone-table-filter');

  if (searchInput === null || !(searchInput instanceof HTMLInputElement))
    throw new UnreachableCode();

  let lastFilterValue = '';

  const filter = () => {
    const lcValue = searchInput.value.toLowerCase();
    if (lastFilterValue === lcValue)
      return;

    lastFilterValue = lcValue;

    // Hide rows that don't match our filter
    container.querySelectorAll('.zone-table-content-row').forEach((row) => {
      if (!(row instanceof HTMLElement))
        return;

      const dataRow = document.querySelector(
        row.attributes.getNamedItem('data-bs-target')?.value ?? '',
      );

      if (dataRow === null || !(dataRow instanceof HTMLElement))
        return;

      // `innerText` is vastly slower to scan all rows here, ~750ms with `innerText`
      // vs ~45ms with `textContent`
      const display = row.textContent?.toLowerCase().includes(lcValue);

      if (display) {
        row.classList.remove('d-none');
        dataRow.classList.remove('d-none');
      } else {
        row.classList.add('d-none');
        dataRow.classList.add('d-none');
      }
    });

    // Hide header rows if they have no content
    container.querySelectorAll('.expansion-row').forEach((row) => {
      if (!(row instanceof HTMLElement))
        return;

      let display: boolean = false;

      let nextSibling = row.nextSibling;

      while (nextSibling !== null) {
        if (!(nextSibling instanceof HTMLElement))
          return;

        if (
          nextSibling.classList.contains('expansion-row') ||
          nextSibling.classList.contains('spacer-row')
        )
          break;

        if (nextSibling.classList.contains('d-none')) {
          nextSibling = nextSibling.nextSibling;
          continue;
        }

        display = true;
        break;
      }

      if (display) {
        row.classList.remove('d-none');
      } else {
        row.classList.add('d-none');
      }
    });
  };

  for (const ev of ['blur', 'change', 'keydown', 'keypress', 'keyup']) {
    searchInput.addEventListener(ev, filter);
  }

  // Fire an initial filter to hide unused category header rows
  filter();
};

const buildLanguageSelect = (container: HTMLElement, lang: Lang) => {
  const langMapEntry = langMap[lang];
  const items = languages.map((key) => {
    if (key === lang)
      return `<li class="list-group-item active">[${translate(langMapEntry, key)}]</li>`;

    return `<li class="list-group-item">[<a href="?lang=${key}">${
      translate(langMapEntry, key)
    }</a>]</li>`;
  });

  const elem = templateHtmlToDom(
    `<ul class="list-group list-group-horizontal">${items.join('')}</ul>`,
  );
  container.appendChild(elem);
};

document.addEventListener('DOMContentLoaded', () => {
  // Allow for `coverage.html?lang=de` style constructions.
  const params = new URLSearchParams(window.location.search);
  const langStr = params.get('lang') ?? 'en';
  // TODO: left for now as backwards compatibility with user css.  Remove this later??
  document.body.classList.add(`lang-${langStr}`);
  const lang = langStr !== null && isLang(langStr) ? langStr : 'en';

  document.documentElement.lang = langToLocale(lang);

  const title = document.getElementById('title');
  if (!title)
    throw new UnreachableCode();
  title.innerText = translate(miscStrings.title, lang);

  const languageSelect = document.getElementById('language-select');
  if (!languageSelect)
    throw new UnreachableCode();
  buildLanguageSelect(languageSelect, lang);

  const description = document.getElementById('description-text');
  if (!description)
    throw new UnreachableCode();
  description.innerHTML = translate(miscStrings.description, lang);

  if (coverageTotals.overall.total === 0) {
    const warning = document.getElementById('warning');
    if (!warning)
      throw new UnreachableCode();
    warning.innerText = translate(miscStrings.runGenerator, lang);
    return;
  }

  const expansionGrid = document.getElementById('expansion-table');
  if (!expansionGrid)
    throw new UnreachableCode();
  buildExpansionTable(expansionGrid, lang, coverageTotals);

  const translationGrid = document.getElementById('translation-table');
  if (!translationGrid)
    throw new UnreachableCode();
  buildTranslationTable(translationGrid, lang, translationTotals);

  const zoneGrid = document.getElementById('zone-table');
  if (!zoneGrid)
    throw new UnreachableCode();
  buildZoneTable(zoneGrid, lang, coverage);
});
