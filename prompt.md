# Fat Burn Alarm - Prompt Guide

Claude Code로 체지방 알림 서비스를 개발/수정할 때 사용하는 프롬프트 모음

---

## 프로젝트 구조

```
fat-burn-alarm/
├── api/                      # Vercel Serverless Functions
│   ├── auth/
│   │   ├── start.ts         # GET /api/auth/start
│   │   └── callback.ts      # GET /api/auth/callback
│   └── webhook/
│       └── strava.ts        # GET/POST /api/webhook/strava
├── src/                      # 핵심 비즈니스 로직
│   ├── strava-setup.ts      # OAuth 처리
│   ├── webhook-handler.ts   # Webhook 처리
│   ├── calculator.ts        # 체지방 계산
│   ├── food-matcher.ts      # 음식 매칭
│   └── description-builder.ts # Description 생성
├── docs/
│   ├── ARCHITECTURE.md
│   └── features/
│       ├── spec_setup-strava.md
│       ├── spec_handle-webhook.md
│       ├── spec_calculate-fatburn.md
│       ├── spec_food-matcher.md
│       └── spec_update-description.md
├── package.json
├── vercel.json
├── AGENT.md
└── README.md
```

### 기술 스택
- Runtime: Node.js 18+ / TypeScript
- Framework: Vercel Serverless Functions
- Database: Supabase (PostgreSQL)
- APIs: Strava API v3

---

## 환경변수

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_VERIFY_TOKEN=your_verify_token
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_supabase_key
APP_URL=https://your-app.vercel.app
```

---

## 프롬프트 모음

### 1. Supabase 테이블 수정

```
users 테이블에 새 필드를 추가해줘.

추가할 필드:
- weekly_goal_km: FLOAT (주간 목표 거리)
- total_fat_burned: FLOAT (누적 체지방 감량)

마이그레이션 SQL 생성해줘.
```

---

### 2. OAuth 플로우 수정

```
api/auth/start.ts를 수정해줘.

변경사항:
- scope에 'profile:read_all' 추가
- state 파라미터로 CSRF 토큰 추가

현재 scope: activity:read_all,activity:write
```

---

### 3. Webhook 핸들러 수정

```
api/webhook/strava.ts를 수정해줘.

변경사항:
- activity.update 이벤트도 처리
- 운동 종류(type)별로 다른 메시지 템플릿 사용
```

---

### 4. 체지방 계산 로직 수정

```
calculateFatBurn 함수를 수정해줘.

변경사항:
- 운동 종류별 칼로리 보정 계수 적용
  - Running: 1.0
  - Cycling: 0.8
  - Swimming: 1.2
```

---

### 5. 음식 매칭 수정

```
food-matcher.ts의 음식 목록을 수정해줘.

변경사항:
- Tier 3 (~70g) 음식 목록에 한식 추가
- 새 음식: 떡볶이 반접시, 김밥 2줄, 비빔밥 반그릇
```

---

### 6. Description 템플릿 수정

```
description-builder.ts의 템플릿을 수정해줘.

새 템플릿:
━━━━━━━━━━━━━━━━━━━━━
🔥 Fat Burn Report
━━━━━━━━━━━━━━━━━━━━━

🏃 {activity_type}
📏 {distance}km | ⏱️ {duration}분
🔥 {calories}kcal 소모

{food_emoji} 체지방 {fat_burned_g}g 감량!
   ≈ {food_name} 태웠어요!

━━━━━━━━━━━━━━━━━━━━━
```

---

### 7. 새 API 엔드포인트 추가

```
api/stats/total.ts를 만들어줘.

기능:
- GET /api/stats/total?strava_id=xxx
- 해당 사용자의 전체 누적 통계 반환
- 응답: { total_distance, total_calories, total_fat_burned, activity_count }
```

---

### 8. 에러 핸들링 개선

```
Webhook 핸들러의 에러 핸들링을 개선해줘.

요구사항:
- 각 단계별 try-catch 분리
- 실패 시 Supabase에 에러 로그 저장
- 3회 이상 실패한 사용자에게 재인증 요청 필요 플래그 설정
```

---

### 9. 테스트 코드 작성

```
api/webhook/strava.ts에 대한 단위 테스트를 작성해줘.

테스트 케이스:
1. 구독 검증 성공/실패
2. activity.create 이벤트 정상 처리
3. 사용자 없을 때 무시
4. 토큰 갱신 동작
5. calories 없을 때 distance 기반 추정
6. Description 업데이트 성공/실패
```

---

### 10. 전체 리팩토링

```
api/webhook/strava.ts를 리팩토링해줘.

요구사항:
- 헬퍼 함수들을 src/로 분리
- 타입 정의를 src/types.ts로 분리
- 메인 핸들러는 오케스트레이션만 담당
```

---

## 디버깅 프롬프트

### Webhook이 동작하지 않을 때

```
Strava Webhook이 동작하지 않아. 다음을 확인해줘:

1. Vercel 로그에서 에러 확인
2. STRAVA_VERIFY_TOKEN이 올바른지 확인
3. Webhook 구독 상태 확인 (Strava API)
4. 사용자 토큰이 유효한지 확인
```

### Description이 업데이트 안 될 때

```
Strava Description이 업데이트 안 돼. 다음을 확인해줘:

1. OAuth scope에 activity:write가 포함되어 있는지
2. access_token이 유효한지
3. 활동 ID가 올바른지
4. Strava API 응답 에러 확인
```

---

## 배포 체크리스트

```
배포 전 체크리스트를 확인해줘:

1. 환경변수가 Vercel에 모두 설정되어 있는지
2. Supabase 테이블 스키마가 최신인지
3. Strava Webhook 구독이 활성화되어 있는지
4. OAuth scope가 activity:read_all,activity:write인지
5. 테스트 사용자로 E2E 테스트 완료했는지
```

---

## 음식 추가 프롬프트

```
food-matcher.ts에 새 음식을 추가해줘.

추가할 음식:
- Tier: ~70g
- 이모지: 🍜
- 이름: 잔치국수 반그릇

기존 목록에서 하나를 교체하거나, 목록을 11개로 늘려줘.
```