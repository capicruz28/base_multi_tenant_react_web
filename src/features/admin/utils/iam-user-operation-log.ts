import axios from 'axios';

export type IamUserOperation = 'CREATE_USER' | 'UPDATE_USER' | 'ASSIGN_ROLE' | 'REVOKE_ROLE';

export interface IamUserOperationEvidence {
  operation: IamUserOperation;
  usuario_id: string;
  requestBody: unknown;
  statusCode: number | null;
  responseBody: unknown;
  timestamp: string;
}

const LOG_PREFIX = '[IAM UserManagement]';

function tryParseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export function extractAxiosOperationEvidence(err: unknown): {
  statusCode: number | null;
  responseBody: unknown;
  requestBody: unknown;
} {
  if (!axios.isAxiosError(err)) {
    return { statusCode: null, responseBody: err, requestBody: null };
  }
  return {
    statusCode: err.response?.status ?? null,
    responseBody: err.response?.data ?? null,
    requestBody: tryParseJson(err.config?.data),
  };
}

export function logIamUserOperation(
  entry: Omit<IamUserOperationEvidence, 'timestamp'>,
): IamUserOperationEvidence {
  const evidence: IamUserOperationEvidence = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  console.group(`${LOG_PREFIX} ${evidence.operation}`);
  console.info('operación:', evidence.operation);
  console.info('usuario_id:', evidence.usuario_id);
  console.info('statusCode:', evidence.statusCode);
  console.info('requestBody:', evidence.requestBody);
  console.info('responseBody:', evidence.responseBody);
  console.info('timestamp:', evidence.timestamp);
  console.groupEnd();

  return evidence;
}
