import type { MainTab } from '@types';

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** 배경 위 대비를 보고 글자색을 흰/검으로 고릅니다. */
export function readableOn(hex: string): string {
  const [r, g, b] = hexToRgb(hex).split(' ').map(Number);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? '#1E293B' : '#FFFFFF';
}

/**
 * 탭 하나에 대한 CSS 커스텀 프로퍼티 문자열을 만듭니다.
 * 단독/그룹은 --accent 만, 페어는 --accent-2 까지 채웁니다.
 */
export function themeVars(tab: MainTab): string {
  const a = tab.accents[0];
  const b = tab.accents[1] ?? tab.accents[0];
  return [
    `--accent:${a}`,
    `--accent-rgb:${hexToRgb(a)}`,
    `--accent-2:${b}`,
    `--accent-2-rgb:${hexToRgb(b)}`,
    `--accent-ink:${readableOn(a)}`,
    `--dual:${tab.kind === 'dual' ? 1 : 0}`,
  ].join(';');
}

/** 캐릭터 색 하나를 인라인 변수로 */
export function colorVars(hex: string): string {
  return `--dot:${hex};--dot-rgb:${hexToRgb(hex)};--dot-ink:${readableOn(hex)}`;
}

export { hexToRgb };
