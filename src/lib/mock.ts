import type { Post, TimelineEntry } from '@types';
import { periodSortKey } from './timeline';

/**
 * 노션 토큰이 없을 때 쓰는 샘플 데이터.
 * 화면과 색 조합을 바로 확인해 보라고 넣어 둔 것이라, 연동 후에는 자동으로 무시됩니다.
 */
const raw: Omit<Post, 'images'>[] = [
  {
    id: 'sample-seorihwa-profile',
    title: '서리화',
    tabs: ['seorihwa'],
    section: 'profile',
    characters: ['서리화'],
    summary: '에오르제아에 흘러들어온 빛의 전사. 말수가 적고, 기록하는 습관이 있다.',
    date: '',
    tags: ['미코테', '빛의 전사'],
    order: 100,
    html: '<p>표본 데이터입니다. 노션을 연결하면 이 자리에 실제 프로필이 들어옵니다.</p><h3>기본</h3><ul><li>종족 · 미코테</li><li>직업 · 백마도사</li><li>고향 · 림사 로민사</li></ul>',
  },
  {
    id: 'sample-seorihwa-story',
    title: '첫눈이 내리던 쿠르잔',
    tabs: ['seorihwa'],
    section: 'story',
    characters: ['서리화'],
    summary: '서리화가 처음으로 뒤를 돌아보지 않고 걸었던 날의 기록.',
    date: '2024-02-11',
    tags: ['본편', '독백'],
    order: 90,
    html: '<p>표본 본문입니다.</p>',
  },
  {
    id: 'sample-azem-profile',
    title: '카르네아데스',
    tabs: ['azem'],
    section: 'profile',
    characters: ['카르네아데스'],
    summary: '열두 번째 자리. 어디에도 오래 머무르지 않는 여행자.',
    date: '',
    tags: ['고대인', '아젬'],
    order: 100,
    html: '<p>표본 데이터입니다.</p>',
  },
  {
    id: 'sample-sangseogo-log',
    title: '차를 세 번 끓인 밤',
    tabs: ['sangseogo'],
    section: 'logs',
    characters: ['서리화', '야슈톨라'],
    summary: '아무 일도 일어나지 않았고, 그래서 오래 기억에 남은 밤.',
    date: '2024-05-02',
    tags: ['일상', '썰'],
    order: 80,
    html: '<p>표본 본문입니다.</p>',
  },
  {
    id: 'sample-lorenti-log',
    title: '등불 두 개',
    tabs: ['lorenti'],
    section: 'logs',
    characters: ['로레트', '이스노티'],
    summary: '노란 등불과 밤하늘이 나란히 놓였던 축제의 밤.',
    date: '2024-08-17',
    tags: ['축제'],
    order: 80,
    html: '<p>표본 본문입니다.</p>',
  },
  {
    id: 'sample-squadron-story',
    title: '흑와단 신병 보고서',
    tabs: ['squadron'],
    section: 'story',
    characters: ['서리화', '그레틴', '모험가 소대'],
    summary: '소대에 배속된 첫 주, 훈련장에서 벌어진 소동.',
    date: '2024-03-30',
    tags: ['소대', '훈련'],
    order: 70,
    html: '<p>표본 본문입니다.</p>',
  },
  {
    id: 'sample-world-note',
    title: '에오르제아 지명 메모',
    tabs: [],
    section: 'story',
    characters: [],
    summary: '자캐 설정에 자주 쓰는 지명과 표기를 모아 둔 메모.',
    date: '2024-01-05',
    tags: ['설정', '메모'],
    order: 10,
    html: '<p>표본 본문입니다.</p>',
  },
];

export const mockPosts: Post[] = raw.map((p) => ({ ...p, images: [] }));

const timelineRaw: Omit<TimelineEntry, 'sortKey'>[] = [
  { id: 'tl-1', period: '-10년', characters: ['서리화'], body: '서리화, 림사 로민사 외곽에서 태어나다.', order: 0 },
  { id: 'tl-2', period: '-5년', characters: ['로레트', '이스노티'], body: '두 사람이 같은 상단에 고용되어 처음 만나다.', order: 0 },
  { id: 'tl-3', period: '신생', characters: ['서리화', '야슈톨라'], body: '서리화가 빛의 축복을 받고, 현자와 처음 마주치다.', order: 0 },
  { id: 'tl-4', period: '창천', characters: ['서리화', '그레틴'], body: '흑와단 모험가 소대에 배속. 그레틴과 첫 합동 훈련.', order: 0 },
  { id: 'tl-5', period: '홍련', characters: ['모험가 소대'], body: '소대 전원이 동방 원정에 참여하다.', order: 0 },
  { id: 'tl-6', period: '칠흑', characters: ['서리화', '야슈톨라'], body: '제1세계에서 다시 만나 오래 미뤄 둔 이야기를 나누다.', order: 0 },
  { id: 'tl-7', period: '효월', characters: ['카르네아데스'], body: '아젬의 기억이 서리화에게 겹쳐 보이기 시작하다.', order: 0 },
  { id: 'tl-8', period: '황금', characters: ['서리화'], body: '툴리요라로 떠나며, 처음으로 여행의 목적을 스스로 정하다.', order: 0 },
];

export const mockTimeline: TimelineEntry[] = timelineRaw.map((e) => ({
  ...e,
  sortKey: periodSortKey(e.period),
}));
