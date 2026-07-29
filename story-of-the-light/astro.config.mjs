import { defineConfig } from 'astro/config';

// GitHub Pages 배포 설정.
// - 프로젝트 페이지(https://USER.github.io/REPO)면 base 를 '/REPO' 로 둡니다.
// - 유저 페이지(https://USER.github.io)면 base 를 '/' 로 바꾸세요.
export default defineConfig({
  site: 'https://USERNAME.github.io',
  base: '/story-of-the-light',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
