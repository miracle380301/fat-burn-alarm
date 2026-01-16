/**
 * Strava Webhook Endpoint
 * GET: 구독 검증
 * POST: 이벤트 처리
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  verifyWebhookSubscription,
  handleWebhookEvent,
  StravaWebhookEvent,
} from '../../src/webhook-handler';

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

  // GET: Webhook 구독 검증
  if (req.method === 'GET') {
    const hubMode = req.query['hub.mode'] as string;
    const hubChallenge = req.query['hub.challenge'] as string;
    const hubVerifyToken = req.query['hub.verify_token'] as string;

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
    return;
  }

  // POST: Webhook 이벤트 처리
  if (req.method === 'POST') {
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
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
