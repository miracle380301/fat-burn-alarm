/**
 * FatBurn Alert - Vercel Serverless Function
 * Strava Webhook 엔드포인트
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  verifyWebhookSubscription,
  handleWebhookEvent,
  StravaWebhookEvent,
} from './webhook-handler';
import { generateAuthUrl, completeOAuthSetup } from './strava-setup';

/**
 * GET /api/webhook/strava - Webhook 구독 검증
 */
async function handleGet(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const hubMode = req.query['hub.mode'] as string;
  const hubChallenge = req.query['hub.challenge'] as string;
  const hubVerifyToken = req.query['hub.verify_token'] as string;

  // Webhook 구독 검증 요청
  if (hubMode === 'subscribe') {
    const result = verifyWebhookSubscription(hubChallenge, hubVerifyToken);

    if (result.valid) {
      res.status(200).json({ 'hub.challenge': result.challenge });
    } else {
      res.status(403).json({ error: 'Invalid verify token' });
    }
    return;
  }

  res.status(400).json({ error: 'Invalid request' });
}

/**
 * POST /api/webhook/strava - Webhook 이벤트 처리
 */
async function handlePost(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const event = req.body as StravaWebhookEvent;

    // 비동기로 이벤트 처리 (Strava 재시도 방지를 위해 즉시 응답)
    handleWebhookEvent(event).catch((error) => {
      console.error('Error processing webhook event:', error);
    });

    // Strava는 200 응답을 기대
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    // 에러가 발생해도 200 응답 (Strava 재시도 방지)
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
}

/**
 * 메인 핸들러 - Vercel Serverless Function
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    await handleGet(req, res);
    return;
  }

  if (req.method === 'POST') {
    await handlePost(req, res);
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

/**
 * OAuth 콜백 핸들러 - /api/auth/callback
 */
export async function authCallback(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const code = req.query.code as string;
  const telegramChatId = req.query.telegram_chat_id as string;

  if (!code) {
    res.status(400).json({ error: 'Missing authorization code' });
    return;
  }

  try {
    const user = await completeOAuthSetup(code, telegramChatId);
    res.status(200).json({
      success: true,
      message: 'Authorization successful',
      user: {
        strava_id: user.strava_id,
        strava_nickname: user.strava_nickname,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
}

/**
 * OAuth 시작 핸들러 - /api/auth/start
 */
export function authStart(req: VercelRequest, res: VercelResponse): void {
  const telegramChatId = req.query.telegram_chat_id as string;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  let redirectUri = `${appUrl}/api/auth/callback`;
  if (telegramChatId) {
    redirectUri += `?telegram_chat_id=${telegramChatId}`;
  }

  const authUrl = generateAuthUrl(redirectUri);
  res.redirect(302, authUrl);
}
