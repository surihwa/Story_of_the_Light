# Story of the Light

FINAL FANTASY XIV OC ARCHIVE — 자캐 · 페어 · 모험가 소대의 설정, 이야기, 스크린샷, 그림, 연표를 모아 두는 개인 아카이브.

Astro(SSG)로 정적 생성하고, 콘텐츠는 Notion API에서 빌드 시점에 읽어 옵니다. 배포 대상은 GitHub Pages입니다.

---

## 빠르게 띄워 보기

```bash
npm install
npm run dev      # http://localhost:4321/Story_of_the_Light/
```

`.env`가 없어도 샘플 데이터로 화면이 뜹니다. 색 조합과 레이아웃을 먼저 확인한 뒤 노션을 붙이세요.

```bash
cp .env.example .env   # 토큰과 DB ID 채우기
npm run build
```

---

## 디렉토리 구조

```
integrations/
└── notion-assets.mjs    빌드 후 노션 이미지를 dist/ 로 옮기는 Astro 통합

src/
├── config/          ← 여기만 고치면 되는 설정 레이어
│   ├── site.ts          사이트 제목 · 부제 · 푸터 문구
│   ├── characters.ts    캐릭터 마스터 + 테마 컬러
│   ├── tabs.ts          메인 탭(수동 관리) / 서브 탭 정의
│   ├── sources.ts       카테고리별 노션 DB · 속성 이름 · 정렬 방향
│   └── timeline.ts      확장팩 시간축 정의
│
├── lib/             ← 로직. 화면을 그리지 않습니다.
│   ├── notion.ts        Notion 클라이언트, DB 쿼리, 블록 재귀 조회, 속도 제한·재시도
│   ├── notion-error.ts  노션 오류를 읽을 수 있는 안내로 변환
│   ├── mapper.ts        노션 속성 → Post / TimelineEntry 변환
│   ├── blocks.ts        노션 블록 → 본문 HTML · 평문 · 이미지 목록 (29종 처리)
│   ├── images.ts        만료되는 노션 이미지 URL을 빌드 때 내려받아 고정
│   ├── content.ts       콘텐츠 진입점(캐싱 + 샘플 데이터 폴백)
│   ├── filters.ts       탭·섹션 필터링, `세계 + Profile` 예외, 번호 정렬
│   ├── timeline.ts      시기 정렬 · 그룹핑
│   ├── theme.ts         강조색 → CSS 변수 변환 (단독/이원화/그룹)
│   ├── url.ts           GitHub Pages base 경로 처리
│   └── mock.ts          설정이 없을 때 쓰는 샘플 데이터
│
├── styles/
│   ├── global.css       토큰 · 리셋 · 타이포그래피
│   ├── theme.css        FF14 라이트 UI(양각 패널, 모서리 컷, 배지)
│   └── components.css   헤더 · 내비 · 카드 · 로그 다단 · 연표 · 본문
│
├── components/      Header, MainNav, SubNav, SectionView, PostCard, LogCard,
│                    ProfileCard,
│                    Pagination, Timeline, TimelineEntry, CharacterBadge,
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

## 노션 DB 설계

카테고리마다 DB를 하나씩 씁니다. 만드는 절차는 [docs/NOTION_SETUP.md](docs/NOTION_SETUP.md)에 있습니다.

**공통 규칙**

- `탭`(다중 선택)은 세 DB 모두에 있어야 하고, 옵션 이름은 `src/config/tabs.ts`의 `label`과 같아야 합니다. → `서리화` `카르네아데스` `로레트 모린` `이스노티 헤멜` `상서고` `로렌티` `이브리화` `흑와단` `세계`
- 이름을 바꾼 탭(`카르네아데스` ← 아젬, `이브리화` ← 신학원)은 **예전 이름으로 적어 둔 글도 그대로 인식됩니다.** 별칭으로 등록해 두었으니 노션을 고치지 않아도 됩니다.
- 이름이 긴 셋(`로레트 모린` `이스노티 헤멜` `야슈톨라 룰`)은 **성 없이 적어도 인식됩니다.** `config`에 별칭으로 등록해 뒀으니, 노션에 이미 짧은 이름으로 입력해 두셨다면 고치지 않아도 됩니다. 화면에는 항상 풀네임이 나옵니다.
- 본문은 노션 페이지 안에 그냥 씁니다. 문단 · 제목 · 목록 · 인용 · 콜아웃 · 구분선 · 이미지 · 코드 · 토글을 지원합니다.
- 공개 여부를 따로 두지 않습니다. DB에 있는 행은 전부 사이트에 올라갑니다.

| DB | 제목 속성 | 번호 | 그 외 |
|---|---|---|---|
| Profile | `캐릭터` | `번호` (숫자) | `탭` |
| Story | `제목` | `번호` (숫자) | `탭`, `날짜` |
| Logs | (비워 둠) | `번호` (ID) | `탭` |
| 연표 | `내용` | — | `시기`, `관련 캐릭터`, `순서`(선택) |

> 노션은 DB마다 제목 속성을 하나 반드시 갖습니다. Logs는 그 칸을 그냥 비워 두면 되고, 사이트에서도 쓰이지 않습니다.

`번호`는 숫자 속성이든 ID 속성이든 똑같이 읽습니다. ID 속성에 접두사를 지정하면(`LOG` 등) 사이트에도 `LOG-12` 형태로 표시됩니다.

정렬 방향은 **번호 속성 유형을 보고 자동으로 정해집니다.**

- **숫자 속성** → 오름차순. 직접 매긴 1, 2, 3…이 곧 읽는 순서니까요. (Profile, Story)
- **ID 속성** → 내림차순. 자동 증가하므로 가장 나중에 올린 것이 맨 위로 옵니다. (Logs)

어느 카테고리의 `번호`를 숫자에서 ID로 바꾸면 정렬도 알아서 따라갑니다. 이 판단을 뒤집고 싶을 때만 `src/config/sources.ts`의 해당 항목에 `direction: 'asc'` 또는 `'desc'`를 적어 주세요.

---

---

## 설정 파일 다루기

### 탭 구조 — `src/config/tabs.ts`

내비게이션은 세 단입니다.

```
OC · Pair · World          ← 대분류 (groups)
  └ 서리화 · 아젬 · 로레트 · 이스노티   ← 중분류 (mainTabs)
      └ Profile · Story · Logs   ← 소분류 (subTabs)
```

| 대분류 | 중분류 | 주소 | 색 |
|---|---|---|---|
| OC | 서리화 | `/surihwa/` | `#342151` |
| OC | 카르네아데스 | `/azem/` | `#ff9302` |
| OC | 로레트 모린 | `/laurette/` | `#fae04f` |
| OC | 이스노티 헤멜 | `/isnotti/` | `#0f163a` |
| Pair | 상서고 | `/frost_library/` | `#342151` + `#6e14b8` |
| Pair | 로렌티 | `/laurentti/` | `#fae04f` + `#0f163a` |
| Pair | 이브리화 | `/scholasticate/` | `#b9d9ec` + `#342151` |
| Pair | 흑와단 | `/maelstrom/` | `#af1919` |
| World | 세계 | `/world/` | `#6be3fb` |
| World | 연표 | `/timeline/` | `#94cfef` |

중분류를 추가하려면 `mainTabs` 배열에 한 덩어리를 붙이면 됩니다. 라우트 5쪽이 함께 만들어집니다.

```ts
{
  id: 'laurentti',                  // 주소에 쓰이는 이름
  group: 'pair',                    // 어느 대분류에 넣을지
  label: '로렌티',                   // 화면에 그대로 노출 + 노션 '탭' 옵션 이름
  caption: '로레트 & 이스노티',
  kind: 'dual',                     // single | dual | group | world | timeline
  characters: ['로레트', '이스노티'],
  accents: ['#fae04f', '#0f163a'],  // dual 이면 2개
}
```

대분류 자체를 늘리거나 이름을 바꾸려면 같은 파일의 `groups` 배열을 고칩니다.

| kind | 적용 | 화면에서 보이는 차이 |
|---|---|---|
| `single` | 대표색 1개 | 카드 왼쪽에 색 띠 하나 |
| `dual` | 색 2개 | 카드 좌·우 테두리를 A/B 색으로 나눠 가짐 |
| `group` | 그룹 대표색 1개 | `single`과 같되 소대 색을 씀 |
| `world` | 중립색 | Profile에서 전체 프로필을 모아 보는 예외 적용 |
| `timeline` | 중립색 | 서브 탭 없이 연표 한 쪽만 |

### 속성 이름·정렬 바꾸기 — `src/config/sources.ts`

노션에서 속성 이름을 바꿨다면 이 파일의 문자열만 맞춰 주면 됩니다.

### 캐릭터·색 추가 — `src/config/characters.ts`

객체의 **키가 노션 `캐릭터` 옵션 이름과 정확히 같아야** 배지와 연표 색이 붙습니다.

### 확장팩 추가 — `src/config/timeline.ts`

`eras` 배열 끝에 `{ label: '새확장팩', en: '...', order: 7 }` 한 줄만 추가하면 연표가 알아서 새 구간을 만듭니다.

---

## GitHub Pages 배포

1. `astro.config.mjs`는 `https://surihwa.github.io/Story_of_the_Light/`에 맞춰 설정돼 있습니다.
   저장소 이름을 바꾸면 `base`도 함께 바꿔야 CSS와 내부 링크가 살아 있습니다.
2. 저장소 **Settings → Pages → Source**를 `GitHub Actions`로 바꿉니다.
3. **Settings → Secrets and variables → Actions**에 다섯 개를 등록합니다.
   `NOTION_TOKEN` · `NOTION_PROFILE_DB` · `NOTION_STORY_DB` · `NOTION_LOGS_DB` · `NOTION_TIMELINE_DB`
4. `main`에 푸시하면 배포됩니다.

토큰과 DB ID는 코드에 넣지 않습니다. 내 컴퓨터에서는 `.gitignore`된 `.env`가, 깃허브에서는 저장소 Secrets가 값을 공급하고, 빌드 결과물에는 남지 않습니다. 시크릿을 빠뜨린 채 배포되는 것을 막기 위해 워크플로의 `Check secrets` 단계와 빌드 코드가 이중으로 검사합니다. 자세한 절차는 [docs/NOTION_SETUP.md](docs/NOTION_SETUP.md#6-깃허브에-올릴-때--토큰은-코드에-넣지-않습니다)에 있습니다.

노션 내용만 바꿨을 때는 **Actions 탭 → Deploy to GitHub Pages → Run workflow**로 다시 빌드하세요. 매일 새벽 4시(KST) 자동 재빌드도 걸려 있습니다. 필요 없으면 `schedule` 블록을 지우면 됩니다.

---

## 디자인 메모

- 배경은 순백 대신 `#F8FAFC → #F1F5F9` 그러데이션이고, 그 위에 현재 탭 색이 3~7% 농도로 아주 옅게 깔립니다. 탭을 옮기면 지면 온도가 미세하게 바뀝니다.
- **색은 두 갈래로 나뉘어 쓰입니다.** 로레트의 노랑(`#fae04f`)이나 신학원의 하늘색(`#b9d9ec`)은 밝은 지면 위 글자로 쓰면 읽히지 않습니다. 그래서 테두리·띠·배지에는 지정한 색을 그대로 쓰고, 글자에는 색조를 유지한 채 명암비 4.5:1을 넘길 때까지 명도만 낮춘 값(`--accent-text`)을 씁니다. 이 계산은 `src/lib/theme.ts`가 빌드 때 자동으로 하므로, 새 색을 넣을 때 따로 신경 쓸 필요가 없습니다.
- 대분류 이름 아래 띠에는 그 안에 든 중분류 색이 순서대로 이어 붙습니다. OC를 보면 남보라–주황–노랑–남색이 한 줄로 지나갑니다.
- 탭과 패널은 FF14 UI 창처럼 **모서리를 깎아 냈고**(`clip-path`), 안쪽 1px 하이라이트로 양각을 냈습니다.
- 제목은 Marcellus, 이야기 본문(Story)은 Noto Serif KR, 번호·연도·라벨은 IBM Plex Mono로 역할을 나눴습니다. 죽 읽어 내려가는 Story만 세리프를 쓰고, 훑어보는 성격의 **Profile과 Logs는 Pretendard 산세리프에 한 단계 작은 글자**를 씁니다. Profile은 본문을 줄인 대신 제목 크기를 그대로 두어 대비가 1.31배에서 1.59배로 커졌습니다.
- Logs는 제목 없이 본문 전문을 한 장씩 위아래로 쌓아 보여 주고, **한 쪽에 10개씩 끊어 쪽을 넘깁니다.** 쪽당 개수는 `src/config/sources.ts`의 `LOGS_PER_PAGE`에서 바꿉니다. 주소는 1쪽이 `/탭/logs/`, 2쪽부터 `/탭/logs/2/` 형태이고, 쪽마다 HTML이 따로 생성되므로 링크를 그대로 공유할 수 있습니다. 다만 카드를 화면 폭 전체로 늘리면 한 줄이 너무 길어져 눈이 줄을 놓치므로, `820px`에서 멈추고 가운데로 모읍니다. 이 값은 `src/styles/components.css`의 `.log-list`에서 바꿀 수 있습니다.
- 연표의 **마름모 노드**가 이 사이트의 시그니처입니다. 관련 캐릭터가 둘 이상이면 마름모를 색 수만큼 잘라 칠하기 때문에, 스크롤만 내려도 누구의 이야기가 언제 겹치는지 한눈에 보입니다.
- 접근성: 키보드 포커스 링, `prefers-reduced-motion` 존중, 모바일 대응까지 기본으로 들어가 있습니다.

## 노션 본문에서 지원하는 블록

문단, 제목 1~3(토글 제목 포함), 글머리·번호 목록, 체크박스 목록, 인용, 콜아웃, 구분선, 코드, 수식, 이미지, 파일, 임베드, 영상, PDF, 북마크, 토글, **2·3단 배치**, 동기화 블록, 표.

노션에는 블록 종류가 많아 처리하지 않은 것은 화면에서 조용히 사라집니다. 그래서 다루지 못한 블록을 만나면 빌드 로그에 남깁니다.

```
[blocks] 아직 다루지 않는 노션 블록이 있어 본문에서 빠졌습니다: xxx
```

이 경고가 보이면 `src/lib/blocks.ts`의 `switch`에 해당 타입을 추가하면 됩니다. 컨테이너 성격의 블록(자식을 품는 블록)은 반드시 자식을 따라 들어가야 안에 든 내용이 보존됩니다.

## 노션 속도 제한

노션은 통합 하나당 초당 3회로 요청을 제한합니다. 글이 수십 건만 되어도 본문 블록을 읽느라 수백 번 호출하게 되는데, 제한에 걸리면 `rate_limited` 로 **빌드가 통째로 실패합니다.**

그래서 `src/lib/notion.ts` 가 모든 호출을 한 줄로 세워 약 420ms 간격(초당 2.6회)으로 내보내고, 그래도 막히면 노션이 알려 주는 `Retry-After` 만큼 기다렸다 최대 5번까지 다시 시도합니다. 404 같은 되돌릴 수 없는 오류는 재시도하지 않고 바로 알려 줍니다.

글이 아주 많아져 빌드가 버겁다면 `MIN_INTERVAL` 을 올려 더 완만하게 만들 수 있습니다. 반대로 줄이면 빨라지지만 제한에 걸릴 위험이 커집니다.
