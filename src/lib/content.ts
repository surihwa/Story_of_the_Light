import type { Post, TimelineEntry } from '@types';
import { mainTabs } from '@config/tabs';
import { sources, timelineSource } from '@config/sources';
import { dbId, fetchBlocks, hasToken, queryAll } from './notion';
import { toPost, toTimelineEntry } from './mapper';
import { renderPage } from './blocks';
import { mockPosts, mockTimeline } from './mock';

/**
 * 콘텐츠 진입점.
 * 빌드 중 여러 페이지에서 호출되므로 한 번만 읽고 결과를 재사용합니다.
 * 노션 자격 증명이 없으면 샘플 데이터로 조용히 대체해서, 클론 직후에도 화면이 뜹니다.
 */

const tabLabelToId = new Map(mainTabs.map((t) => [t.label, t.id]));

let postsPromise: Promise<Post[]> | null = null;
let timelinePromise: Promise<TimelineEntry[]> | null = null;

async function loadPosts(): Promise<Post[]> {
  const configured = sources.filter((s) => dbId(s.env));

  if (!hasToken || configured.length === 0) {
    console.warn('[content] 노션 설정이 없어 샘플 데이터로 렌더링합니다.');
    return mockPosts;
  }

  const posts: Post[] = [];

  for (const source of configured) {
    const pages = await queryAll(dbId(source.env));

    for (const page of pages) {
      const post = await toPost(page, source, tabLabelToId);
      const body = await renderPage(await fetchBlocks(page.id));

      post.html = body.html;
      post.text = body.text;
      // 파일 속성에 붙인 이미지와 본문에 넣은 이미지를 모두 모읍니다.
      post.images = [...post.images, ...body.images];
      if (!post.cover && post.images[0]) post.cover = post.images[0].src;

      posts.push(post);
    }

    console.log(`[content] ${source.section}: ${pages.length}건`);
  }

  return posts;
}

async function loadTimeline(): Promise<TimelineEntry[]> {
  const id = dbId(timelineSource.env);
  if (!hasToken || !id) return mockTimeline;
  const pages = await queryAll(id);
  console.log(`[content] timeline: ${pages.length}건`);
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
