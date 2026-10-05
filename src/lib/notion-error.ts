/**
 * 노션 API 오류를 사람이 읽을 수 있는 설명으로 바꿉니다.
 *
 * 기본 오류는 "status: 404" 같은 숫자만 알려 주기 때문에,
 * 빌드 로그만 보고는 어느 DB 가 왜 막혔는지 알 수 없습니다.
 * 가장 흔한 원인부터 짚어 줍니다.
 */
export function describeNotionError(err: unknown, label: string, envKey: string, id: string): string {
  const e = err as { code?: string; status?: number; message?: string };
  const status = e?.status;
  const code = e?.code ?? '';
  const shortId = id ? `${id.slice(0, 8)}…` : '(비어 있음)';

  const head = `[${label}] DB 를 읽지 못했습니다 (${envKey} = ${shortId})`;

  if (status === 404 || code === 'object_not_found') {
    return `${head}
  가장 흔한 원인 두 가지입니다.
  1. 통합(Integration)을 이 DB 에 초대하지 않았습니다.
     노션에서 DB 를 열고 오른쪽 위 ··· → Connections → 통합을 선택하세요.
  2. DB ID 가 틀렸습니다. 주소에서 '?v=' 앞의 32자리를 다시 확인하세요.
     (페이지 ID 가 아니라 데이터베이스 ID 여야 합니다.)`;
  }

  if (status === 401 || code === 'unauthorized') {
    return `${head}
  NOTION_TOKEN 이 잘못되었거나 만료되었습니다.
  https://www.notion.so/my-integrations 에서 시크릿을 다시 복사해
  저장소 Settings → Secrets and variables → Actions 에 넣으세요.`;
  }

  if (status === 403 || code === 'restricted_resource') {
    return `${head}
  통합에 읽기 권한이 없습니다.
  통합 설정에서 'Read content' 를 켜고, DB 에도 초대했는지 확인하세요.`;
  }

  if (status === 400 || code === 'validation_error') {
    return `${head}
  요청이 거부되었습니다. DB ID 형식이 올바른지 확인하세요.
  하이픈은 있어도 없어도 되지만, 32자리여야 합니다.
  원본 메시지: ${e?.message ?? '(없음)'}`;
  }

  if (status === 429 || code === 'rate_limited') {
    return `${head}
  요청이 너무 잦아 잠시 차단되었습니다. 조금 뒤 다시 빌드하세요.`;
  }

  return `${head}
  원본 메시지: ${e?.message ?? String(err)}`;
}
