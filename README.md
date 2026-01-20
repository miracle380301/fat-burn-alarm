# Fat Burn Alarm

Strava 운동 완료 시 체지방 감량량을 계산하여 재미있는 음식 비유와 함께 Strava 활동 설명에 자동 업데이트하는 서비스

## Features

- Strava OAuth 연동으로 자동 운동 감지
- 소모 칼로리 기반 체지방 감량량 계산 (7,700kcal = 1kg)
- 체지방량에 따른 랜덤 음식 매칭 (범위별 10개 음식)
- Strava 활동 Description에 이모지 리포트 자동 업데이트

## Tech Stack

- **Runtime**: Node.js 18+ / TypeScript
- **Framework**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **APIs**: Strava API v3

## Quick Start

### 1. 환경변수 설정

```env
# Strava (https://www.strava.com/settings/api)
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_VERIFY_TOKEN=your_verify_token

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_supabase_key

# App
APP_URL=https://your-app.vercel.app
```

### 2. Supabase 테이블 생성

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  strava_id VARCHAR(50) UNIQUE NOT NULL,
  strava_nickname VARCHAR(100),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 배포
npm run deploy
```

## API Endpoints

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/auth/start` | Strava OAuth 시작 |
| GET | `/api/auth/callback` | OAuth 콜백 처리 |
| GET | `/api/webhook/strava` | Webhook 구독 검증 |
| POST | `/api/webhook/strava` | Webhook 이벤트 수신 |

## Usage

### 1. 사용자 등록

OAuth 인증 시작:
```
https://fat-burn-alarm.vercel.app/api/auth/start
```

### 2. Strava Webhook 등록

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET \
  -d callback_url=https://fat-burn-alarm.vercel.app/api/webhook/strava \
  -d verify_token=YOUR_VERIFY_TOKEN
```

### 3. 운동 완료 시 자동 업데이트

Strava에서 운동을 완료하면 활동 Description에 자동으로 업데이트됩니다:

```
━━━━━━━━━━━━━━━━━━━━━
🔥 Fat Burn Report
━━━━━━━━━━━━━━━━━━━━━

📏 5.2km | ⏱️ 32분
🔥 320kcal 소모

🍌 체지방 42g 감량!
   ≈ 바나나 1개 태웠어요!

━━━━━━━━━━━━━━━━━━━━━
```

## Project Structure

```
fat-burn-alarm/
├── api/                      # Vercel Serverless Functions
│   ├── auth/
│   │   ├── start.ts         # OAuth 시작
│   │   └── callback.ts      # OAuth 콜백
│   └── webhook/
│       └── strava.ts        # Webhook 처리
├── src/                      # 핵심 로직
│   ├── calculator.ts        # 체지방 계산
│   ├── food-matcher.ts      # 음식 매칭
│   └── description-builder.ts # Description 생성
├── docs/
│   ├── ARCHITECTURE.md      # 시스템 구조
│   └── features/            # 기능 스펙
├── package.json
└── vercel.json
```

## Fat Burn Formula

```
체지방 감량(g) = (소모 칼로리 / 7,700) × 1,000
```

| 소모 칼로리 | 체지방 감량 |
|-------------|-------------|
| 100 kcal | 13g |
| 320 kcal | 42g |
| 500 kcal | 65g |
| 770 kcal | 100g |

## Food Matching

체지방 감량량에 따라 랜덤으로 음식이 매칭됩니다:

| 범위 | 음식 예시 |
|------|----------|
| ~20g | 🍓딸기, 🍇포도, 🍬사탕 등 |
| ~40g | 🍌바나나, 🥚계란, 🧀치즈 등 |
| ~70g | 🍎사과, 🥯베이글, 🍙삼각김밥 등 |
| ~100g | 🍩도넛, 🧇와플, 🍟감자튀김 등 |
| ~150g | 🍔햄버거, 🍕피자, 🍜라면 등 |
| 150g+ | 🍖스테이크, 🍗치킨, 🍝파스타 등 |

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - 시스템 구조
- [AGENT.md](AGENT.md) - AI 에이전트 가이드

## License

MIT