import type { BlockObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import { localizeImage } from './images';

type WithChildren = BlockObjectResponse & { children?: BlockObjectResponse[] };

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
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
 * 노션 블록 배열을 본문 HTML 로 바꿉니다.
 * 지원: 문단 · 제목 1~3 · 목록 · 인용 · 콜아웃 · 구분선 · 이미지 · 코드 · 토글
 */
export async function renderBlocks(blocks: BlockObjectResponse[]): Promise<string> {
  const out: string[] = [];
  let listBuffer: string[] = [];
  let listTag: 'ul' | 'ol' | null = null;

  const flush = () => {
    if (listTag && listBuffer.length) out.push(`<${listTag}>${listBuffer.join('')}</${listTag}>`);
    listBuffer = [];
    listTag = null;
  };

  for (const block of blocks as WithChildren[]) {
    const kids = block.children ?? [];

    switch (block.type) {
      case 'bulleted_list_item':
      case 'numbered_list_item': {
        const tag = block.type === 'bulleted_list_item' ? 'ul' : 'ol';
        if (listTag !== tag) flush();
        listTag = tag;
        const inner = block.type === 'bulleted_list_item'
          ? rich(block.bulleted_list_item.rich_text)
          : rich(block.numbered_list_item.rich_text);
        const nested = kids.length ? await renderBlocks(kids) : '';
        listBuffer.push(`<li>${inner}${nested}</li>`);
        continue;
      }
      default:
        flush();
    }

    switch (block.type) {
      case 'paragraph': {
        const html = rich(block.paragraph.rich_text);
        if (html) out.push(`<p>${html}</p>`);
        break;
      }
      case 'heading_1':
        out.push(`<h2>${rich(block.heading_1.rich_text)}</h2>`);
        break;
      case 'heading_2':
        out.push(`<h3>${rich(block.heading_2.rich_text)}</h3>`);
        break;
      case 'heading_3':
        out.push(`<h4>${rich(block.heading_3.rich_text)}</h4>`);
        break;
      case 'quote':
        out.push(`<blockquote>${rich(block.quote.rich_text)}</blockquote>`);
        break;
      case 'callout':
        out.push(`<aside class="prose-callout">${rich(block.callout.rich_text)}</aside>`);
        break;
      case 'divider':
        out.push('<hr />');
        break;
      case 'code':
        out.push(`<pre><code>${escapeHtml(block.code.rich_text.map((t) => t.plain_text).join(''))}</code></pre>`);
        break;
      case 'image': {
        const src = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
        const local = await localizeImage(src);
        const caption = rich(block.image.caption);
        out.push(
          `<figure><img src="${local}" alt="${escapeHtml(block.image.caption?.[0]?.plain_text ?? '')}" loading="lazy" />` +
            (caption ? `<figcaption>${caption}</figcaption>` : '') +
            '</figure>',
        );
        break;
      }
      case 'toggle': {
        const nested = kids.length ? await renderBlocks(kids) : '';
        out.push(`<details><summary>${rich(block.toggle.rich_text)}</summary>${nested}</details>`);
        break;
      }
      default:
        break;
    }
  }

  flush();
  return out.join('\n');
}
