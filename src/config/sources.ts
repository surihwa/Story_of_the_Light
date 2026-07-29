import type { SourceConfig } from '@types';

/**
 * 카테고리마다 노션 DB 를 하나씩 씁니다.
 * 속성 이름을 바꾸고 싶으면 노션에서 고친 뒤 여기 문자열만 맞춰 주세요.
 *
 * 공통 속성
 *  - `탭` (다중 선택) : 어느 메인 탭에 노출할지. tabs.ts 의 label 과 같아야 합니다.
 *  - 본문은 노션 페이지 안에 그냥 씁니다.
 *
 * direction
 *  - 'asc'  : 번호가 작은 것부터 (수동으로 매긴 순서를 그대로 따라갈 때)
 *  - 'desc' : 번호가 큰 것부터 (최신 업로드를 위로 올릴 때)
 */
export const sources: SourceConfig[] = [
  {
    section: 'profile',
    env: 'NOTION_PROFILE_DB',
    numberProp: '번호',
    direction: 'asc',
    titleProp: '캐릭터',
    characterProp: '캐릭터',
  },
  {
    section: 'story',
    env: 'NOTION_STORY_DB',
    numberProp: '번호',
    direction: 'asc',
    titleProp: '제목',
    dateProp: '날짜',
  },
  { section: 'logs', env: 'NOTION_LOGS_DB', numberProp: '번호', direction: 'desc' },
  { section: 'screenshots', env: 'NOTION_SCREENSHOTS_DB', numberProp: '번호', direction: 'desc' },
  { section: 'gallery', env: 'NOTION_GALLERY_DB', numberProp: '번호', direction: 'desc' },
];

/** 탭 속성 이름 (모든 DB 공통) */
export const TAB_PROP = '탭';

/** 이미지를 파일 속성으로도 붙일 수 있게 열어 둡니다. 없으면 본문 이미지만 씁니다. */
export const IMAGE_PROP = '이미지';

export const timelineSource = {
  env: 'NOTION_TIMELINE_DB',
  bodyProp: '내용',
  periodProp: '시기',
  characterProp: '관련 캐릭터',
  orderProp: '순서',
} as const;
