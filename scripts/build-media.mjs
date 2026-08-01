/**
 * media/ 의 원본 이미지를 최적화해 public/media/ 로 내보내고, 목록을 매니페스트에 적습니다.
 *
 * 원본을 src/ 안에 두면 Astro(Vite)가 원본까지 배포물에 복사해서,
 * 사이트 용량이 저장소보다 커집니다. 그래서 원본은 처리 범위 밖에 두고
 * 이 스크립트가 필요한 크기만 만들어 냅니다.
 *
 * 이미 만들어 둔 결과물은 건너뛰므로, 두 번째 빌드부터는 거의 즉시 끝납니다.
 */
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = path.resolve('media');
const OUT = path.resolve('public/media');
const MANIFEST = path.resolve('src/generated/media.json');

/**
 * 카드용 둘과 확대창용 하나.
 *
 * 카드는 정사각형으로 잘라 보여 주므로 만들 때부터 잘라 둡니다.
 * 세로로 아주 긴 그림을 폭만 맞춰 저장하면 화면에 보이지도 않는 부분까지
 * 파일에 담겨 용량만 커집니다.
 */
const SIZES = [
  { key: 'sm', width: 400, quality: 76, square: true },
  { key: 'md', width: 800, quality: 78, square: true },
  { key: 'lg', width: 1600, quality: 82, square: false },
];

const EXT = /\.(jpe?g|png|gif|webp|avif)$/i;

/** `012_눈 내리는 쿠르잔.jpg` → { number: 12, caption: '눈 내리는 쿠르잔' } */
function parseFilename(filename) {
  const stem = filename.replace(/\.[^.]+$/, '');
  const match = stem.match(/^(\d+)(?:[_\-.\s]+(.*))?$/);
  if (match) return { number: Number(match[1]), caption: (match[2] ?? '').trim() };
  return { number: null, caption: stem.trim() };
}

async function walk(dir, base = '') {
  let out = [];
  let items;
  try {
    items = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const item of items) {
    if (item.name.startsWith('.')) continue;
    const abs = path.join(dir, item.name);
    const rel = base ? `${base}/${item.name}` : item.name;
    if (item.isDirectory()) out = out.concat(await walk(abs, rel));
    else if (EXT.test(item.name)) out.push({ abs, rel });
  }
  return out;
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function main() {
  const entries = [];
  let created = 0;
  let skipped = 0;

  for (const section of ['screenshots', 'gallery']) {
    const files = await walk(path.join(SRC, section));

    for (const { abs, rel } of files) {
      const parts = rel.split('/');
      const filename = parts.at(-1);
      // 폴더 없이 바로 넣은 파일은 세계 탭으로 보냅니다.
      const tabId = parts.length >= 2 ? parts[0] : 'world';
      const { number, caption } = parseFilename(filename);

      const buffer = await readFile(abs);
      const hash = createHash('sha1').update(buffer).digest('hex').slice(0, 12);
      const meta = await sharp(buffer).metadata();
      const outDir = path.join(OUT, section);
      await mkdir(outDir, { recursive: true });

      const variants = {};
      for (const size of SIZES) {
        const width = Math.min(size.width, meta.width ?? size.width);
        const name = `${hash}-${size.key}.webp`;
        const dest = path.join(outDir, name);

        if (await exists(dest)) skipped++;
        else {
          const pipeline = sharp(buffer);
          if (size.square) {
            // 가운데를 기준으로 정사각형으로 잘라 냅니다.
            pipeline.resize({ width, height: width, fit: 'cover', position: 'centre', withoutEnlargement: true });
          } else {
            pipeline.resize({ width, withoutEnlargement: true });
          }
          await pipeline.webp({ quality: size.quality }).toFile(dest);
          created++;
        }
        variants[size.key] = { src: `media/${section}/${name}`, width };
      }

      entries.push({
        id: `${section}/${rel}`,
        section,
        tabId,
        number,
        caption,
        width: meta.width ?? null,
        height: meta.height ?? null,
        variants,
      });
    }
  }

  // 지워진 원본에 딸린 결과물은 정리합니다.
  const keep = new Set(entries.flatMap((e) => Object.values(e.variants).map((v) => path.basename(v.src))));
  for (const section of ['screenshots', 'gallery']) {
    const dir = path.join(OUT, section);
    if (!(await exists(dir))) continue;
    for (const name of await readdir(dir)) {
      if (!keep.has(name)) await rm(path.join(dir, name));
    }
  }

  await mkdir(path.dirname(MANIFEST), { recursive: true });
  await writeFile(MANIFEST, JSON.stringify(entries, null, 2));

  console.log(
    `[media] 원본 ${entries.length}장 → 변환 ${created}개 생성, ${skipped}개 재사용`,
  );
}

main().catch((err) => {
  console.error('[media] 이미지 처리에 실패했습니다:', err.message);
  process.exit(1);
});
