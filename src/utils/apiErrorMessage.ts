export function formatApiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;

  const record = body as Record<string, unknown>;
  if (typeof record.error === 'string' && record.error.trim()) return record.error;
  if (typeof record.message === 'string' && record.message.trim()) return record.message;

  const details = record.details ?? record.errors;
  if (Array.isArray(details) && details.length > 0) {
    const messages = details
      .map((detail) => {
        if (typeof detail === 'string') return detail;
        if (!detail || typeof detail !== 'object') return null;
        const item = detail as Record<string, unknown>;
        const msg = item.msg ?? item.message;
        if (typeof msg !== 'string' || !msg.trim()) return null;
        const field = item.path ?? item.field ?? item.param;
        return typeof field === 'string' ? `${field}: ${msg}` : msg;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) return messages.join('. ');
  }

  return fallback;
}
