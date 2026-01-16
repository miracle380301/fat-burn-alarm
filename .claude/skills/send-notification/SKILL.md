---

name: send-notification

description: 텔레그램으로 알림 메시지를 발송합니다. 체지방 감량 계산이 완료된 후 사용자에게 결과를 알려줄 때 사용하세요.

allowed-tools:

&nbsp; - Bash

&nbsp; - Read

&nbsp; - Write

---



\# Send Notification



텔레그램 봇으로 운동 결과 메시지를 발송하는 스킬



\## Instructions



1\. 운동 데이터 + 체지방 감량 결과 받기

2\. 메시지 포맷 생성

3\. Telegram Bot API로 발송



\## Usage

```python

from src.notifier import TelegramNotifier



notifier = TelegramNotifier(

&nbsp;   bot\_token=TELEGRAM\_BOT\_TOKEN,

&nbsp;   chat\_id=TELEGRAM\_CHAT\_ID

)

notifier.send(

&nbsp;   activity\_name="아침 러닝",

&nbsp;   distance=5200,

&nbsp;   duration=1920,

&nbsp;   calories=320,

&nbsp;   fat\_burned\_g=41.56

)

```



\## Config



| 항목 | 값 |

|------|-----|

| API | Telegram Bot API |

| Base URL | https://api.telegram.org/bot{token} |

| Method | sendMessage |

| Parse Mode | Markdown |



\## Input



| 필드 | 타입 | 설명 |

|------|------|------|

| activity\_name | string | 활동명 |

| distance | float | 거리 (m) |

| duration | int | 시간 (초) |

| calories | float | 소모 칼로리 |

| fat\_burned\_g | float | 체지방 감량 (g) |



\## Output



| 필드 | 타입 | 설명 |

|------|------|------|

| success | boolean | 발송 성공 여부 |

| message\_id | int | 텔레그램 메시지 ID |



\## Message Template

```

🏃 운동 완료!

{activity\_name} {distance\_km}km, {duration\_min}분

소모 칼로리: {calories}kcal

체지방 감량: 약 {fat\_burned\_g}g 🔥

```



\## Error Handling



| 에러 | 처리 |

|------|------|

| 401 Unauthorized | 봇 토큰 확인 |

| 400 Bad Request | chat\_id 확인 |

| 429 Too Many Requests | 1분 후 재시도 |

