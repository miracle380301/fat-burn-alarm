---
name: handle-webhook
description: Strava Webhook 이벤트를 수신하고 처리합니다. 사용자가 운동을 완료하면 자동으로 호출됩니다.
allowed-tools:
  - Bash
  - Read
  - Write
---

# Handle Webhook

Strava Webhook 이벤트 수신 및 운동 데이터 조회 스킬

## Instructions

1. Strava에서 Webhook 이벤트 수신
2. 이벤트 타입 확인 (activity.create)
3. Supabase에서 사용자 토큰 조회
4. 토큰 만료 시 자동 갱신
5. Strava API로 활동 상세 데이터 조회
6. 체지방 계산 → 음식 매칭 → Description 업데이트

## Usage

```typescript
import { WebhookHandler } from './webhook-handler';

const handler = new WebhookHandler({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_KEY,
  clientId: STRAVA_CLIENT_ID,
  clientSecret: STRAVA_CLIENT_SECRET
});

// Webhook 엔드포인트에서 호출
await handler.process({
  object_type: "activity",
  aspect_type: "create",
  object_id: 12345678,
  owner_id: 987654
});
```

## Config

| 항목 | 값 |
|------|-----|
| Webhook Endpoint | POST /webhook/strava |
| Verify Token | 구독 등록 시 설정한 값 |
| Activity API | GET /activities/{id} |
| Activity Update | PUT /activities/{id} |

## Webhook Event 구조

```json
{
  "object_type": "activity",
  "aspect_type": "create",
  "object_id": 12345678,
  "owner_id": 987654,
  "subscription_id": 12345,
  "event_time": 1234567890
}
```

## Flow

```
[Strava]
    │
    ▼
[1] Webhook 이벤트 수신 (activity.create)
    │
    ▼
[2] owner_id로 Supabase에서 사용자 조회
    │
    ▼
[3] 토큰 만료 확인 → 필요시 갱신
    │
    ▼
[4] Strava API로 활동 상세 조회
    │
    ▼
[5] calculate-fatburn으로 체지방 계산
    │
    ▼
[6] food-matcher로 음식 매칭 (랜덤)
    │
    ▼
[7] description-builder로 템플릿 생성
    │
    ▼
[8] Strava API로 활동 Description 업데이트
```

## Input (Webhook Event)

| 필드 | 타입 | 설명 |
|------|------|------|
| object_type | string | "activity" |
| aspect_type | string | "create" / "update" / "delete" |
| object_id | int | 활동 ID |
| owner_id | int | Strava 사용자 ID |

## Output (Activity Data)

| 필드 | 타입 | 설명 |
|------|------|------|
| name | string | 활동명 |
| type | string | 운동 종류 |
| distance | float | 거리 (m) |
| moving_time | int | 운동 시간 (초) |
| calories | float | 소모 칼로리 |

## Webhook Verification (GET)

Strava 구독 검증 요청 처리:

```typescript
// GET /webhook/strava?hub.mode=subscribe&hub.challenge=xxx&hub.verify_token=xxx
if (hub.verify_token === STRAVA_VERIFY_TOKEN) {
  return { "hub.challenge": hub.challenge };
}
```

## Error Handling

| 에러 | 처리 |
|------|------|
| 사용자 없음 | 무시 (로그만 기록), 200 응답 |
| 토큰 갱신 실패 | 로그 기록, 200 응답 |
| 활동 조회 실패 | 3회 재시도 후 로그 기록 |
| calories 없음 | distance × 60 (1km당 60kcal 추정) |
| Description 업데이트 실패 | 로그 기록, 200 응답 |

**중요:** Webhook은 항상 200 응답을 반환해야 합니다. 그렇지 않으면 Strava가 재시도합니다.