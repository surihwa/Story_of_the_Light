/** 캐릭터 한 명(또는 그룹)의 마스터 정보 */
export interface Character {
  id: string;
  /** 화면에 노출되는 이름 (풀네임) */
  name: string;
  role: string;
  /** 테마 강조색 (HEX) */
  color: string;
  /** 노션에 짧은 이름으로 적어 둔 경우를 위한 별칭 */
  aliases?: string[];
  note?: string;
}

export type TabKind = 'single' | 'dual' | 'group' | 'world' | 'timeline';

/** 대분류 (OC / Pair / World) */
export interface TabGroup {
  id: string;
  label: string;
}

/** 중분류 */
export interface MainTab {
  /** URL 슬러그 */
  id: string;
  /** 소속 대분류 id */
  group: string;
  /** 화면에 그대로 노출되는 이름 */
  label: string;
  caption: string;
  kind: TabKind;
  /** 이 탭에 속한 캐릭터 이름들 */
  characters: string[];
  /** 노션 `탭` 옵션을 예전 이름으로 적어 둔 경우를 위한 별칭 */
  aliases?: string[];
  /** 강조색. dual 이면 2개. */
  accents: string[];
}

export type SectionId = 'profile' | 'story' | 'logs';

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

/** 노션 본문에 들어 있던 이미지 한 장 */
export interface MediaItem {
  src: string;
  alt: string;
  caption?: string;
}

/** 카테고리별 DB 한 행 */
export interface Post {
  id: string;
  section: SectionId;
  /** 정렬에 쓰는 번호. 숫자 속성이든 ID 속성이든 여기로 모입니다. */
  number: number | null;
  /** 화면에 찍히는 번호 표기. ID 속성이면 접두사까지 포함합니다. */
  numberLabel: string;
  /** 번호를 어느 속성에서 읽었는지. 정렬 방향을 여기서 정합니다. */
  numberKind: 'number' | 'id' | null;
  /** Story 는 제목, Profile 은 캐릭터명, Logs 는 빈 문자열 */
  title: string;
  tabs: string[];
  characters: string[];
  date?: string;
  cover?: string;
  images: MediaItem[];
  /** 렌더링된 본문 HTML */
  html: string;
  /** 본문 평문. 미리보기에 씁니다. */
  text: string;
}

/** 연표 DB 의 행 하나 — [ 시기 / 관련 캐릭터 / 내용 ] */
export interface TimelineEntry {
  id: string;
  period: string;
  characters: string[];
  body: string;
  sortKey: number;
  order: number;
}

export interface TimelineGroup {
  period: string;
  caption: string;
  entries: TimelineEntry[];
}

/** 카테고리 하나에 대응하는 노션 DB 설정 */
export interface SourceConfig {
  section: SectionId;
  /** 환경 변수 이름 */
  env: string;
  /** 번호 속성 이름 */
  numberProp: string;
  /**
   * 번호 정렬 방향.
   * 비워 두면 번호 속성 유형을 보고 자동으로 정합니다.
   *  - 숫자 속성 → 오름차순 (직접 매긴 순서대로)
   *  - ID 속성   → 내림차순 (나중에 추가한 것이 위로)
   */
  direction?: 'asc' | 'desc';
  /** 제목 속성 이름. 없으면 카드에 제목을 찍지 않습니다. */
  titleProp?: string;
  /** 캐릭터 속성 이름 */
  characterProp?: string;
  /** 날짜 속성 이름 */
  dateProp?: string;
}
