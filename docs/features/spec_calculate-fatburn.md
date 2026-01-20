---
name: calculate-fatburn
description: 소모 칼로리를 체지방 감량(g)으로 변환합니다. 운동 데이터를 받아서 체지방 감량 수치를 계산할 때 사용하세요.
allowed-tools:
  - Bash
  - Read
  - Write
---

# Calculate FatBurn

칼로리 소모량을 체지방 감량량으로 변환하는 스킬

## Instructions

1. 소모 칼로리 입력 받기
2. 체지방 변환 공식 적용 (7,700kcal = 1kg)
3. 그램 단위로 반환

## Formula

```
체지방 감량(g) = (소모 칼로리 / 7700) × 1000
```

예시: 320kcal → (320 / 7700) × 1000 = 약 42g

## Usage

```typescript
import { calculateFatBurn } from './calculator';

const result = calculateFatBurn(320);
// result: { fat_burned_g: 41.56, fat_burned_kg: 0.04 }
```

## Config

| 항목 | 값 |
|------|-----|
| 체지방 1kg | 7,700 kcal |
| 출력 단위 | gram (g) |
| 소수점 | 2자리 반올림 |

## Input

| 필드 | 타입 | 설명 |
|------|------|------|
| calories | number | 소모 칼로리 |

## Output

| 필드 | 타입 | 설명 |
|------|------|------|
| fat_burned_g | number | 체지방 감량 (그램) |
| fat_burned_kg | number | 체지방 감량 (킬로그램) |

## Example

| 소모 칼로리 | 체지방 감량 |
|-------------|-------------|
| 100 kcal | 13g |
| 320 kcal | 42g |
| 500 kcal | 65g |
| 770 kcal | 100g |

## Implementation

```typescript
const FAT_CALORIES_PER_KG = 7700;

export function calculateFatBurn(calories: number) {
  const fatBurnedKg = calories / FAT_CALORIES_PER_KG;
  const fatBurnedG = Math.round(fatBurnedKg * 1000 * 100) / 100;
  
  return {
    fat_burned_g: fatBurnedG,
    fat_burned_kg: Math.round(fatBurnedKg * 100) / 100
  };
}
```