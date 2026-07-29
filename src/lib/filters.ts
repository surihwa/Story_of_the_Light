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

/** 카테고리별로 정해 둔 방향대로 번호 순 정렬합니다. 번호가 없으면 뒤로 보냅니다. */
export function sortPosts(posts: Post[], section: SectionId): Post[] {
  const direction = sources.find((s) => s.section === section)?.direction ?? 'asc';
  const sign = direction === 'asc' ? 1 : -1;

  return [...posts].sort((a, b) => {
    if (a.number === null && b.number === null) return a.title.localeCompare(b.title, 'ko');
    if (a.number === null) return 1;
    if (b.number === null) return -1;
    return (a.number - b.number) * sign;
  });
}
