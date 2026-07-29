import { createHash } from 'node:crypto';
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { asset } from './url';

const OUT_DIR = path.resolve('public/notion-assets');

const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

/**
 * 노션 파일 URL 은 약 1시간 뒤 만료됩니다.
 * 빌드 시점에 내려받아 public/notion-assets/ 로 고정한 뒤 로컬 경로를 돌려줍니다.
 * (이 폴더는 integrations/notion-assets.mjs 가 빌드 후 dist/ 로 옮겨 줍니다.)
 * 실패하면 원본 URL 을 그대로 반환합니다 — 빌드를 멈추지는 않습니다.
 */
export async function localizeImage(remoteUrl: string): Promise<string> {
  if (!remoteUrl) return '';
  if (!/^https?:\/\//.test(remoteUrl)) return remoteUrl;

  const bare = remoteUrl.split('?')[0];
  const hash = createHash('sha1').update(bare).digest('hex').slice(0, 16);
  const urlExt = bare.match(/\.(png|jpe?g|gif|webp|avif|svg)$/i)?.[1]?.toLowerCase();

  // 확장자를 URL 에서 바로 알 수 있으면 이미 받아 둔 파일인지 먼저 확인합니다.
  if (urlExt) {
    const name = `${hash}.${urlExt === 'jpeg' ? 'jpg' : urlExt}`;
    try {
      await access(path.join(OUT_DIR, name));
      return asset(`notion-assets/${name}`);
    } catch {
      /* 없으면 아래에서 받습니다 */
    }
  }

  try {
    const res = await fetch(remoteUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // 노션이 내려 주는 URL 에는 확장자가 없을 때가 있어 Content-Type 으로 보완합니다.
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    const ext = urlExt === 'jpeg' ? 'jpg' : urlExt ?? EXT_BY_TYPE[type] ?? 'png';
    const name = `${hash}.${ext}`;

    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(path.join(OUT_DIR, name), Buffer.from(await res.arrayBuffer()));
    return asset(`notion-assets/${name}`);
  } catch (err) {
    console.warn(`[images] 내려받지 못해 원본 URL 을 그대로 씁니다 (약 1시간 뒤 만료): ${bare}`);
    console.warn(`         원인: ${(err as Error).message}`);
    return remoteUrl;
  }
}
