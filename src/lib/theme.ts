import type { MainTab } from '@types';

const PAPER = '#F1F5F9';

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hexToRgb(hex: string): string {
  return toRgb(hex).join(' ');
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

function relLuminance(hex: string): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = toRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 명암비 */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** 배경 위 대비를 보고 글자색을 흰/검으로 고릅니다. */
export function readableOn(hex: string): string {
  return contrast(hex, '#FFFFFF') >= contrast(hex, '#1E293B') ? '#FFFFFF' : '#1E293B';
}

/**
 * 밝은 지면 위에서 글자로 쓸 수 있게 색을 조정합니다.
 *
 * 로레트의 노랑이나 신학원의 하늘색처럼 옅은 색은 그대로 쓰면 거의 읽히지 않습니다.
 * 색조는 유지한 채 명도만 단계적으로 낮춰, 명암비 4.5:1 을 넘는 첫 값을 씁니다.
 * 원래 색은 테두리·배지·띠에 그대로 쓰이므로 인상은 유지됩니다.
 */
export function readableInk(hex: string, target = 4.5, bg = PAPER): string {
  if (contrast(hex, bg) >= target) return hex;

  const rgb = toRgb(hex);
  for (let step = 1; step <= 20; step++) {
    const factor = 1 - step * 0.05;
    const candidate = toHex([rgb[0] * factor, rgb[1] * factor, rgb[2] * factor]);
    if (contrast(candidate, bg) >= target) return candidate;
  }
  return '#1E293B';
}

/**
 * 중분류 하나에 대한 CSS 커스텀 프로퍼티를 만듭니다.
 *
 *  --accent       원래 색. 테두리 · 띠 · 배경 틴트에 씁니다.
 *  --accent-ink   그 색을 배경으로 깔았을 때 위에 얹을 글자색.
 *  --accent-text  밝은 지면 위에서 글자로 쓸 수 있게 낮춘 색.
 */
export function themeVars(tab: MainTab): string {
  const a = tab.accents[0];
  const b = tab.accents[1] ?? tab.accents[0];
  return [
    `--accent:${a}`,
    `--accent-rgb:${hexToRgb(a)}`,
    `--accent-text:${readableInk(a)}`,
    `--accent-2:${b}`,
    `--accent-2-rgb:${hexToRgb(b)}`,
    `--accent-2-text:${readableInk(b)}`,
    `--accent-ink:${readableOn(a)}`,
    `--dual:${tab.kind === 'dual' ? 1 : 0}`,
  ].join(';');
}

/** 캐릭터 색 하나를 인라인 변수로 */
export function colorVars(hex: string): string {
  return [
    `--dot:${hex}`,
    `--dot-rgb:${hexToRgb(hex)}`,
    `--dot-text:${readableInk(hex)}`,
    `--dot-ink:${readableOn(hex)}`,
  ].join(';');
}

export { hexToRgb };
