# AGENT.md

이 문서는 AI 에이전트(Claude Code 등)가 프로젝트를 이해하고 작업할 때 참고하는 가이드입니다.

## Project Overview

**Fat Burn Alarm**은 Strava 운동 완료 시 체지방 감량량을 계산하여 Strava 활동 설명(Description)에 재미있는 음식 비유와 함께 업데이트하는 서비스입니다.

**핵심 흐름:**
```
Strava 운동 완료 → Webhook 수신 → 활동 데이터 조회 → 체지방 계산 → 음식 매칭 → Strava Description 업데이트
```

## Tech Stack

| 구분 | 기술 |
|------|------|
| Runtime | Node.js 18+ / TypeScript |
| Framework | Vercel Serverless Functions |
| Database | Supabase (PostgreSQL) |
| External APIs | Strava API v3 |
| Deploy | Vercel |

## Project Structure

```
fat-burn-alarm/
├── api/                      # Vercel Serverless Functions
│   ├── auth/
│   │   ├── start.ts         # GET /api/auth/start - OAuth 시작
│   │   └── callback.ts      # GET /api/auth/callback - OAuth 콜백
│   ├── webhook/
│   │   └── strava.ts        # GET/POST /api/webhook/strava
│   └── test.ts              # 테스트 엔드포인트
├── src/                      # 핵심 비즈니스 로직
│   ├── index.ts             # 엔트리포인트
│   ├── strava-setup.ts      # Strava OAuth 처리
│   ├── webhook-handler.ts   # Webhook 이벤트 처리
│   ├── calculator.ts        # 체지방 감량 계산
│   ├── food-matcher.ts      # 음식 매칭 (랜덤)
│   ├── description-builder.ts # Strava Description 생성
│   └── test-local.ts        # 로컬 테스트
├── docs/
│   ├── ARCHITECTURE.md      # 시스템 구조 문서
│   └── features/            # 기능 스펙 문서
│       ├── spec_setup-strava.md
│       ├── spec_handle-webhook.md
│       ├── spec_calculate-fatburn.md
│       ├── spec_food-matcher.md
│       └── spec_update-description.md
├── package.json
├── tsconfig.json
└── vercel.json
```

## Core Modules

### 1. strava-setup.ts
Strava OAuth 인증 처리
- `getAuthUrl()` - 인증 URL 생성
- `handleCallback()` - Authorization Code → Token 교환
- Supabase에 사용자 정보 저장
- **Scope**: `activity:read_all,activity:write`

### 2. webhook-handler.ts
Strava Webhook 이벤트 처리
- `verifySubscription()` - GET 요청으로 구독 검증
- `handleEvent()` - POST 요청으로 이벤트 처리
- 토큰 만료 시 자동 갱신
- Strava API로 활동 상세 조회

### 3. calculator.ts
체지방 감량 계산
- 공식: `(calories / 7700) * 1000`
- 체지방 1kg = 7,700 kcal 기준
- 소수점 2자리 반올림

### 4. food-matcher.ts
체지방 감량량에 따른 음식 매칭
- 6개 구간별로 각 10개 음식 목록
- 랜덤 선택으로 다양한 표현
- 이모지 + 음식명 반환

### 5. description-builder.ts
Strava 활동 Description 생성 및 업데이트
- 이모지 기반 텍스트 아트 생성
- Strava API `PUT /activities/{id}` 호출
- 기존 Description 보존 옵션

## Environment Variables

```env
# Strava
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_VERIFY_TOKEN=your_verify_token

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_supabase_key

# App
BASE_URL=https://your-app.vercel.app
```

## Database Schema

**Table: users**
| 필드 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | Primary Key |
| strava_id | VARCHAR(50) | Strava 사용자 ID (UNIQUE) |
| strava_nickname | VARCHAR(100) | Strava 닉네임 |
| access_token | TEXT | API 호출용 토큰 |
| refresh_token | TEXT | 토큰 갱신용 |
| token_expires_at | TIMESTAMP | 토큰 만료 시간 |
| created_at | TIMESTAMP | 생성 시간 |

## Commands

```bash
# 개발 서버 실행
npm run dev

# 로컬 테스트
npm test

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

## Development Guidelines

### 코드 작성 시 주의사항

1. **TypeScript 사용** - 모든 코드는 TypeScript로 작성
2. **환경변수 검증** - 필수 환경변수 누락 시 명확한 에러 메시지
3. **에러 핸들링** - Webhook은 항상 200 응답 (Strava 재시도 방지)
4. **토큰 갱신** - 만료된 토큰은 자동으로 갱신

### 새 기능 추가 시

1. `docs/features/`에 스펙 문서 작성
2. `src/`에 모듈 구현
3. `api/`에 엔드포인트 추가 (필요시)
4. `docs/ARCHITECTURE.md` 업데이트

### 테스트

```bash
# 로컬 테스트 실행
npm test

# 특정 모듈 테스트
npx tsx src/test-local.ts
```

## Webhook Event Handling

Strava Webhook 이벤트 처리 흐름:

```
1. POST /api/webhook/strava 수신
2. event.aspect_type === "create" 확인
3. event.object_type === "activity" 확인
4. owner_id로 Supabase에서 사용자 조회
5. access_token으로 Strava API 호출
6. 활동 데이터에서 calories 추출
7. calculator.ts로 체지방 감량 계산
8. food-matcher.ts로 음식 매칭 (랜덤)
9. description-builder.ts로 Description 생성
10. Strava API로 활동 Description 업데이트
```

## Error Handling Strategy

| 상황 | 처리 |
|------|------|
| 사용자 없음 | 로그 기록, 200 응답 |
| 토큰 만료 | 자동 갱신 후 재시도 |
| 토큰 갱신 실패 | 로그 기록, 200 응답 |
| calories 없음 | distance 기반 추정 (1km ≈ 60kcal) |
| Description 업데이트 실패 | 로그 기록, 200 응답 |

## References

- [Strava API Docs](https://developers.strava.com/docs/reference/)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)