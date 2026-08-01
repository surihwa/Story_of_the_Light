import type { SourceConfig } from '@types';

/**
 * 카테고리마다 노션 DB 를 하나씩 씁니다.
 * 속성 이름을 바꾸고 싶으면 노션에서 고친 뒤 여기 문자열만 맞춰 주세요.
 *
 * 공통 속성
 *  - `탭` (다중 선택) : 어느 메인 탭에 노출할지. tabs.ts 의 label 과 같아야 합니다.
 *  - 본문은 노션 페이지 안에 그냥 씁니다.
 *
 * 정렬 방향은 `번호` 속성 유형을 보고 자동으로 정합니다.
 *  - 숫자 속성 → 오름차순. 1화, 2화… 직접 매긴 순서를 그대로 따라갑니다.
 *  - ID 속성   → 내림차순. 가장 나중에 추가한 것이 맨 위로 옵니다.
 * 이 판단을 뒤집고 싶은 카테고리에만 `direction: 'asc' | 'desc'` 를 적어 주세요.
 */
export const sources: SourceConfig[] = [
  {
    section: 'profile',
    env: 'NOTION_PROFILE_DB',
    numberProp: '번호',
    titleProp: '캐릭터',
    characterProp: '캐릭터',
  },
  {
    section: 'story',
    env: 'NOTION_STORY_DB',
    numberProp: '번호',
    titleProp: '제목',
    dateProp: '날짜',
  },
  { section: 'logs', env: 'NOTION_LOGS_DB', numberProp: '번호' },
];

/**
 * Screenshots · Gallery 는 노션을 쓰지 않습니다.
 * 저장소의 `src/media/{screenshots|gallery}/{탭 id}/` 폴더에 파일을 넣으면 됩니다.
 * 자세한 규칙은 src/media/README.md 를 보세요.
 */
export const fileSections = ['screenshots', 'gallery'] as const;

/** 탭 속성 이름 (모든 DB 공통) */
export const TAB_PROP = '탭';

/**
 * Profile · Story · Logs 에서 파일 속성으로 이미지를 붙이고 싶을 때 쓰는 속성 이름.
 * 없어도 되고, 노션 본문에 그냥 넣어도 됩니다.
 */
export const IMAGE_PROP = '이미지';

export const timelineSource = {
  env: 'NOTION_TIMELINE_DB',
  bodyProp: '내용',
  periodProp: '시기',
  characterProp: '관련 캐릭터',
  orderProp: '순서',
} as const;
