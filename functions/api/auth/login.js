import { json, error, createToken } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  if (body.password !== env.ADMIN_PASSWORD) {
    return error('密码错误', 401);
  }

  const token = await createToken({ role: 'admin' }, env);
  return json({ token });
}
