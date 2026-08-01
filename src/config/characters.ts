import type { Character } from '@types';

/**
 * 캐릭터 마스터 데이터.
 * key 는 노션의 `캐릭터` / `관련 캐릭터` 옵션 이름과 반드시 일치해야 합니다.
 * 여기에 없는 이름은 배지가 회색으로 대체됩니다.
 */
export const characters = {
  '서리화': { id: 'surihwa', name: '서리화', role: '빛의 전사', color: '#342151' },
  '카르네아데스': { id: 'azem', name: '카르네아데스', role: '아젬', color: '#ff9302' },
  '로레트': { id: 'laurette', name: '로레트', role: '음유시인', color: '#fae04f' },
  '이스노티': { id: 'isnotti', name: '이스노티', role: '암흑기사', color: '#0f163a' },
  '야슈톨라': { id: 'yshtola', name: '야슈톨라', role: '현자', color: '#6e14b8' },
  '그레틴': { id: 'gretin', name: '그레틴', role: '모험가 소대원', color: '#E6B800' },
  '신학원': { id: 'scholasticate', name: '신학원', role: '성 앙달림 신학원', color: '#b9d9ec' },
  '흑와단': { id: 'maelstrom', name: '흑와단', role: '모험가 소대', color: '#af1919' },
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
