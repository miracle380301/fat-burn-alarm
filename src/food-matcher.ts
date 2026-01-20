/**
 * Food Matcher
 * 체지방 감량량에 따른 음식 매칭
 */

import foodsData from '../data/foods.json';

interface Food {
  emoji: string;
  name: string;
}

interface FoodTier {
  maxGrams: number;
  foods: Food[];
}

interface FoodMatch {
  emoji: string;
  name: string;
  fatBurnedG: number;
}

// JSON에서 음식 데이터 로드
const FOOD_TIERS: FoodTier[] = foodsData.tiers;

/**
 * 체지방 감량량에 맞는 음식을 랜덤으로 선택
 */
export function matchFood(fatBurnedG: number): FoodMatch {
  // 해당 구간 찾기
  const tier = FOOD_TIERS.find((t) => fatBurnedG <= t.maxGrams) || FOOD_TIERS[FOOD_TIERS.length - 1];

  // 랜덤 선택
  const randomIndex = Math.floor(Math.random() * tier.foods.length);
  const food = tier.foods[randomIndex];

  return {
    emoji: food.emoji,
    name: food.name,
    fatBurnedG,
  };
}

/**
 * 특정 구간의 음식 목록 반환 (디버깅/테스트용)
 */
export function getFoodsByTier(fatBurnedG: number): Food[] {
  const tier = FOOD_TIERS.find((t) => fatBurnedG <= t.maxGrams) || FOOD_TIERS[FOOD_TIERS.length - 1];
  return tier.foods;
}

/**
 * 전체 음식 목록 반환
 */
export function getAllFoods(): FoodTier[] {
  return FOOD_TIERS;
}

export type { Food, FoodTier, FoodMatch };
