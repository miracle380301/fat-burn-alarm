/**
 * OAuth 콜백 엔드포인트
 * Strava 인증 후 토큰 교환 및 사용자 저장
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { completeOAuthSetup } from '../../src/strava-setup';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const code = req.query.code as string;
  const telegramChatId = req.query.telegram_chat_id as string;
  const error = req.query.error as string;

  // 사용자가 인증 거부한 경우
  if (error) {
    res.status(400).json({ error: 'Authorization denied by user' });
    return;
  }

  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
  }

  try {
    const user = await completeOAuthSetup(code, telegramChatId);

    // 성공 페이지 HTML 반환
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FatBurn Alert - 인증 완료</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .card {
            background: white;
            padding: 2rem;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
          }
          .success-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          h1 {
            color: #333;
            margin: 0 0 0.5rem;
          }
          p {
            color: #666;
            margin: 0.5rem 0;
          }
          .user-info {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="success-icon">&#x2714;&#xFE0F;</div>
          <h1>인증 완료!</h1>
          <p>Strava 계정이 연결되었습니다.</p>
          <div class="user-info">
            <p><strong>${user.strava_nickname}</strong></p>
            <p>이제 운동을 완료하면 알림을 받게 됩니다.</p>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
}
