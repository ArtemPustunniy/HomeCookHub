// #region agent log
export const DBG = (loc: string, msg: string, data: Record<string, unknown>, hypothesisId: string) =>
  fetch('http://127.0.0.1:7685/ingest/ddf26858-01c3-4e33-8320-604515fa9474', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '5cd239' },
    body: JSON.stringify({ sessionId: '5cd239', location: loc, message: msg, data, hypothesisId, timestamp: Date.now() }),
  }).catch(() => {})
// #endregion
