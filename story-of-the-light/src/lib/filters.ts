import type { Post, MainTab, SectionId } from '@types';

/**
 * 메인 탭 + 서브 탭 조합으로 게시물을 걸러 냅니다.
 *
 * 규칙
 *  - 일반 탭: 해당 탭에 지정된 글만.
 *  - `세계` 탭: 어느 탭에도 속하지 않은 글 + 명시적으로 세계에 넣은 글.
 *  - 예외: `세계` + `Profile` 은 필터를 풀고 모든 캐릭터의 프로필을 한데 모읍니다.
 */
export function filterPosts(posts: Post[], tab: MainTab, section: SectionId): Post[] {
  const inSection = posts.filter((p) => p.section === section);

  if (tab.kind === 'world') {
    if (section === 'profile') return sortPosts(inSection);
    return sortPosts(inSection.filter((p) => p.tabs.length === 0 || p.tabs.includes(tab.id)));
  }

  return sortPosts(inSection.filter((p) => p.tabs.includes(tab.id)));
}

/** `정렬` 값 내림차순 → 날짜 내림차순 → 제목 순 */
export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) =>
      b.order - a.order ||
      (b.date ?? '').localeCompare(a.date ?? '') ||
      a.title.localeCompare(b.title, 'ko'),
  );
}

/** 세계·Profile 화면에서 캐릭터 순서대로 묶어 보여 주기 위한 그룹핑 */
export function groupByCharacter(posts: Post[], order: string[]): { name: string; posts: Post[] }[] {
  const buckets = new Map<string, Post[]>();
  for (const post of posts) {
    const key = post.characters[0] ?? '그 외';
    buckets.set(key, [...(buckets.get(key) ?? []), post]);
  }
  const known = order.filter((n) => buckets.has(n)).map((name) => ({ name, posts: buckets.get(name)! }));
  const rest = [...buckets.keys()]
    .filter((n) => !order.includes(n))
    .map((name) => ({ name, posts: buckets.get(name)! }));
  return [...known, ...rest];
}
