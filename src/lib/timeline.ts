import { eras, preEraLabel } from '@config/timeline';
import type { TimelineEntry, TimelineGroup } from '@types';

/**
 * 시기 문자열을 정렬 가능한 숫자로 바꿉니다.
 * '-10년' → -10, '신생' → 0, '창천' → 1 …
 * 신생 이전 연도는 확장팩보다 항상 앞에 오도록 큰 음수 오프셋을 씁니다.
 */
export function periodSortKey(period: string): number {
  const p = period.trim();
  const year = p.match(/^(-?\d+)\s*년?$/);
  if (year) return -10000 + Number(year[1]);
  const era = eras.find((e) => p.startsWith(e.label));
  return era ? era.order : 9999;
}

/** 시기에 붙는 부연 설명 (확장팩 영문명 또는 '신생 기준') */
export function periodCaption(period: string): string {
  const p = period.trim();
  const year = p.match(/^(-?\d+)\s*년?$/);
  if (year) return `${preEraLabel} · 신생 기준 ${year[1]}년`;
  return eras.find((e) => p.startsWith(e.label))?.en ?? '';
}

/** 항목들을 시기 순으로 정렬한 뒤 같은 시기끼리 묶습니다. */
export function groupByPeriod(entries: TimelineEntry[]): TimelineGroup[] {
  const sorted = [...entries].sort(
    (a, b) => a.sortKey - b.sortKey || a.order - b.order || a.body.localeCompare(b.body, 'ko'),
  );

  const groups: TimelineGroup[] = [];
  for (const entry of sorted) {
    const last = groups.at(-1);
    if (last && last.period === entry.period) last.entries.push(entry);
    else groups.push({ period: entry.period, caption: periodCaption(entry.period), entries: [entry] });
  }
  return groups;
}
