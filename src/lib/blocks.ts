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

/** external / file 두 형태 모두에서 URL 을 꺼냅니다. */
function urlOf(source: { type?: string; external?: { url: string }; file?: { url: string } }): string {
  if (source.external?.url) return source.external.url;
  if (source.file?.url) return source.file.url;
  return '';
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i;

/** 지원하지 않는 블록을 만나면 빌드 로그로 알려 줍니다. */
const unsupported = new Set<string>();
export function reportUnsupportedBlocks(): void {
  if (unsupported.size === 0) return;
  console.warn(
    `[blocks] 아직 다루지 않는 노션 블록이 있어 본문에서 빠졌습니다: ${[...unsupported].join(', ')}`,
  );
  unsupported.clear();
}

/**
 * 노션 블록 배열을 본문 HTML · 평문 · 이미지 목록으로 바꿉니다.
 *
 * 노션에는 블록 종류가 많아서, 처리하지 않은 종류는 화면에서 조용히 사라집니다.
 * 특히 2단 배치(column_list)나 토글 제목은 안에 든 내용까지 통째로 없어지므로
 * 컨테이너 성격의 블록은 반드시 자식을 따라 들어가야 합니다.
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

  /** 자식 블록을 재귀로 그리고 결과를 모읍니다. */
  const renderChildren = async (kids: BlockObjectResponse[]): Promise<RenderedPage | null> => {
    if (!kids.length) return null;
    const nested = await renderPage(kids);
    images.push(...nested.images);
    if (nested.text) lines.push(nested.text);
    return nested;
  };

  /** 이미지 한 장을 html·images 에 더합니다. */
  const pushImage = async (rawUrl: string, caption: string, captionHtml: string) => {
    if (!rawUrl) return;
    const src = await localizeImage(rawUrl);
    images.push({ src, alt: caption, caption });
    html.push(
      `<figure><img src="${src}" alt="${escapeHtml(caption)}" loading="lazy" />` +
        (captionHtml ? `<figcaption>${captionHtml}</figcaption>` : '') +
        '</figure>',
    );
  };

  for (const block of blocks as WithChildren[]) {
    const kids = block.children ?? [];

    // ---- 목록은 연속된 항목을 하나로 묶어야 하므로 따로 처리합니다 ----
    if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item' || block.type === 'to_do') {
      const tag = block.type === 'numbered_list_item' ? 'ol' : 'ul';
      if (listTag !== tag) flush();
      listTag = tag;

      let items: RichTextItemResponse[];
      let prefix = '';
      if (block.type === 'bulleted_list_item') items = block.bulleted_list_item.rich_text;
      else if (block.type === 'numbered_list_item') items = block.numbered_list_item.rich_text;
      else {
        items = block.to_do.rich_text;
        prefix = `<input type="checkbox" disabled ${block.to_do.checked ? 'checked' : ''} /> `;
      }

      const nested = await renderChildren(kids);
      lines.push(plainOf(items));
      listBuffer.push(
        `<li${block.type === 'to_do' ? ' class="prose-todo"' : ''}>${prefix}${rich(items)}${nested?.html ?? ''}</li>`,
      );
      continue;
    }

    flush();

    /*
     * 제목은 단계를 가리지 않고 한 곳에서 처리합니다.
     *
     * heading_1~3 만 하드코딩해 두었더니 노션이 내려보낸 heading_4 가
     * 통째로 사라졌습니다. 앞으로 heading_5 가 생겨도 같은 일이 없도록
     * 'heading_' 으로 시작하는 블록은 전부 받습니다.
     *
     * 페이지 제목이 h1 이므로 노션의 1단계는 h2 부터 시작하고,
     * HTML 에는 h6 까지만 있으므로 그 아래는 h6 로 모읍니다.
     */
    const headingLevel = /^heading_(\d+)$/.exec(block.type)?.[1];
    if (headingLevel) {
      const data = (block as unknown as Record<string, {
        rich_text?: RichTextItemResponse[];
        is_toggleable?: boolean;
      }>)[block.type];
      const items = data?.rich_text ?? [];
      const tag = `h${Math.min(Number(headingLevel) + 1, 6)}`;

      lines.push(plainOf(items));
      const nested = await renderChildren(kids);

      if (data?.is_toggleable && nested?.html) {
        html.push(
          `<details class="prose-toggle" open><summary><${tag}>${rich(items)}</${tag}></summary>${nested.html}</details>`,
        );
      } else {
        html.push(`<${tag}>${rich(items)}</${tag}>`);
        if (nested?.html) html.push(nested.html);
      }
      continue;
    }

    switch (block.type) {
      case 'paragraph': {
        const inner = rich(block.paragraph.rich_text);
        const nested = await renderChildren(kids);
        if (inner || nested?.html) {
          html.push(`<p>${inner}</p>`);
          if (nested?.html) html.push(nested.html);
          lines.push(plainOf(block.paragraph.rich_text));
        }
        break;
      }

      case 'quote': {
        const nested = await renderChildren(kids);
        html.push(`<blockquote>${rich(block.quote.rich_text)}${nested?.html ?? ''}</blockquote>`);
        lines.push(plainOf(block.quote.rich_text));
        break;
      }

      case 'callout': {
        const nested = await renderChildren(kids);
        html.push(`<aside class="prose-callout">${rich(block.callout.rich_text)}${nested?.html ?? ''}</aside>`);
        lines.push(plainOf(block.callout.rich_text));
        break;
      }

      case 'divider':
        html.push('<hr />');
        break;

      case 'code':
        html.push(`<pre><code>${escapeHtml(plainOf(block.code.rich_text))}</code></pre>`);
        break;

      case 'equation':
        html.push(`<p class="prose-equation"><code>${escapeHtml(block.equation.expression)}</code></p>`);
        break;

      // ---- 이미지 ----
      case 'image':
        await pushImage(
          urlOf(block.image),
          plainOf(block.image.caption),
          rich(block.image.caption),
        );
        break;

      /**
       * '파일' 블록으로 올린 이미지. 노션에서 끌어다 놓는 위치에 따라
       * image 가 아니라 file 로 저장되는 경우가 있어 함께 받아 줍니다.
       */
      case 'file': {
        const src = urlOf(block.file);
        const caption = plainOf(block.file.caption);
        const name = 'name' in block.file ? (block.file as { name?: string }).name ?? '' : '';
        if (IMAGE_EXT.test(src.split('?')[0]) || IMAGE_EXT.test(name)) {
          await pushImage(src, caption || name, rich(block.file.caption));
        } else if (src) {
          html.push(
            `<p><a href="${escapeHtml(src)}" rel="noopener" target="_blank">${escapeHtml(name || caption || '첨부 파일')}</a></p>`,
          );
        }
        break;
      }

      /** 외부 임베드. 이미지 주소면 그림으로, 아니면 링크로 남깁니다. */
      case 'embed': {
        const src = block.embed.url;
        if (IMAGE_EXT.test(src.split('?')[0])) {
          await pushImage(src, plainOf(block.embed.caption), rich(block.embed.caption));
        } else if (src) {
          html.push(`<p><a href="${escapeHtml(src)}" rel="noopener" target="_blank">${escapeHtml(src)}</a></p>`);
        }
        break;
      }

      case 'video': {
        const src = urlOf(block.video);
        if (src) {
          html.push(`<p><a href="${escapeHtml(src)}" rel="noopener" target="_blank">영상 보기</a></p>`);
        }
        break;
      }

      case 'pdf': {
        const src = urlOf(block.pdf);
        if (src) {
          html.push(`<p><a href="${escapeHtml(src)}" rel="noopener" target="_blank">PDF 보기</a></p>`);
        }
        break;
      }

      case 'audio': {
        const src = urlOf(block.audio);
        if (src) {
          html.push(`<p><audio controls src="${escapeHtml(src)}"></audio></p>`);
        }
        break;
      }

      case 'bookmark':
      case 'link_preview': {
        const src = block.type === 'bookmark' ? block.bookmark.url : block.link_preview.url;
        const caption = block.type === 'bookmark' ? rich(block.bookmark.caption) : '';
        if (src) {
          html.push(
            `<p class="prose-bookmark"><a href="${escapeHtml(src)}" rel="noopener" target="_blank">${caption || escapeHtml(src)}</a></p>`,
          );
        }
        break;
      }

      case 'toggle': {
        const nested = await renderChildren(kids);
        html.push(`<details><summary>${rich(block.toggle.rich_text)}</summary>${nested?.html ?? ''}</details>`);
        lines.push(plainOf(block.toggle.rich_text));
        break;
      }

      /**
       * 2단·3단 배치. 컨테이너 자체는 그릴 것이 없지만,
       * 자식을 따라 들어가지 않으면 안에 든 이미지와 글이 통째로 사라집니다.
       */
      case 'column_list':
      case 'column': {
        const nested = await renderChildren(kids);
        if (nested?.html) {
          html.push(
            block.type === 'column_list'
              ? `<div class="prose-columns">${nested.html}</div>`
              : `<div class="prose-column">${nested.html}</div>`,
          );
        }
        break;
      }

      /** 동기화 블록도 껍데기일 뿐이라 내용만 꺼내 씁니다. */
      case 'synced_block': {
        const nested = await renderChildren(kids);
        if (nested?.html) html.push(nested.html);
        break;
      }

      case 'table': {
        const nested = await renderChildren(kids);
        if (nested?.html) html.push(`<table class="prose-table"><tbody>${nested.html}</tbody></table>`);
        break;
      }

      case 'table_row': {
        const cells = block.table_row.cells
          .map((cell) => `<td>${rich(cell)}</td>`)
          .join('');
        html.push(`<tr>${cells}</tr>`);
        lines.push(block.table_row.cells.map((cell) => plainOf(cell)).join(' '));
        break;
      }

      /** 목차·하위 페이지·버튼 등은 정적 사이트에서 의미가 없어 건너뜁니다. */
      case 'table_of_contents':
      case 'breadcrumb':
      case 'child_page':
      case 'child_database':
      case 'link_to_page':
      case 'template':
      case 'unsupported':
        break;

      default: {
        // 새 블록 종류가 조용히 사라지지 않도록 기록해 둡니다.
        unsupported.add((block as { type: string }).type);
        const nested = await renderChildren(kids);
        if (nested?.html) html.push(nested.html);
        break;
      }
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
