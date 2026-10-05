import type { MainTab, MediaEntry, SectionId } from '@types';
import { asset } from './url';
import manifest from '../generated/media.json';

/**
 * Screenshots 는 노션이 아니라 저장소의 `media/` 폴더를 읽습니다.
 *
 * 노션에 큰 이미지를 쌓으면 요금제 용량에 걸리고, 파일 URL 도 한 시간이면 만료됩니다.
 * 파일로 두면 두 문제가 모두 사라집니다.
 *
 * 원본은 Astro 처리 범위 밖(`media/`)에 두고, `scripts/build-media.mjs` 가
 * 빌드 전에 필요한 크기만 `public/media/` 로 뽑아 냅니다.
 * 그래서 원본이 아무리 커도 배포물에는 최적화본만 들어갑니다.
 */
const all: MediaEntry[] = (manifest as MediaEntry[]).map((entry) => ({
  ...entry,
  variants: {
    sm: { ...entry.variants.sm, src: asset(entry.variants.sm.src) },
    md: { ...entry.variants.md, src: asset(entry.variants.md.src) },
    lg: { ...entry.variants.lg, src: asset(entry.variants.lg.src) },
  },
}));

/** 번호가 큰 것부터. 번호 없는 파일은 이름 역순으로 뒤에 붙입니다. */
function sortEntries(entries: MediaEntry[]): MediaEntry[] {
  return [...entries].sort((a, b) => {
    if (a.number !== null && b.number !== null) return b.number - a.number;
    if (a.number !== null) return -1;
    if (b.number !== null) return 1;
    return b.id.localeCompare(a.id, 'ko');
  });
}

/**
 * 탭과 섹션에 해당하는 이미지를 돌려줍니다.
 * `세계` 탭은 어느 탭 폴더에도 속하지 않은 파일까지 함께 보여 줍니다.
 */
export function getMedia(tab: MainTab, section: SectionId, knownTabIds: string[]): MediaEntry[] {
  const inSection = all.filter((e) => e.section === section);

  if (tab.kind === 'world') {
    return sortEntries(
      inSection.filter((e) => e.tabId === tab.id || !knownTabIds.includes(e.tabId)),
    );
  }
  return sortEntries(inSection.filter((e) => e.tabId === tab.id));
}

let warned = false;

/**
 * 폴더 이름이 어느 탭과도 맞지 않을 때 빌드 로그로 한 번만 알려 줍니다.
 * (이 함수는 페이지마다 호출되므로 중복 출력을 막아야 합니다.)
 */
export function warnUnknownFolders(knownTabIds: string[]): void {
  if (warned) return;
  warned = true;

  const unknown = new Set(all.filter((e) => !knownTabIds.includes(e.tabId)).map((e) => e.tabId));
  for (const folder of unknown) {
    console.warn(
      `[media] '${folder}' 는 탭 이름과 맞지 않아 세계 탭으로 보냅니다. ` +
        `media/README.md 의 폴더 이름표를 확인하세요.`,
    );
  }
}

export const mediaCount = all.length;
