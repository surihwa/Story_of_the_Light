import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { MediaItem, Post, SourceConfig, TimelineEntry } from '@types';
import { IMAGE_PROP, TAB_PROP, timelineSource } from '@config/sources';
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
  if (prop.type === 'multi_select') return prop.multi_select.map((o) => o.name).join(', ');
  return '';
}

function list(prop: Props[string] | undefined): string[] {
  if (!prop) return [];
  if (prop.type === 'multi_select') return prop.multi_select.map((o) => o.name);
  if (prop.type === 'select') return prop.select ? [prop.select.name] : [];
  if (prop.type === 'title') {
    const value = prop.title.map((t) => t.plain_text).join('').trim();
    return value ? [value] : [];
  }
  if (prop.type === 'rich_text') {
    const value = prop.rich_text.map((t) => t.plain_text).join('').trim();
    return value ? [value] : [];
  }
  return [];
}

/**
 * 번호를 읽습니다.
 * 숫자 속성과 ID(고유 ID) 속성을 모두 받아들이므로,
 * DB 마다 어느 쪽을 썼는지 신경 쓸 필요가 없습니다.
 */
function readNumber(prop: Props[string] | undefined): {
  value: number | null;
  label: string;
  kind: 'number' | 'id' | null;
} {
  if (prop?.type === 'number' && typeof prop.number === 'number') {
    return { value: prop.number, label: String(prop.number), kind: 'number' };
  }
  if (prop?.type === 'unique_id') {
    const n = prop.unique_id.number;
    if (typeof n !== 'number') return { value: null, label: '', kind: 'id' };
    const prefix = prop.unique_id.prefix;
    return { value: n, label: prefix ? `${prefix}-${n}` : String(n), kind: 'id' };
  }
  return { value: null, label: '', kind: null };
}

async function filesOf(prop: Props[string] | undefined): Promise<MediaItem[]> {
  if (prop?.type !== 'files') return [];
  const out: MediaItem[] = [];
  for (const f of prop.files) {
    // 노션에 직접 올린 파일은 file.url, 링크로 붙인 건 external.url 로 옵니다.
    // type 필드가 빠져 올 때도 있어 키 존재 여부로 판별합니다.
    const raw = 'external' in f ? f.external.url : f.file.url;
    out.push({ src: await localizeImage(raw), alt: f.name ?? '' });
  }
  return out;
}

async function coverOf(page: PageObjectResponse): Promise<string | undefined> {
  const c = page.cover;
  if (!c) return undefined;
  return localizeImage(c.type === 'external' ? c.external.url : c.file.url);
}

/**
 * 노션 페이지 하나를 Post 로 바꿉니다.
 * 본문(HTML · 평문 · 본문 이미지)은 content.ts 에서 채워 넣습니다.
 */
export async function toPost(
  page: PageObjectResponse,
  source: SourceConfig,
  tabLabelToId: Map<string, string>,
): Promise<Post> {
  const p = page.properties;
  const { value, label, kind } = readNumber(p[source.numberProp]);

  const tabs = list(p[TAB_PROP])
    .map((name) => tabLabelToId.get(name.trim()))
    .filter((v): v is string => Boolean(v));

  return {
    id: page.id.replace(/-/g, ''),
    section: source.section,
    number: value,
    numberLabel: label,
    numberKind: kind,
    title: source.titleProp ? plain(p[source.titleProp]) : '',
    tabs,
    characters: source.characterProp ? list(p[source.characterProp]) : [],
    date: (source.dateProp ? plain(p[source.dateProp]) : '') || undefined,
    cover: await coverOf(page),
    images: await filesOf(p[IMAGE_PROP]),
    html: '',
    text: '',
  };
}

/** 노션 페이지 → 연표 항목. [ 시기 / 관련 캐릭터 / 내용 ] 만 씁니다. */
export function toTimelineEntry(page: PageObjectResponse): TimelineEntry {
  const p = page.properties;
  const period = (plain(p[timelineSource.periodProp]) || '신생').trim();
  const order = p[timelineSource.orderProp];
  return {
    id: page.id.replace(/-/g, ''),
    period,
    characters: list(p[timelineSource.characterProp]),
    body: plain(p[timelineSource.bodyProp]),
    sortKey: periodSortKey(period),
    order: order?.type === 'number' && typeof order.number === 'number' ? order.number : 0,
  };
}
