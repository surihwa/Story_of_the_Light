import { createHash } from 'node:crypto';
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { asset } from './url';

const OUT_DIR = path.resolve('public/notion-assets');

/**
 * 노션 파일 URL 은 약 1시간 뒤 만료됩니다.
 * 빌드 시점에 내려받아 public/ 아래로 고정시킨 뒤 로컬 경로를 돌려줍니다.
 * 실패하면 원본 URL 을 그대로 반환합니다(빌드를 멈추지 않습니다).
 */
export async function localizeImage(remoteUrl: string): Promise<string> {
  if (!remoteUrl) return '';
  if (!/^https?:\/\//.test(remoteUrl)) return remoteUrl;

  const hash = createHash('sha1').update(remoteUrl.split('?')[0]).digest('hex').slice(0, 16);
  const ext = (remoteUrl.split('?')[0].match(/\.(png|jpe?g|gif|webp|avif|svg)$/i)?.[1] ?? 'png').toLowerCase();
  const filename = `${hash}.${ext}`;
  const filepath = path.join(OUT_DIR, filename);
  const publicPath = asset(`notion-assets/${filename}`);

  try {
    await access(filepath);
    return publicPath;
  } catch {
    /* 아직 없음 — 내려받습니다 */
  }

  try {
    const res = await fetch(remoteUrl);
    if (!res.ok) throw new Error(`${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(filepath, buf);
    return publicPath;
  } catch (err) {
    console.warn(`[images] 내려받기 실패, 원본 URL 을 그대로 씁니다: ${remoteUrl}`);
    return remoteUrl;
  }
}
