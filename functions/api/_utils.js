import { SignJWT, jwtVerify } from 'jose';

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function error(msg, status = 400) {
  return json({ error: msg }, status);
}

export async function verifyAuth(request, env) {
  const header = request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = header.split(' ')[1];
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function createToken(payload, env) {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function generateSlug(title, db) {
  let slug = (title || 'post')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '') || `post-${Date.now()}`;

  const { results } = await db.prepare(
    'SELECT slug FROM posts WHERE slug LIKE ?'
  ).bind(slug + '%').all();

  if (results.length === 0) return slug;

  const suffixes = results
    .map(r => r.slug.replace(slug, ''))
    .filter(s => s === '' || /^-\d+$/.test(s));

  if (suffixes.includes('')) {
    return `${slug}-${suffixes.filter(s => s !== '').length + 1}`;
  }
  return slug;
}

export function parseTags(tags) {
  if (Array.isArray(tags)) return JSON.stringify(tags);
  if (typeof tags === 'string') {
    try { JSON.parse(tags); return tags; }
    catch { return JSON.stringify([]); }
  }
  return '[]';
}
