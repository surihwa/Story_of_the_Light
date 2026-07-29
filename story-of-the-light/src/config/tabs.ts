import type { MainTab, SubTab } from '@types';
import { characters } from './characters';

/**
 * [1단계] 메인 탭 — 자동 생성이 아니라 여기서 수동 관리합니다.
 * label 이 화면에 그대로 노출되고, 노션 "탭" multi-select 옵션 이름과도 일치해야 합니다.
 */
export const mainTabs: MainTab[] = [
  {
    id: 'seorihwa',
    label: '서리화',
    caption: '빛의 전사',
    kind: 'single',
    characters: ['서리화'],
    accents: [characters['서리화'].color],
  },
  {
    id: 'azem',
    label: '아젬',
    caption: '카르네아데스',
    kind: 'single',
    characters: ['카르네아데스'],
    accents: [characters['카르네아데스'].color],
  },
  {
    id: 'sangseogo',
    label: '상서고',
    caption: '서리화 & 야슈톨라',
    kind: 'dual',
    characters: ['서리화', '야슈톨라'],
    accents: [characters['서리화'].color, characters['야슈톨라'].color],
  },
  {
    id: 'lorenti',
    label: '로렌티',
    caption: '로레트 & 이스노티',
    kind: 'dual',
    characters: ['로레트', '이스노티'],
    accents: [characters['로레트'].color, characters['이스노티'].color],
  },
  {
    id: 'squadron',
    label: '모험가 소대',
    caption: '흑와단',
    kind: 'group',
    characters: ['서리화', '그레틴', '모험가 소대'],
    accents: [characters['모험가 소대'].color],
  },
  {
    id: 'world',
    label: '세계',
    caption: '그 외 전체',
    kind: 'world',
    characters: [],
    accents: ['#4A5568'],
  },
  {
    id: 'timeline',
    label: '연표',
    caption: '전체 타임라인',
    kind: 'timeline',
    characters: [],
    accents: ['#3F5E7A'],
  },
];

/** [2단계] 서브 탭 — 연표를 제외한 모든 메인 탭에서 공통으로 노출됩니다. */
export const subTabs: SubTab[] = [
  { id: 'profile', label: 'Profile', caption: '설정' },
  { id: 'story', label: 'Story', caption: '본편' },
  { id: 'logs', label: 'Logs', caption: '썰' },
  { id: 'screenshots', label: 'Screenshots', caption: '스크린샷' },
  { id: 'gallery', label: 'Gallery', caption: '그림' },
];

export const contentTabs = mainTabs.filter((t) => t.kind !== 'timeline');

export function getTab(id: string): MainTab | undefined {
  return mainTabs.find((t) => t.id === id);
}

export function getSubTab(id: string): SubTab | undefined {
  return subTabs.find((t) => t.id === id);
}
