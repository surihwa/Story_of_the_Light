import { defineConfig } from 'astro/config';
import notionAssets from './integrations/notion-assets.mjs';

// GitHub Pages 배포 설정.
// 저장소 이름을 바꾸면 base 도 함께 바꿔야 CSS 와 내부 링크가 살아 있습니다.
export default defineConfig({
  site: 'https://surihwa.github.io',
  base: '/Story_of_the_Light',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [notionAssets()],
});
