export async function onRequestGet(context) {
  const { env, params } = context;
  const { filename } = params;

  const object = await env.R2.get(filename);

  if (!object) {
    return new Response('图片不存在', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000');

  return new Response(object.body, { headers });
}
