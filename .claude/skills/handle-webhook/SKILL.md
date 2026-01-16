---

name: handle-webhook

description: Strava Webhook 이벤트를 수신하고 처리합니다. 사용자가 운동을 완료하면 자동으로 호출됩니다.

allowed-tools:

&nbsp; - Bash

&nbsp; - Read

&nbsp; - Write

---



\# Handle Webhook



Strava Webhook 이벤트 수신 및 운동 데이터 조회 스킬



\## Instructions



1\. Strava에서 Webhook 이벤트 수신

2\. 이벤트 타입 확인 (activity.create)

3\. Supabase에서 사용자 토큰 조회

4\. 토큰 만료 시 자동 갱신

5\. Strava API로 활동 상세 데이터 조회

6\. 다음 스킬로 데이터 전달



\## Usage

```python

from src.webhook\_handler import WebhookHandler



handler = WebhookHandler(

&nbsp;   supabase\_url=SUPABASE\_URL,

&nbsp;   supabase\_key=SUPABASE\_KEY,

&nbsp;   client\_id=STRAVA\_CLIENT\_ID,

&nbsp;   client\_secret=STRAVA\_CLIENT\_SECRET

)



\# Webhook 엔드포인트에서 호출

activity = handler.process(event={

&nbsp;   "object\_type": "activity",

&nbsp;   "aspect\_type": "create",

&nbsp;   "object\_id": 12345678,

&nbsp;   "owner\_id": 987654

})

```



\## Config



| 항목 | 값 |

|------|-----|

| Webhook Endpoint | POST /webhook/strava |

| Verify Token | 구독 등록 시 설정한 값 |

| Activity API | GET /activities/{id} |



\## Webhook Event 구조

```json

{

&nbsp; "object\_type": "activity",

&nbsp; "aspect\_type": "create",

&nbsp; "object\_id": 12345678,

&nbsp; "owner\_id": 987654,

&nbsp; "subscription\_id": 12345,

&nbsp; "event\_time": 1234567890

}

```



\## Flow

```

\[Strava]

&nbsp;   │

&nbsp;   ▼

\[1] Webhook 이벤트 수신 (activity.create)

&nbsp;   │

&nbsp;   ▼

\[2] owner\_id로 Supabase에서 사용자 조회

&nbsp;   │

&nbsp;   ▼

\[3] 토큰 만료 확인 → 필요시 갱신

&nbsp;   │

&nbsp;   ▼

\[4] Strava API로 활동 상세 조회

&nbsp;   │

&nbsp;   ▼

\[5] calculate-fatburn으로 전달

```



\## Input (Webhook Event)



| 필드 | 타입 | 설명 |

|------|------|------|

| object\_type | string | "activity" |

| aspect\_type | string | "create" / "update" / "delete" |

| object\_id | int | 활동 ID |

| owner\_id | int | Strava 사용자 ID |



\## Output (Activity Data)



| 필드 | 타입 | 설명 |

|------|------|------|

| name | string | 활동명 |

| type | string | 운동 종류 |

| distance | float | 거리 (m) |

| moving\_time | int | 운동 시간 (초) |

| calories | float | 소모 칼로리 |

| user | object | 사용자 정보 (telegram\_chat\_id 포함) |



\## Error Handling



| 에러 | 처리 |

|------|------|

| 사용자 없음 | 무시 (로그만 기록) |

| 토큰 갱신 실패 | 사용자에게 재인증 요청 알림 |

| 활동 조회 실패 | 3회 재시도 후 실패 로그 |

| calories 없음 | distance × 평균 칼로리로 추정 |

