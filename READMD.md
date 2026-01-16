# FatBurn Alert

운동 끝나면 체지방 얼마나 빠졌는지 알려주는 서비스

## 한줄정의

Strava 운동 완료 → Webhook 수신 → 체지방 감량 계산 → 텔레그램 알림

## 폴더 구조
```
fatburn-alert/
├── README.md
├── prompt.md
├── .claude/
│   └── skills/
│       ├── setup-strava/SKILL.md
│       ├── handle-webhook/SKILL.md
│       ├── calculate-fatburn/SKILL.md
│       └── send-notification/SKILL.md
└── src/
```

## 스킬 구성

| 스킬 | 설명 | 사용 서비스 |
|------|------|-------------|
| setup-strava | 최초 OAuth 인증 + Webhook 등록 | Strava API, Supabase |
| handle-webhook | Webhook 이벤트 수신 및 처리 | Strava API |
| calculate-fatburn | 체지방 감량 계산 | - |
| send-notification | 알림 발송 | Telegram Bot API |

## 흐름

### 최초 1회 (setup-strava)
1. 사용자가 Strava 로그인 + 권한 허용
2. Access Token + Refresh Token 발급
3. Supabase에 사용자 정보 저장
4. Strava Webhook 구독 등록

### 이후 자동 (handle-webhook → calculate → notify)
1. Strava에서 운동 완료 → Webhook 발송
2. Webhook 수신 → 칼로리 데이터 조회
3. 체지방 감량량 계산 (7,700kcal = 1kg)
4. 텔레그램으로 결과 발송

## 메시지 예시
```
🏃 운동 완료!
러닝 5.2km, 32분
소모 칼로리: 320kcal
체지방 감량: 약 42g 🔥
```

## DB 스키마 (Supabase)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  strava_id VARCHAR(50) UNIQUE,
  strava_nickname VARCHAR(100),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  telegram_chat_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 환경변수

| 변수 | 설명 |
|------|------|
| STRAVA_CLIENT_ID | Strava OAuth Client ID |
| STRAVA_CLIENT_SECRET | Strava OAuth Secret |
| SUPABASE_URL | Supabase 프로젝트 URL |
| SUPABASE_KEY | Supabase anon key |
| TELEGRAM_BOT_TOKEN | 텔레그램 봇 토큰 |