/**
 * OAuth 시작 엔드포인트
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
): void {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const telegramChatId = req.query.telegram_chat_id as string;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  let redirectUri = `${appUrl}/api/auth/callback`;
  if (telegramChatId) {
    redirectUri += `?telegram_chat_id=${telegramChatId}`;
  }

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'activity:read_all,activity:write',
  });

  res.redirect(302, `https://www.strava.com/oauth/authorize?${params}`);
}
