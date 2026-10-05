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

/* ------------------------------------------------------------------ *
 * 속도 제한
 *
 * 노션은 통합 하나당 평균 초당 3회로 요청을 제한합니다.
 * 글이 수십 건만 되어도 본문 블록을 읽느라 수백 번을 호출하게 되는데,
 * 그대로 쏟아부으면 중간에 rate_limited 가 나면서 빌드가 통째로 실패합니다.
 *
 * 그래서 모든 호출을 한 줄로 세워 간격을 띄우고,
 * 그래도 막히면 노션이 알려 주는 대기 시간만큼 기다렸다 다시 시도합니다.
 * ------------------------------------------------------------------ */

/** 요청 사이 최소 간격(ms). 초당 3회 한도에 여유를 두어 약 2.4회로 맞춥니다. */
const MIN_INTERVAL = 420;
const MAX_RETRIES = 5;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let chain: Promise<unknown> = Promise.resolve();
let lastCall = 0;
let requestCount = 0;

/** 재시도해 볼 만한 일시적 오류인지 판단합니다. */
function isTransient(err: unknown): boolean {
  const e = err as { code?: string; status?: number };
  if (e?.code === 'rate_limited' || e?.status === 429) return true;
  if (e?.status && e.status >= 500) return true;
  return e?.code === 'service_unavailable' || e?.code === 'internal_server_error';
}

/** 노션이 알려 준 대기 시간(초)을 읽습니다. 없으면 지수적으로 늘립니다. */
function waitFor(err: unknown, attempt: number): number {
  const headers = (err as { headers?: Record<string, string> })?.headers;
  const retryAfter = Number(headers?.['retry-after'] ?? headers?.['Retry-After']);
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000 + 250;
  return Math.min(2 ** attempt * 1000, 30_000);
}

/** 모든 노션 호출을 이 함수에 통과시킵니다. */
async function call<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    for (let attempt = 0; ; attempt++) {
      const gap = Date.now() - lastCall;
      if (gap < MIN_INTERVAL) await sleep(MIN_INTERVAL - gap);

      try {
        lastCall = Date.now();
        const result = await fn();
        requestCount++;
        return result;
      } catch (err) {
        lastCall = Date.now();
        if (attempt >= MAX_RETRIES || !isTransient(err)) throw err;

        const delay = waitFor(err, attempt);
        console.warn(
          `[notion] ${label} 요청이 막혀 ${Math.round(delay / 1000)}초 뒤 다시 시도합니다 ` +
            `(${attempt + 1}/${MAX_RETRIES})`,
        );
        await sleep(delay);
      }
    }
  };

  // 한 번에 하나씩만 보냅니다. 동시에 보내면 간격 계산이 무의미해집니다.
  const queued = chain.then(run, run);
  chain = queued.catch(() => undefined);
  return queued;
}

/** 지금까지 보낸 요청 수 (빌드 로그용) */
export function getRequestCount(): number {
  return requestCount;
}

/** 페이지네이션까지 모두 따라가며 DB 전체를 읽습니다. */
export async function queryAll(databaseId: string): Promise<PageObjectResponse[]> {
  if (!notion || !databaseId) return [];
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const res = await call('DB 조회', () =>
      notion.databases.query({ database_id: databaseId, start_cursor: cursor, page_size: 100 }),
    );
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
    const res = await call('본문 조회', () =>
      notion.blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 }),
    );
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
