import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { MediaItem, Post, SectionId, TimelineEntry } from '@types';
import { localizeImage } from './images';
import { periodSortKey } from './timeline';

type Props = PageObjectResponse['properties'];

function plain(prop: Props[string] | undefined): string {
  if (!prop) return '';
  if (prop.type === 'title') return prop.title.map((t) => t.plain_text).join('').trim();
  if (prop.type === 'rich_text') return prop.rich_text.map((t) => t.plain_text).join('').trim();
  if (prop.type === 'select') return prop.select?.name ?? '';
  if (prop.type === 'status') return prop.status?.name ?? '';
  if (prop.type === 'url') return prop.url ?? '';
  if (prop.type === 'date') return prop.date?.start ?? '';
  return '';
}

function list(prop: Props[string] | undefined): string[] {
  if (!prop) return [];
  if (prop.type === 'multi_select') return prop.multi_select.map((o) => o.name);
  if (prop.type === 'select') return prop.select ? [prop.select.name] : [];
  return [];
}

function num(prop: Props[string] | undefined, fallback = 0): number {
  if (prop?.type === 'number' && typeof prop.number === 'number') return prop.number;
  return fallback;
}

function bool(prop: Props[string] | undefined, fallback = true): boolean {
  if (prop?.type === 'checkbox') return prop.checkbox;
  return fallback;
}

async function files(prop: Props[string] | undefined): Promise<MediaItem[]> {
  if (prop?.type !== 'files') return [];
  const out: MediaItem[] = [];
  for (const f of prop.files) {
    const raw = f.type === 'external' ? f.external.url : f.file.url;
    out.push({ src: await localizeImage(raw), alt: f.name ?? '' });
  }
  return out;
}

async function coverOf(page: PageObjectResponse): Promise<string | undefined> {
  const c = page.cover;
  if (!c) return undefined;
  const raw = c.type === 'external' ? c.external.url : c.file.url;
  return localizeImage(raw);
}

const SECTION_ALIASES: Record<string, SectionId> = {
  profile: 'profile', 설정: 'profile', 프로필: 'profile',
  story: 'story', 스토리: 'story', 본편: 'story',
  logs: 'logs', log: 'logs', 로그: 'logs', 썰: 'logs',
  screenshots: 'screenshots', screenshot: 'screenshots', 스크린샷: 'screenshots',
  gallery: 'gallery', 갤러리: 'gallery', 그림: 'gallery',
};

function toSection(value: string): SectionId {
  return SECTION_ALIASES[value.trim().toLowerCase()] ?? 'story';
}

/** 노션 페이지 → Post. 공개 체크가 꺼져 있으면 null 을 돌려줍니다. */
export async function toPost(page: PageObjectResponse, tabLabelToId: Map<string, string>): Promise<Post | null> {
  const p = page.properties;
  if (!bool(p['공개'], true)) return null;

  const tabLabels = list(p['탭']);
  const tabs = tabLabels
    .map((label) => tabLabelToId.get(label.trim()))
    .filter((v): v is string => Boolean(v));

  return {
    id: page.id.replace(/-/g, ''),
    title: plain(p['제목']) || '제목 없음',
    tabs,
    section: toSection(plain(p['카테고리'])),
    characters: list(p['관련 캐릭터']),
    summary: plain(p['요약']),
    date: plain(p['날짜']) || undefined,
    tags: list(p['태그']),
    cover: await coverOf(page),
    images: await files(p['이미지']),
    order: num(p['정렬'], 0),
    html: '',
  };
}

/** 노션 페이지 → 연표 항목. [ 시기 / 관련 캐릭터 / 내용 ] 3필드만 씁니다. */
export function toTimelineEntry(page: PageObjectResponse): TimelineEntry {
  const p = page.properties;
  const period = (plain(p['시기']) || '신생').trim();
  return {
    id: page.id.replace(/-/g, ''),
    period,
    characters: list(p['관련 캐릭터']),
    body: plain(p['내용']),
    sortKey: periodSortKey(period),
    order: num(p['순서'], 0),
  };
}
