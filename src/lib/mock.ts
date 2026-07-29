import type { Post, TimelineEntry } from '@types';
import { periodSortKey } from './timeline';

/**
 * 노션 설정이 없을 때 쓰는 샘플 데이터.
 * 화면과 색 조합을 바로 확인해 보라고 넣어 둔 것이라, 연동 후에는 자동으로 무시됩니다.
 */
function post(p: Partial<Post> & Pick<Post, 'id' | 'section'>): Post {
  return {
    number: null,
    numberLabel: '',
    title: '',
    tabs: [],
    characters: [],
    images: [],
    html: '',
    text: '',
    ...p,
  };
}

const LOG_SHORT = `숙소로 돌아오는 길에 눈이 내렸다.
그레틴이 먼저 알아채고 손바닥을 펴 보였는데, 닿자마자 녹아서 아무것도 남지 않았다.
그래도 한참을 그러고 서 있었다.`;

const LOG_LONG = Array.from({ length: 16 }, (_, i) =>
  `${i + 1}. 긴 기록의 표본 줄입니다. 열 줄이 넘어가면 카드에서는 잘리고, 눌러서 전문을 봅니다.`,
).join('\n');

export const mockPosts: Post[] = [
  post({
    id: 'mock-profile-1', section: 'profile', number: 1, numberLabel: '1',
    title: '서리화', tabs: ['seorihwa'], characters: ['서리화'],
    text: '에오르제아에 흘러들어온 빛의 전사. 말수가 적고, 기록하는 습관이 있다.',
    html: '<p>에오르제아에 흘러들어온 빛의 전사. 말수가 적고, 기록하는 습관이 있다.</p><h3>기본</h3><ul><li>종족 · 미코테</li><li>직업 · 백마도사</li></ul>',
  }),
  post({
    id: 'mock-profile-2', section: 'profile', number: 2, numberLabel: '2',
    title: '카르네아데스', tabs: ['azem'], characters: ['카르네아데스'],
    text: '열두 번째 자리. 어디에도 오래 머무르지 않는 여행자.',
    html: '<p>열두 번째 자리. 어디에도 오래 머무르지 않는 여행자.</p>',
  }),
  post({
    id: 'mock-profile-3', section: 'profile', number: 3, numberLabel: '3',
    title: '야슈톨라', tabs: ['sangseogo'], characters: ['야슈톨라'],
    text: '샤렐리안의 현자. 필요한 말만 하고, 필요할 때 반드시 온다.',
    html: '<p>샤렐리안의 현자.</p>',
  }),
  post({
    id: 'mock-story-1', section: 'story', number: 1, numberLabel: '1',
    title: '첫눈이 내리던 쿠르잔', tabs: ['seorihwa'], date: '2024-02-11',
    text: '서리화가 처음으로 뒤를 돌아보지 않고 걸었던 날의 기록. 눈은 저녁까지 그치지 않았다.',
    html: '<p>서리화가 처음으로 뒤를 돌아보지 않고 걸었던 날의 기록.</p>',
  }),
  post({
    id: 'mock-story-2', section: 'story', number: 2, numberLabel: '2',
    title: '흑와단 신병 보고서', tabs: ['squadron'], date: '2024-03-30',
    text: '소대에 배속된 첫 주, 훈련장에서 벌어진 소동에 대하여.',
    html: '<p>소대에 배속된 첫 주, 훈련장에서 벌어진 소동.</p>',
  }),
  post({
    id: 'mock-log-1', section: 'logs', number: 12, numberLabel: 'LOG-12',
    tabs: ['squadron'], text: LOG_SHORT,
    html: LOG_SHORT.split('\n').map((l) => `<p>${l}</p>`).join(''),
  }),
  post({
    id: 'mock-log-2', section: 'logs', number: 11, numberLabel: 'LOG-11',
    tabs: ['sangseogo'],
    text: '차를 세 번 끓였다. 두 번은 식었고, 세 번째는 마셨다. 아무 일도 일어나지 않았다.',
    html: '<p>차를 세 번 끓였다. 두 번은 식었고, 세 번째는 마셨다.</p><p>아무 일도 일어나지 않았다.</p>',
  }),
  post({
    id: 'mock-log-3', section: 'logs', number: 10, numberLabel: 'LOG-10',
    tabs: ['seorihwa'], text: LOG_LONG,
    html: LOG_LONG.split('\n').map((l) => `<p>${l}</p>`).join(''),
  }),
  post({
    id: 'mock-log-4', section: 'logs', number: 9, numberLabel: 'LOG-9',
    tabs: ['lorenti'],
    text: '노란 등불과 밤하늘이 나란히 놓였던 축제의 밤. 로레트는 끝까지 등불을 놓지 않았다.',
    html: '<p>노란 등불과 밤하늘이 나란히 놓였던 축제의 밤.</p>',
  }),
];

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
