/** 캐릭터 한 명(또는 그룹)의 마스터 정보 */
export interface Character {
  id: string;
  name: string;
  role: string;
  /** 테마 강조색 (HEX) */
  color: string;
  note?: string;
}

export type TabKind = 'single' | 'dual' | 'group' | 'world' | 'timeline';

export interface MainTab {
  /** URL 슬러그 */
  id: string;
  /** 화면에 그대로 노출되는 이름 */
  label: string;
  caption: string;
  kind: TabKind;
  /** 이 탭에 속한 캐릭터 이름들 (노션 옵션명과 동일) */
  characters: string[];
  /** 강조색. dual 이면 2개. */
  accents: string[];
}

export type SectionId = 'profile' | 'story' | 'logs' | 'screenshots' | 'gallery';

export interface SubTab {
  id: SectionId;
  label: string;
  caption: string;
}

export interface Era {
  label: string;
  en: string;
  order: number;
}

/** 노션 이미지 한 장 */
export interface MediaItem {
  src: string;
  alt: string;
  caption?: string;
}

/** 게시물 DB 의 행 하나 */
export interface Post {
  id: string;
  title: string;
  /** 노출될 메인 탭 슬러그 목록 */
  tabs: string[];
  section: SectionId;
  characters: string[];
  summary: string;
  date?: string;
  tags: string[];
  cover?: string;
  images: MediaItem[];
  order: number;
  /** 렌더링된 본문 HTML. 목록 페이지에서는 비어 있을 수 있습니다. */
  html: string;
}

/** 연표 DB 의 행 하나 — [ 시기 / 관련 캐릭터 / 내용 ] */
export interface TimelineEntry {
  id: string;
  /** 원문 표기 그대로. 예: '-10년', '신생', '칠흑' */
  period: string;
  characters: string[];
  body: string;
  /** 정렬용 파생 값 */
  sortKey: number;
  order: number;
}

/** 시기별로 묶인 연표 그룹 */
export interface TimelineGroup {
  period: string;
  caption: string;
  entries: TimelineEntry[];
}
