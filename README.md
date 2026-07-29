# Story of the Light

FINAL FANTASY XIV OC Archive — 자캐 · 페어 · 모험가 소대의 설정, 이야기, 스크린샷, 그림, 연표를 모아 두는 개인 아카이브.

Astro(SSG)로 정적 생성하고, 콘텐츠는 Notion API에서 빌드 시점에 읽어 옵니다. 배포 대상은 GitHub Pages입니다.

---

## 빠르게 띄워 보기

```bash
npm install
npm run dev      # http://localhost:4321/story-of-the-light/
```

`.env`가 없어도 샘플 데이터로 화면이 뜹니다. 색 조합과 레이아웃을 먼저 확인한 뒤 노션을 붙이세요.

노션을 연결하려면:

```bash
cp .env.example .env   # 토큰과 DB ID 채우기
npm run build
```

---

## 디렉토리 구조

```
src/
├── config/          ← 여기만 고치면 되는 설정 레이어
│   ├── site.ts          사이트 제목 · 부제 · 푸터 문구
│   ├── characters.ts    캐릭터 마스터 + 테마 컬러
│   ├── tabs.ts          메인 탭(수동 관리) / 서브 탭 정의
│   └── timeline.ts      확장팩 시간축 정의
│
├── lib/             ← 로직. 화면을 그리지 않습니다.
│   ├── notion.ts        Notion 클라이언트, DB 쿼리, 블록 재귀 조회
│   ├── mapper.ts        노션 속성 → Post / TimelineEntry 변환
│   ├── blocks.ts        노션 블록 → 본문 HTML 렌더러
│   ├── images.ts        만료되는 노션 이미지 URL을 빌드 때 내려받아 고정
│   ├── content.ts       콘텐츠 진입점(캐싱 + 샘플 데이터 폴백)
│   ├── filters.ts       탭·섹션 필터링, `세계 + Profile` 예외 처리
│   ├── timeline.ts      시기 정렬 · 그룹핑
│   ├── theme.ts         강조색 → CSS 변수 변환 (단독/이원화/그룹)
│   ├── url.ts           GitHub Pages base 경로 처리
│   └── mock.ts          토큰 없을 때 쓰는 샘플 데이터
│
├── styles/
│   ├── global.css       토큰 · 리셋 · 타이포그래피
│   ├── theme.css        FF14 라이트 UI(양각 패널, 모서리 컷, 배지)
│   └── components.css   헤더 · 내비 · 카드 · 연표 · 본문
│
├── components/      Header, MainNav, SubNav, PostCard, ProfileCard,
│                    MediaGrid, Timeline, TimelineEntry, CharacterBadge,
│                    EmptyState, Footer
├── layouts/         BaseLayout.astro
├── types/           공용 타입 정의
└── pages/
    ├── index.astro           홈
    ├── [tab]/[section].astro 메인탭 × 서브탭 (30쪽 자동 생성)
    ├── timeline/index.astro  연표
    ├── post/[id].astro       글 상세
    └── 404.astro
```

---

## 설정 파일 다루기

### 메인 탭 추가·수정 — `src/config/tabs.ts`

탭은 자동 생성이 아니라 이 배열이 곧 전부입니다. 한 덩어리를 복사해 붙이면 새 탭이 생기고, 라우트 5쪽이 함께 만들어집니다.

```ts
{
  id: 'lorenti',                    // URL 슬러그
  label: '로렌티',                   // 화면에 그대로 노출 + 노션 '탭' 옵션 이름
  caption: '로레트 & 이스노티',
  kind: 'dual',                     // single | dual | group | world | timeline
  characters: ['로레트', '이스노티'],
  accents: ['#F5C518', '#1B263B'],  // dual 이면 2개
}
```

`kind`가 색 적용 방식을 정합니다.

| kind | 적용 | 화면에서 보이는 차이 |
|---|---|---|
| `single` | 대표색 1개 | 카드 왼쪽에 색 띠 하나 |
| `dual` | 색 2개 | 카드 좌·우 테두리를 A/B 색으로 나눠 가짐 |
| `group` | 그룹 대표색 1개 | `single`과 같되 소대 색을 씀 |
| `world` | 중립색 | Profile에서 전체 프로필을 모아 보는 예외 적용 |
| `timeline` | 중립색 | 서브 탭 없이 연표 한 쪽만 |

### 캐릭터·색 추가 — `src/config/characters.ts`

객체의 **키가 노션 multi-select 옵션 이름과 정확히 같아야** 배지와 연표 색이 붙습니다.

### 확장팩 추가 — `src/config/timeline.ts`

`eras` 배열 끝에 `{ label: '새확장팩', en: '...', order: 7 }` 한 줄만 추가하면 연표가 알아서 새 구간을 만듭니다.

---

## 노션 DB 설계

두 개의 데이터베이스를 만들고, 통합(Integration)을 각 DB에 연결(Connections → 초대)하세요. 자세한 절차는 [docs/NOTION_SETUP.md](docs/NOTION_SETUP.md)에 있습니다.

### DB 1 — 게시물

| 속성 이름 | 형식 | 설명 |
|---|---|---|
| `제목` | 제목 | 카드와 상세 페이지의 제목 |
| `탭` | 다중 선택 | `서리화` `아젬` `상서고` `로렌티` `모험가 소대` `세계` — 여러 개 고르면 여러 탭에 함께 뜹니다 |
| `카테고리` | 선택 | `Profile` `Story` `Logs` `Screenshots` `Gallery` (한글 표기도 인식) |
| `관련 캐릭터` | 다중 선택 | 캐릭터 이름. 배지 색이 여기서 나옵니다 |
| `요약` | 텍스트 | 카드에 3줄까지 노출 |
| `날짜` | 날짜 | 비워도 됩니다 |
| `태그` | 다중 선택 | 자유 |
| `이미지` | 파일 | Screenshots · Gallery용. 여러 장 가능 |
| `정렬` | 숫자 | 클수록 위로. 비우면 0 |
| `공개` | 체크박스 | 끄면 빌드에서 제외 |

본문은 노션 페이지 안에 그냥 쓰면 됩니다. 문단 · 제목 · 목록 · 인용 · 콜아웃 · 구분선 · 이미지 · 코드 · 토글을 지원합니다.
**커버 이미지**는 노션 페이지 커버를 그대로 씁니다.

### DB 2 — 연표

작성 자유도를 위해 세 가지만 씁니다.

| 속성 이름 | 형식 | 예시 |
|---|---|---|
| `내용` | 제목 | `서리화가 빛의 축복을 받다.` |
| `시기` | 선택 | `-10년` `-1년` `신생` `창천` `홍련` `칠흑` `효월` `황금` `백은` |
| `관련 캐릭터` | 다중 선택 | `서리화`, `야슈톨라` |
| `순서` | 숫자 | (선택) 같은 시기 안에서의 순서 |

`시기`에 숫자를 쓰면 신생 이전 구간으로, 확장팩 이름을 쓰면 그 이후 구간으로 자동 정렬됩니다.

---

## GitHub Pages 배포

1. `astro.config.mjs`에서 `site`와 `base`를 실제 저장소에 맞게 고칩니다.
   - 프로젝트 페이지: `site: 'https://아이디.github.io'`, `base: '/저장소이름'`
   - 유저 페이지(`아이디.github.io` 저장소): `base: '/'`
2. 저장소 **Settings → Pages → Source**를 `GitHub Actions`로 바꿉니다.
3. **Settings → Secrets and variables → Actions**에 세 개를 등록합니다.
   `NOTION_TOKEN` · `NOTION_POSTS_DB` · `NOTION_TIMELINE_DB`
4. `main`에 푸시하면 배포됩니다.

노션 내용만 바꿨을 때는 **Actions 탭 → Deploy to GitHub Pages → Run workflow**로 다시 빌드하세요. 워크플로에는 매일 새벽 4시(KST) 자동 재빌드도 걸려 있습니다. 필요 없으면 `schedule` 블록을 지우면 됩니다.

---

## 디자인 메모

- 배경은 순백 대신 `#F8FAFC → #F1F5F9` 그러데이션이고, 그 위에 현재 탭 색이 3~7% 농도로 아주 옅게 깔립니다. 탭을 옮기면 지면 온도가 미세하게 바뀝니다.
- 탭과 패널은 FF14 UI 창처럼 **모서리를 깎아 냈고**(`clip-path`), 안쪽 1px 하이라이트로 양각을 냈습니다.
- 제목은 Marcellus, 본문 UI는 Pretendard, 이야기 본문은 Noto Serif KR, 수치·연도·라벨은 IBM Plex Mono로 역할을 나눴습니다.
- 연표의 **마름모 노드**가 이 사이트의 시그니처입니다. 관련 캐릭터가 둘 이상이면 마름모를 색 수만큼 잘라 칠하기 때문에, 스크롤만 내려도 누구의 이야기가 언제 겹치는지 한눈에 보입니다.
- 접근성: 키보드 포커스 링, `prefers-reduced-motion` 존중, 모바일 대응까지 기본으로 들어가 있습니다.
