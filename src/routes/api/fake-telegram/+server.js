import { json } from '@sveltejs/kit';
import { handleFakeTelegramRpc } from '../../../lib/server/fake-telegram.mjs';

export async function GET({ url, request }) {
  const instanceId = request.headers.get('x-fake-instance') || url.searchParams.get('instance') || 'default';
  try {
    const result = await handleFakeTelegramRpc('getBootstrap', {}, instanceId);
    return json({ ok: true, result });
  } catch (error) {
    return json({ ok: false, error: error?.text || error?.message || 'INTERNAL_ERROR' }, { status: 400 });
  }
}

export async function POST({ request }) {
  const instanceId = request.headers.get('x-fake-instance') || 'default';
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { action, payload = {} } = body;
  try {
    const result = await handleFakeTelegramRpc(action, payload, instanceId);
    return json({ ok: true, result });
  } catch (error) {
    return json(
      {
        ok: false,
        error: error?.text || error?.message || 'INTERNAL_ERROR',
        seconds: error?.seconds || 0,
      },
      { status: 400 }
    );
  }
}
