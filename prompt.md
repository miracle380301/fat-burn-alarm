\# FatBurn Alert 프롬프트 가이드



Claude Code로 체지방 알림 서비스를 처음부터 만드는 프롬프트 모음



---



\## 0단계: 프로젝트 구조 이해



\### 폴더 구조

```

fatburn-alert/

├── README.md

├── prompt.md

├── .env

├── .claude/

│   └── skills/

│       ├── setup-strava/SKILL.md

│       ├── handle-webhook/SKILL.md

│       ├── calculate-fatburn/SKILL.md

│       └── send-notification/SKILL.md

└── src/

&nbsp;   ├── index.ts

&nbsp;   ├── strava-setup.ts

&nbsp;   ├── webhook-handler.ts

&nbsp;   ├── calculator.ts

&nbsp;   └── notifier.ts

```



\### 기술 스택

\- Runtime: Node.js + TypeScript

\- API: Strava API v3, Telegram Bot API

\- DB: Supabase (PostgreSQL)

\- 배포: Vercel (Webhook 엔드포인트)



---



\## 1단계: Supabase 테이블 생성

```

Supabase에 사용자 테이블을 만들어줘.



테이블명: users



필드:

\- id: SERIAL PRIMARY KEY

\- strava\_id: VARCHAR(50) UNIQUE

\- strava\_nickname: VARCHAR(100)

\- access\_token: TEXT

\- refresh\_token: TEXT

\- token\_expires\_at: TIMESTAMP

\- telegram\_chat\_id: VARCHAR(50)

\- created\_at: TIMESTAMP DEFAULT NOW()



SQL 생성해줘.

```



---



\## 2단계: Strava OAuth 설정

```

Strava OAuth 인증 모듈을 만들어줘.



src/strava-setup.ts에:

1\. 인증 URL 생성 (scope: activity:read\_all)

2\. Authorization Code → Token 교환

3\. Supabase에 사용자 정보 저장

4\. Webhook 구독 등록



환경변수:

\- STRAVA\_CLIENT\_ID

\- STRAVA\_CLIENT\_SECRET

\- SUPABASE\_URL

\- SUPABASE\_KEY

```



---



\## 3단계: Webhook 핸들러

```

Strava Webhook 핸들러를 만들어줘.



src/webhook-handler.ts에:

1\. POST /webhook/strava 엔드포인트

2\. GET /webhook/strava (구독 검증용)

3\. activity.create 이벤트 처리

4\. owner\_id로 Supabase에서 사용자 조회

5\. 토큰 만료 시 자동 갱신

6\. Strava API로 활동 상세 조회



\*\*중요:\*\*

\- aspect\_type이 "create"일 때만 처리

\- calories 없으면 distance 기반으로 추정 (1km당 약 60kcal)

```



---



\## 4단계: 체지방 계산

```

체지방 감량 계산 모듈을 만들어줘.



src/calculator.ts에:

\- 입력: calories (소모 칼로리)

\- 출력: fat\_burned\_g (체지방 감량 그램)

\- 공식: (calories / 7700) × 1000

\- 소수점 2자리 반올림



예시:

\- 320kcal → 41.56g

\- 500kcal → 64.94g

```



---



\## 5단계: 텔레그램 알림

```

텔레그램 알림 모듈을 만들어줘.



src/notifier.ts에:

1\. Telegram Bot API로 메시지 발송

2\. 마크다운 파싱 지원



메시지 템플릿:

```

🏃 운동 완료!

{activity\_name} {distance\_km}km, {duration\_min}분

소모 칼로리: {calories}kcal

체지방 감량: 약 {fat\_burned\_g}g 🔥

```



환경변수:

\- TELEGRAM\_BOT\_TOKEN

```



---



\## 6단계: 전체 연결

```

전체 파이프라인을 연결해줘.



src/index.ts에:

1\. Vercel Serverless Function으로 구성

2\. GET /webhook/strava → 구독 검증

3\. POST /webhook/strava → 이벤트 처리



흐름:

Webhook 수신 → 사용자 조회 → 활동 조회 → 체지방 계산 → 텔레그램 발송



에러 발생 시 콘솔 로그만 남기고 200 응답 (Strava 재시도 방지)

```



---



\## 원샷 프롬프트 (한 번에 다 만들기)

