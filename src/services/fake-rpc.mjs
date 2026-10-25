const INSTANCE_KEY = 'telegram-svelte:fake-instance';
let fallbackInstanceId = '';

export function getFakeInstanceId() {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = sessionStorage.getItem(INSTANCE_KEY);
    if (!id) {
      id = `inst-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(INSTANCE_KEY, id);
    }
    return id;
  } catch {
    if (!fallbackInstanceId) {
      fallbackInstanceId = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
    return fallbackInstanceId;
  }
}

export async function callFakeTelegram(action, payload = {}) {
  const instanceId = getFakeInstanceId();
  const response = await fetch('/api/fake-telegram', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-fake-instance': instanceId,
    },
    body: JSON.stringify({ action, payload }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw Object.assign(new Error(data.error || 'RPC_ERROR'), {
      text: data.error || 'RPC_ERROR',
      seconds: data.seconds || 0,
    });
  }
  return data.result;
}
