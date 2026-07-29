import type { Post, TimelineEntry } from '@types';
import { mainTabs } from '@config/tabs';
import { dbIds, fetchBlocks, isNotionReady, queryAll } from './notion';
import { toPost, toTimelineEntry } from './mapper';
import { renderBlocks } from './blocks';
import { mockPosts, mockTimeline } from './mock';

/**
 * 콘텐츠 진입점.
 * 빌드 중 여러 페이지에서 호출되므로 결과를 한 번만 만들고 재사용합니다.
 * 노션 자격 증명이 없으면 샘플 데이터로 조용히 대체해서, 클론 직후에도 화면이 뜹니다.
 */

const tabLabelToId = new Map(mainTabs.map((t) => [t.label, t.id]));

let postsPromise: Promise<Post[]> | null = null;
let timelinePromise: Promise<TimelineEntry[]> | null = null;

async function loadPosts(): Promise<Post[]> {
  if (!isNotionReady) {
    console.warn('[content] NOTION_TOKEN 이 없어 샘플 데이터로 렌더링합니다.');
    return mockPosts;
  }

  const pages = await queryAll(dbIds.posts);
  const posts: Post[] = [];

  for (const page of pages) {
    const post = await toPost(page, tabLabelToId);
    if (!post) continue;
    post.html = await renderBlocks(await fetchBlocks(page.id));
    posts.push(post);
  }

  console.log(`[content] 게시물 ${posts.length}건을 불러왔습니다.`);
  return posts;
}

async function loadTimeline(): Promise<TimelineEntry[]> {
  if (!isNotionReady || !dbIds.timeline) return mockTimeline;
  const pages = await queryAll(dbIds.timeline);
  return pages.map(toTimelineEntry);
}

export function getPosts(): Promise<Post[]> {
  postsPromise ??= loadPosts();
  return postsPromise;
}

export function getTimeline(): Promise<TimelineEntry[]> {
  timelinePromise ??= loadTimeline();
  return timelinePromise;
}

export async function getPost(id: string): Promise<Post | undefined> {
  return (await getPosts()).find((p) => p.id === id);
}
