/**
 * Strava Webhook 핸들러
 * Webhook 이벤트 수신 및 처리
 */

import { createClient } from '@supabase/supabase-js';
import { refreshAccessToken, updateUserTokens } from './strava-setup';
import { calculateFatBurn, estimateCaloriesFromDistance } from './calculator';
import { sendActivityNotification, ActivityNotification } from './notifier';

const STRAVA_API_URL = 'https://www.strava.com/api/v3';

export interface StravaWebhookEvent {
  object_type: 'activity' | 'athlete';
  object_id: number;
  aspect_type: 'create' | 'update' | 'delete';
  owner_id: number;
  subscription_id: number;
  event_time: number;
  updates?: Record<string, unknown>;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  type: string;
  sport_type: string;
  start_date: string;
  calories?: number;
}

interface UserRecord {
  id: number;
  strava_id: string;
  strava_nickname: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  telegram_chat_id: string | null;
}

/**
 * Supabase 클라이언트 생성
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Webhook 구독 검증 (GET 요청)
 *
 * @param hubChallenge Strava가 보낸 검증 챌린지
 * @param hubVerifyToken Strava가 보낸 검증 토큰
 * @returns 검증 결과
 */
export function verifyWebhookSubscription(
  hubChallenge: string,
  hubVerifyToken: string
): { valid: boolean; challenge?: string } {
  const verifyToken = process.env.STRAVA_VERIFY_TOKEN;

  if (hubVerifyToken === verifyToken) {
    return { valid: true, challenge: hubChallenge };
  }

  return { valid: false };
}

/**
 * Strava 사용자 조회
 *
 * @param stravaId Strava 사용자 ID
 * @returns 사용자 정보
 */
async function getUserByStravaId(stravaId: string): Promise<UserRecord | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('strava_id', stravaId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserRecord;
}

/**
 * 토큰 만료 확인 및 갱신
 *
 * @param user 사용자 정보
 * @returns 유효한 access_token
 */
async function ensureValidToken(user: UserRecord): Promise<string> {
  const expiresAt = new Date(user.token_expires_at);
  const now = new Date();

  // 만료 5분 전부터 갱신
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log(`Refreshing token for user ${user.strava_id}`);
    const newTokens = await refreshAccessToken(user.refresh_token);
    await updateUserTokens(user.strava_id, newTokens);
    return newTokens.access_token;
  }

  return user.access_token;
}

/**
 * Strava API에서 활동 상세 조회
 *
 * @param activityId 활동 ID
 * @param accessToken Access Token
 * @returns 활동 정보
 */
async function fetchActivityDetails(
  activityId: number,
  accessToken: string
): Promise<StravaActivity> {
  const response = await fetch(`${STRAVA_API_URL}/activities/${activityId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch activity: ${error}`);
  }

  return response.json();
}

/**
 * 활동 생성 이벤트 처리
 *
 * @param event Webhook 이벤트
 */
async function handleActivityCreate(event: StravaWebhookEvent): Promise<void> {
  const stravaId = event.owner_id.toString();

  // 1. 사용자 조회
  const user = await getUserByStravaId(stravaId);
  if (!user) {
    console.log(`User not found: ${stravaId}`);
    return;
  }

  // 텔레그램 설정 확인
  if (!user.telegram_chat_id) {
    console.log(`No Telegram chat ID for user: ${stravaId}`);
    return;
  }

  // 2. 토큰 유효성 확인 및 갱신
  const accessToken = await ensureValidToken(user);

  // 3. 활동 상세 조회
  const activity = await fetchActivityDetails(event.object_id, accessToken);

  // 4. 칼로리 계산 (없으면 거리 기반 추정)
  const calories =
    activity.calories || estimateCaloriesFromDistance(activity.distance);

  // 5. 체지방 계산
  const fatBurnedGrams = calculateFatBurn(calories);

  // 6. 알림 데이터 구성
  const notificationData: ActivityNotification = {
    activityName: activity.name,
    distanceKm: activity.distance / 1000,
    durationMin: Math.round(activity.moving_time / 60),
    calories,
    fatBurnedGrams,
  };

  // 7. 텔레그램 알림 발송
  const sent = await sendActivityNotification(
    user.telegram_chat_id,
    notificationData
  );

  if (sent) {
    console.log(`Notification sent for activity ${event.object_id}`);
  } else {
    console.error(`Failed to send notification for activity ${event.object_id}`);
  }
}

/**
 * Webhook 이벤트 처리
 *
 * @param event Webhook 이벤트
 */
export async function handleWebhookEvent(
  event: StravaWebhookEvent
): Promise<void> {
  console.log('Received webhook event:', JSON.stringify(event));

  // activity.create 이벤트만 처리
  if (event.object_type === 'activity' && event.aspect_type === 'create') {
    await handleActivityCreate(event);
  } else {
    console.log(
      `Ignoring event: ${event.object_type}.${event.aspect_type}`
    );
  }
}
