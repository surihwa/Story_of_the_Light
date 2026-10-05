import type { Character } from '@types';

/**
 * 캐릭터 마스터 데이터.
 *
 * key 와 `aliases` 가 노션의 `캐릭터` / `관련 캐릭터` 옵션 이름과 대조됩니다.
 * 풀네임으로 바꾸면서, 노션에 성 없이 적어 둔 값도 그대로 인식되도록
 * 짧은 이름을 별칭으로 함께 등록해 뒀습니다.
 */
export const characters = {
  '서리화': { id: 'surihwa', name: '서리화', role: '빛의 전사', color: '#342151' },
  '카르네아데스': { id: 'azem', name: '카르네아데스', role: '아젬', color: '#ff9302' },
  '로레트 모린': {
    id: 'laurette', name: '로레트 모린', role: '음유시인', color: '#fae04f',
    aliases: ['로레트'],
  },
  '이스노티 헤멜': {
    id: 'isnotti', name: '이스노티 헤멜', role: '암흑기사', color: '#0f163a',
    aliases: ['이스노티'],
  },
  '야슈톨라 룰': {
    id: 'yshtola', name: '야슈톨라 룰', role: '현자', color: '#6e14b8',
    aliases: ['야슈톨라'],
  },
  '그레틴': { id: 'gretin', name: '그레틴', role: '모험가 소대원', color: '#E6B800' },
  '이벨린': {
    id: 'ivelyn', name: '이벨린', role: '성 앙달림 신학원', color: '#b9d9ec',
    aliases: ['신학원'],
  },
  '흑와단': { id: 'maelstrom', name: '흑와단', role: '모험가 소대', color: '#af1919' },
} satisfies Record<string, Character>;

export type CharacterKey = keyof typeof characters;

export const characterList = Object.values(characters);

/** 정식 이름과 별칭을 모두 담은 조회표 */
const lookup = new Map<string, Character>();
for (const [key, character] of Object.entries(characters) as [string, Character][]) {
  lookup.set(key, character);
  for (const alias of character.aliases ?? []) lookup.set(alias, character);
}

/** 이름이나 별칭으로 캐릭터를 찾습니다. 없으면 undefined. */
export function getCharacter(name: string): Character | undefined {
  return lookup.get(name.trim());
}

/** 이름 배열을 캐릭터 배열로. 매칭되지 않는 이름은 조용히 버립니다. */
export function getCharacters(names: string[] = []): Character[] {
  return names.map((n) => getCharacter(n)).filter((c): c is Character => Boolean(c));
}

/** 캐릭터 색을 찾되, 없으면 중립 회색으로 대체합니다. */
export function colorOf(name: string): string {
  return getCharacter(name)?.color ?? '#94A3B8';
}

/** 화면에 노출할 이름. 별칭으로 들어와도 풀네임으로 바꿔 줍니다. */
export function displayName(name: string): string {
  return getCharacter(name)?.name ?? name;
}
