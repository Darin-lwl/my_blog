export async function onRequestGet(context) {
  const { env, params } = context;
  const { filename } = params;

  const { results } = await env.DB.prepare(
    'SELECT chunk_index, data, contentType FROM images WHERE filename = ? ORDER BY chunk_index'
  ).bind(filename).all();

  if (!results || results.length === 0) {
    return new Response('图片不存在', { status: 404 });
  }

  // Reassemble chunks
  const chunks = [];
  for (const row of results) {
    const binaryStr = atob(row.data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    chunks.push(bytes);
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return new Response(merged, {
    headers: {
      'Content-Type': results[0].contentType || 'image/png',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
