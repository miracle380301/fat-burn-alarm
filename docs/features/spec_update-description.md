---
name: update-description
description: Strava 활동의 Description을 체지방 감량 리포트로 업데이트합니다. 이모지 기반 텍스트 아트로 결과를 표시합니다.
allowed-tools:
  - Bash
  - Read
  - Write
---

# Update Description

Strava 활동 Description에 Fat Burn Report를 업데이트하는 스킬

## Instructions

1. 운동 데이터 + 체지방 감량 + 음식 매칭 결과 받기
2. Description 템플릿 생성
3. Strava API로 활동 업데이트

## Usage

```typescript
import { updateDescription } from './description-builder';

await updateDescription({
  accessToken: 'xxx',
  activityId: 12345678,
  distance: 5200,      // meters
  duration: 1920,      // seconds
  calories: 320,
  fatBurnedG: 41.56,
  food: { emoji: '🍌', name: '바나나 1개' }
});
```

## Config

| 항목 | 값 |
|------|-----|
| API | Strava API v3 |
| Endpoint | PUT /api/v3/activities/{id} |
| 필요 권한 | activity:write |

## Input

| 필드 | 타입 | 설명 |
|------|------|------|
| accessToken | string | Strava Access Token |
| activityId | number | 활동 ID |
| distance | number | 거리 (m) |
| duration | number | 시간 (초) |
| calories | number | 소모 칼로리 |
| fatBurnedG | number | 체지방 감량 (g) |
| food | object | { emoji, name } |

## Output

| 필드 | 타입 | 설명 |
|------|------|------|
| success | boolean | 업데이트 성공 여부 |
| activityId | number | 업데이트된 활동 ID |

## Description Template

```
━━━━━━━━━━━━━━━━━━━━━
🔥 Fat Burn Report
━━━━━━━━━━━━━━━━━━━━━

📏 {distance}km | ⏱️ {duration}분
🔥 {calories}kcal 소모

{food_emoji} 체지방 {fat_burned_g}g 감량!
   ≈ {food_name} 태웠어요!

━━━━━━━━━━━━━━━━━━━━━
```

## Example Output

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

## Implementation

```typescript
interface DescriptionInput {
  accessToken: string;
  activityId: number;
  distance: number;      // meters
  duration: number;      // seconds
  calories: number;
  fatBurnedG: number;
  food: { emoji: string; name: string };
  existingDescription?: string;
}

export function buildDescription(input: DescriptionInput): string {
  const distanceKm = (input.distance / 1000).toFixed(1);
  const durationMin = Math.round(input.duration / 60);
  const fatRounded = Math.round(input.fatBurnedG);

  const report = `
━━━━━━━━━━━━━━━━━━━━━
🔥 Fat Burn Report
━━━━━━━━━━━━━━━━━━━━━

📏 ${distanceKm}km | ⏱️ ${durationMin}분
🔥 ${input.calories}kcal 소모

${input.food.emoji} 체지방 ${fatRounded}g 감량!
   ≈ ${input.food.name} 태웠어요!

━━━━━━━━━━━━━━━━━━━━━`.trim();

  // 기존 Description이 있으면 아래에 추가
  if (input.existingDescription) {
    return `${input.existingDescription}\n\n${report}`;
  }
  
  return report;
}

export async function updateDescription(input: DescriptionInput) {
  const description = buildDescription(input);

  const response = await fetch(
    `https://www.strava.com/api/v3/activities/${input.activityId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update activity: ${response.status}`);
  }

  return {
    success: true,
    activityId: input.activityId,
  };
}
```

## Strava API Request

```bash
curl -X PUT "https://www.strava.com/api/v3/activities/{id}" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{"description": "━━━━━━━━━━━━━━━━━━━━━\n🔥 Fat Burn Report\n..."}'
```

## Error Handling

| 에러 | 처리 |
|------|------|
| 401 Unauthorized | 토큰 갱신 후 재시도 |
| 403 Forbidden | activity:write 권한 확인 |
| 404 Not Found | 활동 ID 확인 |
| 429 Rate Limit | 잠시 후 재시도 |

## Notes

- 기존 Description이 있으면 보존하고 아래에 리포트 추가
- Strava Description 최대 길이: 약 10,000자
- 이모지는 Strava 웹/앱에서 정상 표시됨