---
name: setup-strava
description: Strava OAuth 인증 및 Webhook 등록을 수행합니다. 새로운 사용자가 서비스에 가입할 때 최초 1회 사용하세요.
allowed-tools:
  - Bash
  - Read
  - Write
---

# Setup Strava

최초 OAuth 인증 + 사용자 정보 저장 + Webhook 구독 등록 스킬

## Instructions

1. 사용자를 Strava 로그인 페이지로 리다이렉트
2. 인증 완료 후 Authorization Code 수신
3. Access Token + Refresh Token 발급
4. Supabase에 사용자 정보 저장
5. Strava Webhook 구독 등록

## Usage

```typescript
import { StravaSetup } from './strava-setup';

const setup = new StravaSetup({
  clientId: STRAVA_CLIENT_ID,
  clientSecret: STRAVA_CLIENT_SECRET,
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_KEY
});

// 1. 인증 URL 생성
const authUrl = setup.getAuthUrl(redirectUri);

// 2. 콜백에서 토큰 발급 + 저장
const user = await setup.handleCallback(code);
```

## Config

| 항목 | 값 |
|------|-----|
| Auth URL | https://www.strava.com/oauth/authorize |
| Token URL | https://www.strava.com/oauth/token |
| Scope | `activity:read_all,activity:write` |
| Webhook URL | https://www.strava.com/api/v3/push_subscriptions |

**중요:** `activity:write` scope가 필요합니다. 이 권한이 있어야 활동 Description을 업데이트할 수 있습니다.

## Flow

```
[사용자]
    │
    ▼
[1] Strava 로그인 페이지
    │
    ▼
[2] 권한 허용 → Authorization Code 발급
    │
    ▼
[3] Token 발급 (Access + Refresh)
    │
    ▼
[4] Supabase에 저장
    │
    ▼
[5] Webhook 구독 등록
```

## Supabase 저장 데이터

| 필드 | 설명 |
|------|------|
| strava_id | Strava 사용자 ID |
| strava_nickname | Strava 닉네임 |
| access_token | API 호출용 토큰 |
| refresh_token | 토큰 갱신용 |
| token_expires_at | 만료 시간 |

## OAuth URL 예시

```
https://www.strava.com/oauth/authorize
  ?client_id={STRAVA_CLIENT_ID}
  &redirect_uri={REDIRECT_URI}
  &response_type=code
  &scope=activity:read_all,activity:write
```

## Error Handling

| 에러 | 처리 |
|------|------|
| Invalid Code | 재인증 요청 |
| Duplicate User | 기존 토큰 업데이트 |
| Webhook 등록 실패 | 재시도 (최대 3회) |