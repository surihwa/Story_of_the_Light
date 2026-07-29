import { Client, isFullPage, isFullBlock } from '@notionhq/client';
import type {
  PageObjectResponse,
  BlockObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';

const token = process.env.NOTION_TOKEN ?? import.meta.env.NOTION_TOKEN;

/** 토큰이 없으면 null — 이 경우 상위에서 샘플 데이터로 대체합니다. */
export const notion = token ? new Client({ auth: token }) : null;

/** 환경 변수 이름으로 DB ID 를 읽습니다. */
export function dbId(envKey: string): string {
  return (process.env[envKey] ?? (import.meta.env as Record<string, string>)[envKey] ?? '').trim();
}

export const hasToken = Boolean(notion);

/** 페이지네이션까지 모두 따라가며 DB 전체를 읽습니다. */
export async function queryAll(databaseId: string): Promise<PageObjectResponse[]> {
  if (!notion || !databaseId) return [];
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...res.results.filter(isFullPage));
    cursor = res.next_cursor ?? undefined;
  } while (cursor);

  return pages;
}

/** 한 페이지의 블록을 자식까지 재귀로 읽습니다. */
export async function fetchBlocks(blockId: string): Promise<BlockObjectResponse[]> {
  if (!notion) return [];
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const block of res.results.filter(isFullBlock)) {
      if (block.has_children) {
        (block as BlockObjectResponse & { children?: BlockObjectResponse[] }).children =
          await fetchBlocks(block.id);
      }
      blocks.push(block);
    }
    cursor = res.next_cursor ?? undefined;
  } while (cursor);

  return blocks;
}
