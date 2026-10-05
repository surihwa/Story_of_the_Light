import type { MainTab, SubTab, TabGroup } from '@types';

/**
 * [1단계] 대분류 — 화면 맨 위 줄에 놓입니다.
 */
export const groups: TabGroup[] = [
  { id: 'oc', label: 'OC' },
  { id: 'pair', label: 'Pair' },
  { id: 'world', label: 'World' },
];

/**
 * [2단계] 중분류 — 자동 생성이 아니라 이 배열에서 수동 관리합니다.
 *
 *  - `id`     : 주소에 쓰이는 이름
 *  - `label`  : 화면에 그대로 노출 + 노션 `탭` 옵션 이름과 일치해야 함
 *  - `kind`   : 색을 어떻게 입힐지 (single | dual | group | world | timeline)
 *  - `accents`: 강조색. dual 이면 두 개.
 */
export const mainTabs: MainTab[] = [
  // ── OC ──────────────────────────────────────────────
  {
    id: 'surihwa', group: 'oc', label: '서리화', caption: '빛의 전사',
    kind: 'single', characters: ['서리화'], accents: ['#342151'],
  },
  {
    id: 'azem', group: 'oc', label: '카르네아데스', caption: '아젬',
    kind: 'single', characters: ['카르네아데스'], accents: ['#ff9302'],
    aliases: ['아젬'],
  },
  {
    id: 'laurette', group: 'oc', label: '로레트 모린', caption: '음유시인',
    kind: 'single', characters: ['로레트 모린'], accents: ['#fae04f'],
    aliases: ['로레트'],
  },
  {
    id: 'isnotti', group: 'oc', label: '이스노티 헤멜', caption: '암흑기사',
    kind: 'single', characters: ['이스노티 헤멜'], accents: ['#0f163a'],
    aliases: ['이스노티'],
  },

  // ── Pair ────────────────────────────────────────────
  {
    id: 'frost_library', group: 'pair', label: '상서고', caption: '서리화 & 야슈톨라 룰',
    kind: 'dual', characters: ['서리화', '야슈톨라 룰'], accents: ['#342151', '#6e14b8'],
  },
  {
    id: 'laurentti', group: 'pair', label: '로렌티', caption: '로레트 모린 & 이스노티 헤멜',
    kind: 'dual', characters: ['로레트 모린', '이스노티 헤멜'], accents: ['#fae04f', '#0f163a'],
  },
  {
    // 이벨린의 색은 임시값입니다. 정해지면 accents 의 첫 번째 값만 바꾸면 됩니다.
    id: 'scholasticate', group: 'pair', label: '이브리화', caption: '이벨린 & 서리화',
    kind: 'dual', characters: ['이벨린', '서리화'], accents: ['#b9d9ec', '#342151'],
    aliases: ['신학원'],
  },
  {
    id: 'maelstrom', group: 'pair', label: '흑와단', caption: '모험가 소대',
    kind: 'group', characters: ['흑와단'], accents: ['#af1919'],
  },

  // ── World ───────────────────────────────────────────
  {
    id: 'world', group: 'world', label: '세계', caption: '그 외 전체',
    kind: 'world', characters: [], accents: ['#6be3fb'],
  },
  {
    id: 'timeline', group: 'world', label: '연표', caption: '전체 타임라인',
    kind: 'timeline', characters: [], accents: ['#94cfef'],
  },
];

/** [3단계] 소분류 — 연표를 제외한 모든 중분류에서 공통으로 노출됩니다. */
export const subTabs: SubTab[] = [
  { id: 'profile', label: 'Profile', caption: '설정' },
  { id: 'story', label: 'Story', caption: '본편' },
  { id: 'logs', label: 'Logs', caption: '썰' },
];

/** 소분류를 갖는 중분류만 (= 연표 제외) */
export const contentTabs = mainTabs.filter((t) => t.kind !== 'timeline');

export function getTab(id: string): MainTab | undefined {
  return mainTabs.find((t) => t.id === id);
}

export function getSubTab(id: string): SubTab | undefined {
  return subTabs.find((t) => t.id === id);
}

/** 노션 `탭` 옵션 이름(별칭 포함) → 중분류 id */
export const tabLabelToId = new Map<string, string>();
for (const tab of mainTabs) {
  tabLabelToId.set(tab.label, tab.id);
  for (const alias of tab.aliases ?? []) tabLabelToId.set(alias, tab.id);
}

export function getGroup(id: string): TabGroup | undefined {
  return groups.find((g) => g.id === id);
}

/** 대분류에 속한 중분류 목록 */
export function tabsOf(groupId: string): MainTab[] {
  return mainTabs.filter((t) => t.group === groupId);
}

/** 대분류를 열었을 때 기본으로 보여 줄 중분류 */
export function defaultTabOf(groupId: string): MainTab {
  return tabsOf(groupId)[0];
}
