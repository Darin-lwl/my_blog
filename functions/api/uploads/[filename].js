export async function onRequestGet(context) {
  const { env, params } = context;
  const { filename } = params;

  const image = await env.DB.prepare(
    'SELECT data, contentType FROM images WHERE filename = ?'
  ).bind(filename).first();

  if (!image) {
    return new Response('图片不存在', { status: 404 });
  }

  const binaryStr = atob(image.data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  return new Response(bytes, {
    headers: {
      'Content-Type': image.contentType || 'image/png',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
