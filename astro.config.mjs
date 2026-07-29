import { defineConfig } from 'astro/config';
import notionAssets from './integrations/notion-assets.mjs';

// GitHub Pages 배포 설정.
// - 프로젝트 페이지(https://USER.github.io/REPO)면 base 를 '/REPO' 로 둡니다.
// - 유저 페이지(https://USER.github.io)면 base 를 '/' 로 바꾸세요.
export default defineConfig({
  site: 'https://surihwa.github.io',
  base: '/Story_of_the_Light',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [notionAssets()],
});
