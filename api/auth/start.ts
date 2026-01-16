/**
 * OAuth 시작 엔드포인트
 * Strava 인증 페이지로 리다이렉트
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateAuthUrl } from '../../src/strava-setup';

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

  try {
    const authUrl = generateAuthUrl(redirectUri);
    res.redirect(302, authUrl);
  } catch (error) {
    console.error('Auth start error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
}
