import type { BlockObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import type { MediaItem } from '@types';
import { localizeImage } from './images';

type WithChildren = BlockObjectResponse & { children?: BlockObjectResponse[] };

export interface RenderedPage {
  html: string;
  /** 미리보기에 쓰는 평문 */
  text: string;
  /** 본문에 들어 있던 이미지들 */
  images: MediaItem[];
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

function plainOf(items: RichTextItemResponse[] = []): string {
  return items.map((t) => t.plain_text).join('');
}

function rich(items: RichTextItemResponse[] = []): string {
  return items
    .map((t) => {
      let html = escapeHtml(t.plain_text).replace(/\n/g, '<br />');
      const a = t.annotations;
      if (a.code) html = `<code>${html}</code>`;
      if (a.bold) html = `<strong>${html}</strong>`;
      if (a.italic) html = `<em>${html}</em>`;
      if (a.underline) html = `<u>${html}</u>`;
      if (a.strikethrough) html = `<s>${html}</s>`;
      if (t.href) html = `<a href="${escapeHtml(t.href)}" rel="noopener" target="_blank">${html}</a>`;
      return html;
    })
    .join('');
}

/**
 * 노션 블록 배열을 본문 HTML · 평문 · 이미지 목록으로 한 번에 바꿉니다.
 * 지원: 문단 · 제목 1~3 · 목록 · 인용 · 콜아웃 · 구분선 · 이미지 · 코드 · 토글
 */
export async function renderPage(blocks: BlockObjectResponse[]): Promise<RenderedPage> {
  const html: string[] = [];
  const lines: string[] = [];
  const images: MediaItem[] = [];

  let listBuffer: string[] = [];
  let listTag: 'ul' | 'ol' | null = null;

  const flush = () => {
    if (listTag && listBuffer.length) html.push(`<${listTag}>${listBuffer.join('')}</${listTag}>`);
    listBuffer = [];
    listTag = null;
  };

  for (const block of blocks as WithChildren[]) {
    const kids = block.children ?? [];

    if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
      const tag = block.type === 'bulleted_list_item' ? 'ul' : 'ol';
      if (listTag !== tag) flush();
      listTag = tag;
      const items = block.type === 'bulleted_list_item'
        ? block.bulleted_list_item.rich_text
        : block.numbered_list_item.rich_text;
      const nested = kids.length ? await renderPage(kids) : null;
      if (nested) { images.push(...nested.images); if (nested.text) lines.push(nested.text); }
      lines.push(plainOf(items));
      listBuffer.push(`<li>${rich(items)}${nested?.html ?? ''}</li>`);
      continue;
    }

    flush();

    switch (block.type) {
      case 'paragraph': {
        const inner = rich(block.paragraph.rich_text);
        if (inner) {
          html.push(`<p>${inner}</p>`);
          lines.push(plainOf(block.paragraph.rich_text));
        }
        break;
      }
      case 'heading_1':
        html.push(`<h2>${rich(block.heading_1.rich_text)}</h2>`);
        lines.push(plainOf(block.heading_1.rich_text));
        break;
      case 'heading_2':
        html.push(`<h3>${rich(block.heading_2.rich_text)}</h3>`);
        lines.push(plainOf(block.heading_2.rich_text));
        break;
      case 'heading_3':
        html.push(`<h4>${rich(block.heading_3.rich_text)}</h4>`);
        lines.push(plainOf(block.heading_3.rich_text));
        break;
      case 'quote':
        html.push(`<blockquote>${rich(block.quote.rich_text)}</blockquote>`);
        lines.push(plainOf(block.quote.rich_text));
        break;
      case 'callout':
        html.push(`<aside class="prose-callout">${rich(block.callout.rich_text)}</aside>`);
        lines.push(plainOf(block.callout.rich_text));
        break;
      case 'divider':
        html.push('<hr />');
        break;
      case 'code':
        html.push(`<pre><code>${escapeHtml(plainOf(block.code.rich_text))}</code></pre>`);
        break;
      case 'image': {
        const source = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
        const src = await localizeImage(source);
        const caption = plainOf(block.image.caption);
        images.push({ src, alt: caption, caption });
        html.push(
          `<figure><img src="${src}" alt="${escapeHtml(caption)}" loading="lazy" />` +
            (caption ? `<figcaption>${rich(block.image.caption)}</figcaption>` : '') +
            '</figure>',
        );
        break;
      }
      case 'toggle': {
        const nested = kids.length ? await renderPage(kids) : null;
        if (nested) { images.push(...nested.images); if (nested.text) lines.push(nested.text); }
        html.push(`<details><summary>${rich(block.toggle.rich_text)}</summary>${nested?.html ?? ''}</details>`);
        lines.push(plainOf(block.toggle.rich_text));
        break;
      }
      default:
        break;
    }
  }

  flush();

  return {
    html: html.join('\n'),
    text: lines.filter(Boolean).join('\n').trim(),
    images,
  };
}

/** 평문에서 카드 미리보기용 한 토막을 잘라 옵니다. */
export function excerpt(text: string, limit = 120): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > limit ? `${flat.slice(0, limit)}…` : flat;
}
