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
    id: 'azem', group: 'oc', label: '아젬', caption: '카르네아데스',
    kind: 'single', characters: ['카르네아데스'], accents: ['#ff9302'],
  },
  {
    id: 'laurette', group: 'oc', label: '로레트', caption: '음유시인',
    kind: 'single', characters: ['로레트'], accents: ['#fae04f'],
  },
  {
    id: 'isnotti', group: 'oc', label: '이스노티', caption: '암흑기사',
    kind: 'single', characters: ['이스노티'], accents: ['#0f163a'],
  },

  // ── Pair ────────────────────────────────────────────
  {
    id: 'frost_library', group: 'pair', label: '상서고', caption: '서리화 & 야슈톨라',
    kind: 'dual', characters: ['서리화', '야슈톨라'], accents: ['#342151', '#6e14b8'],
  },
  {
    id: 'laurentti', group: 'pair', label: '로렌티', caption: '로레트 & 이스노티',
    kind: 'dual', characters: ['로레트', '이스노티'], accents: ['#fae04f', '#0f163a'],
  },
  {
    id: 'scholasticate', group: 'pair', label: '신학원', caption: '성 앙달림 신학원',
    kind: 'group', characters: ['신학원'], accents: ['#b9d9ec'],
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
  { id: 'screenshots', label: 'Screenshots', caption: '스크린샷' },
  { id: 'gallery', label: 'Gallery', caption: '그림' },
];

/** 소분류를 갖는 중분류만 (= 연표 제외) */
export const contentTabs = mainTabs.filter((t) => t.kind !== 'timeline');

export function getTab(id: string): MainTab | undefined {
  return mainTabs.find((t) => t.id === id);
}

export function getSubTab(id: string): SubTab | undefined {
  return subTabs.find((t) => t.id === id);
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
