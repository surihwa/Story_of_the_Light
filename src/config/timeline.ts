import type { Era } from '@types';

/**
 * 연표 시간축 정의.
 * '신생' 을 0년 기준점으로 두고, 그 이전은 -1년 / -5년 처럼 숫자로,
 * 이후는 확장팩 이름으로 표기합니다.
 * 새 확장팩이 나오면 이 배열 아래에 한 줄만 추가하면 됩니다.
 */
export const eras: Era[] = [
  { label: '신생', en: 'A Realm Reborn', order: 0 },
  { label: '창천', en: 'Heavensward', order: 1 },
  { label: '홍련', en: 'Stormblood', order: 2 },
  { label: '칠흑', en: 'Shadowbringers', order: 3 },
  { label: '효월', en: 'Endwalker', order: 4 },
  { label: '황금', en: 'Dawntrail', order: 5 },
  { label: '백은', en: '', order: 6 },
];

/** 신생 이전 구간(음수 연도)을 묶어 부르는 이름 */
export const preEraLabel = '신생 이전';
