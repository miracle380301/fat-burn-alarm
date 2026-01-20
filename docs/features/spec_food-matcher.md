---
name: food-matcher
description: 체지방 감량량에 따라 적절한 음식을 매칭합니다. 6개 구간별로 각 10개 음식 중 랜덤으로 선택합니다. 요즘 유행하는 음식들로 구성되어 있습니다.
allowed-tools:
  - Bash
  - Read
  - Write
---

# Food Matcher

체지방 감량량을 요즘 유행하는 음식으로 재미있게 비유하는 스킬

## Instructions

1. 체지방 감량량(g) 입력
2. 해당 구간 판별 (6개 구간)
3. 구간 내 10개 음식 중 랜덤 선택
4. 이모지 + 음식명 반환

## Usage

```typescript
import { matchFood } from './food-matcher';

const food = matchFood(42);
// food: { emoji: '🍪', name: '두쫀쿠 1개' }
```

## Config

| 항목 | 값 |
|------|-----|
| 구간 수 | 6개 |
| 구간별 음식 | 10개씩 |
| 선택 방식 | 랜덤 |

## Input

| 필드 | 타입 | 설명 |
|------|------|------|
| fatGrams | number | 체지방 감량량 (g) |

## Output

| 필드 | 타입 | 설명 |
|------|------|------|
| emoji | string | 음식 이모지 |
| name | string | 음식명 |

## Food Table

### Tier 1: ~20g (가벼운 간식)

| 이모지 | 음식 |
|--------|------|
| 🍬 | 탕후루 1개 |
| 🍪 | 두쫀쿠 반개 |
| 🧁 | 뚱카롱 반개 |
| 🍫 | 허니버터칩 한줌 |
| 🥜 | 꼬북칩 한줌 |
| 🍿 | 먹태깡 한줌 |
| 🧃 | 흑당버블티 반컵 |
| 🍭 | 젤리스트로 1개 |
| 🍩 | 미니도넛 1개 |
| 🥧 | 에그타르트 반개 |

### Tier 2: ~40g (작은 간식)

| 이모지 | 음식 |
|--------|------|
| 🍪 | 두쫀쿠 1개 |
| 🧁 | 뚱카롱 1개 |
| 🥐 | 소금빵 1개 |
| 🍞 | 생크림빵 반개 |
| 🧇 | 크룽지 1개 |
| 🍡 | 약과 1개 |
| 🥮 | 인절미 크림떡 |
| 🍦 | 요아정 미니컵 |
| 🧀 | 바스크치즈케이크 한입 |
| 🥧 | 에그타르트 1개 |

### Tier 3: ~70g (일반 간식)

| 이모지 | 음식 |
|--------|------|
| 🍞 | 생크림빵 1개 |
| 🧇 | 크로플 1개 |
| 🍙 | 편의점 삼김 |
| 🍜 | 컵라면 반개 |
| 🥐 | 크로와상 1개 |
| 🍦 | 요아정 레귤러 |
| 🥗 | 포케 반그릇 |
| 🌽 | 옥수수 1개 |
| 🍠 | 군고구마 1개 |
| 🥪 | 서브웨이 15cm 반개 |

### Tier 4: ~100g (든든한 간식)

| 이모지 | 음식 |
|--------|------|
| 🍩 | 노티드 도넛 |
| 🧇 | 허니콤보 와플 |
| 🍟 | 맥도날드 감튀 M |
| 🌮 | 타코벨 타코 1개 |
| 🌯 | 부리토 반개 |
| 🥓 | 통대창 반인분 |
| 🍗 | BHC 뿌링클 1조각 |
| 🍰 | 투썸 케이크 1조각 |
| 🥐 | 올리브영 크루아상 |
| 🍕 | 피자 1조각 |

### Tier 5: ~150g (한 끼 식사)

| 이모지 | 음식 |
|--------|------|
| 🍔 | 맥도날드 빅맥 |
| 🍕 | 피자 2조각 |
| 🍜 | 신라면 1봉지 |
| 🍛 | 마라탕 반그릇 |
| 🍝 | 로제파스타 반접시 |
| 🌭 | 명랑핫도그 2개 |
| 🥘 | 떡볶이 1인분 |
| 🍱 | 편의점 도시락 |
| 🍲 | 순대국 반그릇 |
| 🥩 | 곱창 반인분 |

### Tier 6: 150g+ (푸짐한 식사)

| 이모지 | 음식 |
|--------|------|
| 🍖 | 통대창 1인분 |
| 🍗 | BBQ 황올 반마리 |
| 🍕 | 도미노 피자 반판 |
| 🍝 | 로제파스타 한접시 |
| 🍛 | 마라탕 한그릇 |
| 🍣 | 회전초밥 10접시 |
| 🥩 | 삼겹살 1인분 |
| 🍲 | 부대찌개 1인분 |
| 🥘 | 엽기떡볶이 1인분 |
| 🍱 | 한솥도시락 특대 |

## Implementation

```typescript
interface Food {
  emoji: string;
  name: string;
}

const FOOD_TABLE: Record<number, Food[]> = {
  20: [
    { emoji: '🍬', name: '탕후루 1개' },
    { emoji: '🍪', name: '두쫀쿠 반개' },
    { emoji: '🧁', name: '뚱카롱 반개' },
    { emoji: '🍫', name: '허니버터칩 한줌' },
    { emoji: '🥜', name: '꼬북칩 한줌' },
    { emoji: '🍿', name: '먹태깡 한줌' },
    { emoji: '🧃', name: '흑당버블티 반컵' },
    { emoji: '🍭', name: '젤리스트로 1개' },
    { emoji: '🍩', name: '미니도넛 1개' },
    { emoji: '🥧', name: '에그타르트 반개' },
  ],
  40: [
    { emoji: '🍪', name: '두쫀쿠 1개' },
    { emoji: '🧁', name: '뚱카롱 1개' },
    { emoji: '🥐', name: '소금빵 1개' },
    { emoji: '🍞', name: '생크림빵 반개' },
    { emoji: '🧇', name: '크룽지 1개' },
    { emoji: '🍡', name: '약과 1개' },
    { emoji: '🥮', name: '인절미 크림떡' },
    { emoji: '🍦', name: '요아정 미니컵' },
    { emoji: '🧀', name: '바스크치즈케이크 한입' },
    { emoji: '🥧', name: '에그타르트 1개' },
  ],
  70: [
    { emoji: '🍞', name: '생크림빵 1개' },
    { emoji: '🧇', name: '크로플 1개' },
    { emoji: '🍙', name: '편의점 삼김' },
    { emoji: '🍜', name: '컵라면 반개' },
    { emoji: '🥐', name: '크로와상 1개' },
    { emoji: '🍦', name: '요아정 레귤러' },
    { emoji: '🥗', name: '포케 반그릇' },
    { emoji: '🌽', name: '옥수수 1개' },
    { emoji: '🍠', name: '군고구마 1개' },
    { emoji: '🥪', name: '서브웨이 15cm 반개' },
  ],
  100: [
    { emoji: '🍩', name: '노티드 도넛' },
    { emoji: '🧇', name: '허니콤보 와플' },
    { emoji: '🍟', name: '맥도날드 감튀 M' },
    { emoji: '🌮', name: '타코벨 타코 1개' },
    { emoji: '🌯', name: '부리토 반개' },
    { emoji: '🥓', name: '통대창 반인분' },
    { emoji: '🍗', name: 'BHC 뿌링클 1조각' },
    { emoji: '🍰', name: '투썸 케이크 1조각' },
    { emoji: '🥐', name: '올리브영 크루아상' },
    { emoji: '🍕', name: '피자 1조각' },
  ],
  150: [
    { emoji: '🍔', name: '맥도날드 빅맥' },
    { emoji: '🍕', name: '피자 2조각' },
    { emoji: '🍜', name: '신라면 1봉지' },
    { emoji: '🍛', name: '마라탕 반그릇' },
    { emoji: '🍝', name: '로제파스타 반접시' },
    { emoji: '🌭', name: '명랑핫도그 2개' },
    { emoji: '🥘', name: '떡볶이 1인분' },
    { emoji: '🍱', name: '편의점 도시락' },
    { emoji: '🍲', name: '순대국 반그릇' },
    { emoji: '🥩', name: '곱창 반인분' },
  ],
  999: [
    { emoji: '🍖', name: '통대창 1인분' },
    { emoji: '🍗', name: 'BBQ 황올 반마리' },
    { emoji: '🍕', name: '도미노 피자 반판' },
    { emoji: '🍝', name: '로제파스타 한접시' },
    { emoji: '🍛', name: '마라탕 한그릇' },
    { emoji: '🍣', name: '회전초밥 10접시' },
    { emoji: '🥩', name: '삼겹살 1인분' },
    { emoji: '🍲', name: '부대찌개 1인분' },
    { emoji: '🥘', name: '엽기떡볶이 1인분' },
    { emoji: '🍱', name: '한솥도시락 특대' },
  ],
};

export function matchFood(fatGrams: number): Food {
  const tier = fatGrams <= 20 ? 20
             : fatGrams <= 40 ? 40
             : fatGrams <= 70 ? 70
             : fatGrams <= 100 ? 100
             : fatGrams <= 150 ? 150
             : 999;

  const foods = FOOD_TABLE[tier];
  const randomIndex = Math.floor(Math.random() * foods.length);
  
  return foods[randomIndex];
}
```

## Example Outputs

| 체지방 감량 | 가능한 출력 예시 |
|------------|-----------------|
| 15g | 🍪 두쫀쿠 반개 태웠어요! |
| 35g | 🥐 소금빵 1개 태웠어요! |
| 65g | 🧇 크로플 1개 태웠어요! |
| 95g | 🥓 통대창 반인분 태웠어요! |
| 140g | 🍛 마라탕 반그릇 태웠어요! |
| 200g | 🍗 BBQ 황올 반마리 태웠어요! |

## Notes

- 음식 목록은 2024-2025년 한국 트렌드 기준으로 구성
- 유행이 바뀌면 `FOOD_TABLE` 업데이트 필요
- 브랜드명 사용 시 상표권 주의 (필요시 일반명으로 대체)