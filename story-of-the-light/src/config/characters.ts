import type { Character } from '@types';

/**
 * 캐릭터 마스터 데이터.
 * key 는 노션 DB 의 "관련 캐릭터" multi-select 옵션 이름과 반드시 일치해야 합니다.
 */
export const characters = {
  '서리화': {
    id: 'seorihwa',
    name: '서리화',
    role: '빛의 전사',
    color: '#2F234F',
    note: '남색 기운의 짙은 보라',
  },
  '야슈톨라': {
    id: 'yshtola',
    name: '야슈톨라',
    role: '현자',
    color: '#6A1B9A',
    note: 'Purple',
  },
  '카르네아데스': {
    id: 'carneades',
    name: '카르네아데스',
    role: '아젬',
    color: '#E65C00',
    note: '선명한 주황색',
  },
  '로레트': {
    id: 'lorette',
    name: '로레트',
    role: '',
    color: '#F5C518',
    note: '샛노란 꾀꼬리색',
  },
  '이스노티': {
    id: 'isnoti',
    name: '이스노티',
    role: '',
    color: '#1B263B',
    note: '밤하늘 남색',
  },
  '그레틴': {
    id: 'gretin',
    name: '그레틴',
    role: '모험가 소대원',
    color: '#E6B800',
    note: 'Gold',
  },
  '모험가 소대': {
    id: 'squadron',
    name: '모험가 소대',
    role: '흑와단',
    color: '#8B0000',
    note: '흑와단 상징 진한 붉은색',
  },
} satisfies Record<string, Character>;

export type CharacterKey = keyof typeof characters;

export const characterList = Object.values(characters);

/** 이름으로 캐릭터를 찾습니다. 없으면 undefined. */
export function getCharacter(name: string): Character | undefined {
  return (characters as Record<string, Character>)[name.trim()];
}

/** 이름 배열을 캐릭터 배열로. 매칭되지 않는 이름은 조용히 버립니다. */
export function getCharacters(names: string[] = []): Character[] {
  return names.map((n) => getCharacter(n)).filter((c): c is Character => Boolean(c));
}

/** 캐릭터 색을 찾되, 없으면 중립 회색으로 대체합니다. */
export function colorOf(name: string): string {
  return getCharacter(name)?.color ?? '#94A3B8';
}
