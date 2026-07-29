import { cp, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 노션 이미지는 페이지를 렌더링하는 도중에 public/notion-assets/ 로 내려받습니다.
 * 그런데 Astro 는 public/ 복사를 렌더링보다 먼저 끝내기 때문에,
 * 그때 받은 파일들은 dist/ 에 들어가지 못한 채 사라집니다.
 * 빌드가 끝난 뒤 한 번 더 복사해서 이 구멍을 막습니다.
 */
export default function notionAssets({ dir = 'notion-assets' } = {}) {
  return {
    name: 'notion-assets',
    hooks: {
      'astro:build:done': async ({ dir: outDir, logger }) => {
        const from = path.resolve('public', dir);
        const to = path.join(fileURLToPath(outDir), dir);
        try {
          await access(from);
        } catch {
          return; // 받은 이미지가 없으면 할 일도 없습니다
        }
        await mkdir(to, { recursive: true });
        await cp(from, to, { recursive: true });
        logger.info(`노션 이미지를 ${dir}/ 로 복사했습니다.`);
      },
    },
  };
}
