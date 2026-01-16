---

name: setup-strava

description: Strava OAuth 인증 및 Webhook 등록을 수행합니다. 새로운 사용자가 서비스에 가입할 때 최초 1회 사용하세요.

allowed-tools:

&nbsp; - Bash

&nbsp; - Read

&nbsp; - Write

---



\# Setup Strava



최초 OAuth 인증 + 사용자 정보 저장 + Webhook 구독 등록 스킬



\## Instructions



1\. 사용자를 Strava 로그인 페이지로 리다이렉트

2\. 인증 완료 후 Authorization Code 수신

3\. Access Token + Refresh Token 발급

4\. Supabase에 사용자 정보 저장

5\. Strava Webhook 구독 등록



\## Usage

```python

from src.strava\_setup import StravaSetup



setup = StravaSetup(

&nbsp;   client\_id=STRAVA\_CLIENT\_ID,

&nbsp;   client\_secret=STRAVA\_CLIENT\_SECRET,

&nbsp;   supabase\_url=SUPABASE\_URL,

&nbsp;   supabase\_key=SUPABASE\_KEY

)



\# 1. 인증 URL 생성

auth\_url = setup.get\_auth\_url(redirect\_uri="https://your-app.com/callback")



\# 2. 콜백에서 토큰 발급 + 저장

user = setup.handle\_callback(code="authorization\_code")

```



\## Config



| 항목 | 값 |

|------|-----|

| Auth URL | https://www.strava.com/oauth/authorize |

| Token URL | https://www.strava.com/oauth/token |

| Scope | activity:read\_all |

| Webhook URL | https://www.strava.com/api/v3/push\_subscriptions |



\## Flow

```

\[사용자]

&nbsp;   │

&nbsp;   ▼

\[1] Strava 로그인 페이지

&nbsp;   │

&nbsp;   ▼

\[2] 권한 허용 → Authorization Code 발급

&nbsp;   │

&nbsp;   ▼

\[3] Token 발급 (Access + Refresh)

&nbsp;   │

&nbsp;   ▼

\[4] Supabase에 저장

&nbsp;   │

&nbsp;   ▼

\[5] Webhook 구독 등록

```



\## Supabase 저장 데이터



| 필드 | 설명 |

|------|------|

| strava\_id | Strava 사용자 ID |

| strava\_nickname | Strava 닉네임 |

| access\_token | API 호출용 토큰 |

| refresh\_token | 토큰 갱신용 |

| token\_expires\_at | 만료 시간 |

| telegram\_chat\_id | 알림 받을 채팅 ID |



\## Error Handling



| 에러 | 처리 |

|------|------|

| Invalid Code | 재인증 요청 |

| Duplicate User | 기존 토큰 업데이트 |

| Webhook 등록 실패 | 재시도 (최대 3회) |

