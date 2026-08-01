import type { Post, TimelineEntry } from '@types';
import { tabLabelToId } from '@config/tabs';
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

/** CI 에서는 자격 증명 누락을 경고가 아니라 실패로 다룹니다. */
function isStrict(): boolean {
  return process.env.CI === 'true' && process.env.ALLOW_SAMPLE_CONTENT !== 'true';
}

let postsPromise: Promise<Post[]> | null = null;
let timelinePromise: Promise<TimelineEntry[]> | null = null;

async function loadPosts(): Promise<Post[]> {
  const configured = sources.filter((s) => dbId(s.env));

  if (!hasToken || configured.length === 0) {
    // 시크릿 이름을 하나 잘못 적어도 빌드는 성공하기 때문에,
    // 샘플 데이터가 실제 사이트로 배포돼 버리는 사고가 납니다. CI 에서는 아예 멈춥니다.
    if (isStrict()) {
      throw new Error(
        '노션 자격 증명을 찾지 못했습니다. 저장소 Settings → Secrets and variables → Actions 에 ' +
          'NOTION_TOKEN 과 각 DB ID 가 등록돼 있는지, 이름 철자가 맞는지 확인하세요. ' +
          '샘플 데이터로 배포하려면 ALLOW_SAMPLE_CONTENT=true 를 주면 됩니다.',
      );
    }
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
