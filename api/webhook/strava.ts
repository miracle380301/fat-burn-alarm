/**
 * Strava Webhook Endpoint
 * GET: 구독 검증
 * POST: 이벤트 처리 → Strava Description 업데이트
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { matchFood } from '../../src/food-matcher';

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
  type: string;
  distance: number;
  moving_time: number;
  calories?: number;
  description?: string;
}

interface UserRecord {
  strava_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
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

/**
 * Fat Burn Report Description 생성
 */
function buildFatBurnDescription(
  distanceKm: string,
  durationMin: number,
  calories: number,
  fatBurnedG: number
): string {
  const food = matchFood(fatBurnedG);

  return `━━━━━━━━━━━━━━━━━━━━━
🔥 Fat Burn Report
━━━━━━━━━━━━━━━━━━━━━

📏 ${distanceKm}km | ⏱️ ${durationMin}분
🔥 ${calories}kcal 소모

${food.emoji} 체지방 ${fatBurnedG}g 감량!
   ≈ ${food.name} 태웠어요!

━━━━━━━━━━━━━━━━━━━━━
by miracle`;
}

/**
 * 기존 Description과 합치기
 */
function mergeDescription(existing: string | null | undefined, newReport: string): string {
  if (!existing || existing.trim() === '') {
    return newReport;
  }

  // 이미 Fat Burn Report가 있으면 교체
  if (existing.includes('🔥 Fat Burn Report')) {
    const reportStart = existing.indexOf('━━━━━━━━━━━━━━━━━━━━━');
    if (reportStart !== -1) {
      const beforeReport = existing.substring(0, reportStart).trim();
      if (beforeReport) {
        return `${beforeReport}\n\n${newReport}`;
      }
      return newReport;
    }
  }

  return `${existing}\n\n${newReport}`;
}

/**
 * Strava 활동 Description 업데이트
 */
async function updateStravaDescription(
  activityId: number,
  accessToken: string,
  description: string
): Promise<boolean> {
  try {
    const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      console.error('Failed to update Strava description:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating Strava description:', error);
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
  console.log('=== Webhook Event Received ===');
  console.log('Event:', JSON.stringify(event));

  if (event.object_type !== 'activity' || event.aspect_type !== 'create') {
    console.log(`Ignoring event: ${event.object_type}.${event.aspect_type}`);
    return;
  }

  console.log('Processing activity.create event...');

  const supabase = getSupabaseClient();
  const stravaId = event.owner_id.toString();
  console.log('Looking up user:', stravaId);

  // 1. 사용자 조회
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('strava_id', stravaId)
    .single();

  if (!user) {
    console.log(`User not found: ${stravaId}`);
    return;
  }

  // 2. 토큰 갱신 확인
  let accessToken = user.access_token;
  const expiresAt = new Date(user.token_expires_at);
  if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    console.log('Token expiring soon, refreshing...');
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
    console.log('Token refreshed');
  }

  // 3. 활동 조회
  const activityRes = await fetch(
    `https://www.strava.com/api/v3/activities/${event.object_id}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const activity: StravaActivity = await activityRes.json();

  console.log('Activity data:', JSON.stringify(activity));

  // 4. 중복 체크 - 이미 처리된 활동인지 확인
  if (activity.description?.includes('by miracle')) {
    console.log('Already processed (found "by miracle"), skipping');
    return;
  }

  // 5. 계산
  const distance = activity.distance || 0;
  const movingTime = activity.moving_time || 0;
  const calories = activity.calories || (distance > 0 ? estimateCaloriesFromDistance(distance) : 0);

  if (calories === 0) {
    console.log('No calories data, skipping description update');
    return;
  }

  const fatBurnedG = calculateFatBurn(calories);
  const distanceKm = (distance / 1000).toFixed(1);
  const durationMin = Math.round(movingTime / 60);

  // 6. Description 생성
  const fatBurnReport = buildFatBurnDescription(distanceKm, durationMin, calories, fatBurnedG);
  const newDescription = mergeDescription(activity.description, fatBurnReport);

  // 7. Strava Description 업데이트
  const updated = await updateStravaDescription(event.object_id, accessToken, newDescription);
  console.log(`Description ${updated ? 'updated' : 'FAILED'} for activity ${event.object_id}`);
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
    try {
      await handleWebhookEvent(event);
      console.log('Webhook processing completed');
    } catch (error) {
      console.error('Webhook processing error:', error);
    }
    res.status(200).json({ received: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
