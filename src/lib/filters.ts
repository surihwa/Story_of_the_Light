import type { MainTab, Post, SectionId } from '@types';
import { sources } from '@config/sources';

/**
 * 메인 탭 + 서브 탭 조합으로 게시물을 걸러 냅니다.
 *
 * 규칙
 *  - 일반 탭: `탭` 속성에 이 탭이 들어간 글만.
 *  - `세계` 탭: 어느 탭에도 지정하지 않은 글 + 명시적으로 세계를 고른 글.
 *  - 예외: `세계` + `Profile` 은 필터를 풀고 모든 캐릭터의 프로필을 한데 모읍니다.
 */
export function filterPosts(posts: Post[], tab: MainTab, section: SectionId): Post[] {
  const inSection = posts.filter((p) => p.section === section);

  if (tab.kind === 'world') {
    if (section === 'profile') return sortPosts(inSection, section);
    return sortPosts(inSection.filter((p) => p.tabs.length === 0 || p.tabs.includes(tab.id)), section);
  }

  return sortPosts(inSection.filter((p) => p.tabs.includes(tab.id)), section);
}

/**
 * 번호 순으로 정렬합니다. 번호가 없는 글은 뒤로 보냅니다.
 *
 * 방향은 번호를 어느 속성에서 읽었는지를 보고 정합니다.
 *  - 숫자 속성 → 오름차순. 직접 매긴 1, 2, 3… 순서가 곧 읽는 순서니까요.
 *  - ID 속성   → 내림차순. 자동 증가하므로 가장 나중에 올린 것이 맨 위로 옵니다.
 * `sources.ts` 에 `direction` 을 적어 두면 그쪽이 우선합니다.
 */
export function sortPosts(posts: Post[], section: SectionId): Post[] {
  const override = sources.find((s) => s.section === section)?.direction;
  const usesId = posts.some((p) => p.numberKind === 'id');
  const direction = override ?? (usesId ? 'desc' : 'asc');
  const sign = direction === 'asc' ? 1 : -1;

  return [...posts].sort((a, b) => {
    if (a.number === null && b.number === null) return a.title.localeCompare(b.title, 'ko');
    if (a.number === null) return 1;
    if (b.number === null) return -1;
    return (a.number - b.number) * sign;
  });
}
