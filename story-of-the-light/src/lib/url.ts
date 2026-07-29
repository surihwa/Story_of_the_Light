const base = import.meta.env.BASE_URL ?? '/';

/** base 경로를 붙여 안전한 내부 링크를 만듭니다. */
export function url(path = ''): string {
  const clean = path.replace(/^\/+/, '');
  const root = base.endsWith('/') ? base : `${base}/`;
  return clean ? `${root}${clean}${clean.endsWith('/') ? '' : '/'}` : root;
}

/** 정적 파일(이미지 등) 링크. 끝에 슬래시를 붙이지 않습니다. */
export function asset(path = ''): string {
  const clean = path.replace(/^\/+/, '');
  const root = base.endsWith('/') ? base : `${base}/`;
  return `${root}${clean}`;
}
