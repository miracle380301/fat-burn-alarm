/**
 * Strava Webhook Endpoint
 * GET: 구독 검증
 * POST: 이벤트 처리
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============ Types ============
interface StravaWebhookEvent {
  object_type: 'activity' | 'athlete';
  object_id: number;
  aspect_type: 'create' | 'update' | 'delete';
  owner_id: number;
  subscription_id: number;
  event_time: number;
}

interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  calories?: number;
}

interface UserRecord {
  strava_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  telegram_chat_id: string | null;
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// ============ Helpers ============
function getSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );
}

function calculateFatBurn(calories: number): number {
  return Math.round((calories / 7700) * 1000 * 100) / 100;
}

function estimateCaloriesFromDistance(meters: number): number {
  return Math.round((meters / 1000) * 60);
}

async function refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse> {
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  return response.json();
}

async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============ Main Logic ============
function verifyWebhookSubscription(challenge: string, verifyToken: string) {
  if (verifyToken === process.env.STRAVA_VERIFY_TOKEN) {
    return { valid: true, challenge };
  }
  return { valid: false };
}

async function handleWebhookEvent(event: StravaWebhookEvent): Promise<void> {
  if (event.object_type !== 'activity' || event.aspect_type !== 'create') {
    console.log(`Ignoring event: ${event.object_type}.${event.aspect_type}`);
    return;
  }

  const supabase = getSupabaseClient();
  const stravaId = event.owner_id.toString();

  // 1. 사용자 조회
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('strava_id', stravaId)
    .single();

  if (!user || !user.telegram_chat_id) {
    console.log(`User not found or no telegram: ${stravaId}`);
    return;
  }

  // 2. 토큰 갱신 확인
  let accessToken = user.access_token;
  const expiresAt = new Date(user.token_expires_at);
  if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    const newTokens = await refreshAccessToken(user.refresh_token);
    accessToken = newTokens.access_token;
    await supabase
      .from('users')
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        token_expires_at: new Date(newTokens.expires_at * 1000),
      })
      .eq('strava_id', stravaId);
  }

  // 3. 활동 조회
  const activityRes = await fetch(
    `https://www.strava.com/api/v3/activities/${event.object_id}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const activity: StravaActivity = await activityRes.json();

  console.log('Activity data:', JSON.stringify(activity));

  // 4. 계산 (데이터 없으면 0으로 처리)
  const distance = activity.distance || 0;
  const movingTime = activity.moving_time || 0;
  const calories = activity.calories || (distance > 0 ? estimateCaloriesFromDistance(distance) : 0);
  const fatBurned = calculateFatBurn(calories);
  const distanceKm = (distance / 1000).toFixed(2);
  const durationMin = Math.round(movingTime / 60);

  // 5. 알림 발송 (데이터 없어도 발송)
  let message = `운동 완료! ${activity.name || '활동'}`;
  if (distance > 0) {
    message += `\n${distanceKm}km, ${durationMin}분`;
  }
  if (calories > 0) {
    message += `\n소모 칼로리: ${calories}kcal`;
    message += `\n체지방 감량: 약 ${fatBurned}g`;
  } else {
    message += `\n(칼로리 정보 없음)`;
  }

  const sent = await sendTelegramMessage(user.telegram_chat_id, message);
  console.log(`Notification ${sent ? 'sent' : 'FAILED'} for activity ${event.object_id}`);
}

// ============ Handler ============
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

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
    const event = req.body as StravaWebhookEvent;
    handleWebhookEvent(event).catch(console.error);
    res.status(200).json({ received: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
