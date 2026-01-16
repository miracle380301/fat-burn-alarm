/**
 * Strava OAuth 인증 모듈
 * OAuth 인증, 토큰 관리, Webhook 구독
 */

import { createClient } from '@supabase/supabase-js';

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_URL = 'https://www.strava.com/api/v3';

export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
  };
}

export interface UserData {
  strava_id: string;
  strava_nickname: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: Date;
  telegram_chat_id?: string;
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
 * Strava OAuth 인증 URL 생성
 *
 * @param redirectUri 인증 후 리다이렉트 URL
 * @returns 인증 URL
 */
export function generateAuthUrl(redirectUri: string): string {
  const clientId = process.env.STRAVA_CLIENT_ID;

  if (!clientId) {
    throw new Error('STRAVA_CLIENT_ID not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'activity:read_all',
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

/**
 * Authorization Code를 Access Token으로 교환
 *
 * @param code Authorization Code
 * @returns 토큰 응답
 */
export async function exchangeCodeForToken(
  code: string
): Promise<StravaTokenResponse> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Strava client credentials not configured');
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Access Token 갱신
 *
 * @param refreshToken Refresh Token
 * @returns 새로운 토큰 응답
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<StravaTokenResponse> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Strava client credentials not configured');
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * 사용자 정보를 Supabase에 저장
 *
 * @param tokenResponse 토큰 응답
 * @param telegramChatId 텔레그램 채팅 ID (선택)
 */
export async function saveUserToDatabase(
  tokenResponse: StravaTokenResponse,
  telegramChatId?: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const userData: UserData = {
    strava_id: tokenResponse.athlete.id.toString(),
    strava_nickname:
      tokenResponse.athlete.username ||
      `${tokenResponse.athlete.firstname} ${tokenResponse.athlete.lastname}`,
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    token_expires_at: new Date(tokenResponse.expires_at * 1000),
    telegram_chat_id: telegramChatId,
  };

  const { error } = await supabase.from('users').upsert(userData, {
    onConflict: 'strava_id',
  });

  if (error) {
    throw new Error(`Failed to save user: ${error.message}`);
  }
}

/**
 * 토큰 정보 업데이트
 *
 * @param stravaId Strava 사용자 ID
 * @param tokenResponse 새 토큰 응답
 */
export async function updateUserTokens(
  stravaId: string,
  tokenResponse: StravaTokenResponse
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('users')
    .update({
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      token_expires_at: new Date(tokenResponse.expires_at * 1000),
    })
    .eq('strava_id', stravaId);

  if (error) {
    throw new Error(`Failed to update tokens: ${error.message}`);
  }
}

/**
 * Strava Webhook 구독 생성
 *
 * @param callbackUrl Webhook 콜백 URL
 * @param verifyToken 검증 토큰
 */
export async function createWebhookSubscription(
  callbackUrl: string,
  verifyToken: string
): Promise<{ id: number }> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Strava client credentials not configured');
  }

  const response = await fetch(`${STRAVA_API_URL}/push_subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      callback_url: callbackUrl,
      verify_token: verifyToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Webhook subscription failed: ${error}`);
  }

  return response.json();
}

/**
 * 전체 OAuth 설정 프로세스 실행
 *
 * @param code Authorization Code
 * @param telegramChatId 텔레그램 채팅 ID
 */
export async function completeOAuthSetup(
  code: string,
  telegramChatId?: string
): Promise<UserData> {
  // 1. 코드를 토큰으로 교환
  const tokenResponse = await exchangeCodeForToken(code);

  // 2. 사용자 정보 저장
  await saveUserToDatabase(tokenResponse, telegramChatId);

  return {
    strava_id: tokenResponse.athlete.id.toString(),
    strava_nickname:
      tokenResponse.athlete.username ||
      `${tokenResponse.athlete.firstname} ${tokenResponse.athlete.lastname}`,
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    token_expires_at: new Date(tokenResponse.expires_at * 1000),
    telegram_chat_id: telegramChatId,
  };
}
