/**
 * 체지방 감량 계산 모듈
 * 칼로리를 체지방 감량(g)으로 변환
 */

export interface FatBurnResult {
  calories: number;
  fatBurnedGrams: number;
}

/**
 * 소모 칼로리를 체지방 감량(g)으로 변환
 * 공식: (calories / 7700) × 1000
 * 체지방 1kg = 약 7700kcal
 *
 * @param calories 소모 칼로리 (kcal)
 * @returns 체지방 감량 (g), 소수점 2자리 반올림
 */
export function calculateFatBurn(calories: number): number {
  const fatBurnedGrams = (calories / 7700) * 1000;
  return Math.round(fatBurnedGrams * 100) / 100;
}

/**
 * 거리 기반 칼로리 추정
 * 칼로리 정보가 없을 때 사용
 *
 * @param distanceMeters 거리 (미터)
 * @returns 추정 칼로리 (kcal)
 */
export function estimateCaloriesFromDistance(distanceMeters: number): number {
  const distanceKm = distanceMeters / 1000;
  // 1km당 약 60kcal 소모 추정
  return Math.round(distanceKm * 60);
}

/**
 * 전체 체지방 계산 결과 반환
 *
 * @param calories 소모 칼로리 (kcal)
 * @returns 칼로리와 체지방 감량 결과
 */
export function getFatBurnResult(calories: number): FatBurnResult {
  return {
    calories,
    fatBurnedGrams: calculateFatBurn(calories),
  };
}
