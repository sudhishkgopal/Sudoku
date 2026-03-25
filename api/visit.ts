import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler() {
  try {
    const count = await kv.incr('visits');
    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (error) {
    console.error('KV error:', error);
    return new Response(JSON.stringify({ error: 'Failed to increment visits' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  }
}
