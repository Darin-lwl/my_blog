export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function error(msg, status = 400) {
  return json({ error: msg }, status);
}

// Base64url encode/decode
function base64url(data) {
  if (typeof data === 'string') {
    return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  const bytes = new Uint8Array(data);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret) {
  return await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function verifyAuth(request, env) {
  const header = request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = header.split(' ')[1];
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const key = await hmacKey(secret);
    const data = new TextEncoder().encode(parts[0] + '.' + parts[1]);
    const sig = base64urlDecode(parts[2]);

    const valid = await crypto.subtle.verify('HMAC', key, sig, data);
    if (!valid) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function createToken(payload, env) {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const key = await hmacKey(secret);

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 86400 }));
  const data = new TextEncoder().encode(header + '.' + body);
  const sig = await crypto.subtle.sign('HMAC', key, data);

  return header + '.' + body + '.' + base64url(sig);
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
