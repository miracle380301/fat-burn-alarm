/**
 * 로컬 테스트 스크립트
 * 외부 서비스 없이 핵심 로직 테스트
 */

import { calculateFatBurn, estimateCaloriesFromDistance, getFatBurnResult } from './calculator';
import { formatNotificationMessage, ActivityNotification } from './notifier';

console.log('=== FatBurn Alert 로컬 테스트 ===\n');

// 1. 체지방 계산 테스트
console.log('1. 체지방 계산 테스트');
console.log('------------------------');

const testCases = [
  { calories: 320, expected: 41.56 },
  { calories: 500, expected: 64.94 },
  { calories: 1000, expected: 129.87 },
  { calories: 0, expected: 0 },
];

testCases.forEach(({ calories, expected }) => {
  const result = calculateFatBurn(calories);
  const pass = Math.abs(result - expected) < 0.01;
  console.log(`  ${calories}kcal → ${result}g (예상: ${expected}g) ${pass ? '✓' : '✗'}`);
});

// 2. 거리 기반 칼로리 추정 테스트
console.log('\n2. 거리 기반 칼로리 추정 테스트');
console.log('--------------------------------');

const distanceTests = [
  { meters: 5000, expectedCal: 300 },   // 5km
  { meters: 10000, expectedCal: 600 },  // 10km
  { meters: 21097, expectedCal: 1266 }, // 하프마라톤
];

distanceTests.forEach(({ meters, expectedCal }) => {
  const result = estimateCaloriesFromDistance(meters);
  const km = meters / 1000;
  console.log(`  ${km}km → ${result}kcal (예상: ${expectedCal}kcal)`);
});

// 3. 알림 메시지 포맷 테스트
console.log('\n3. 알림 메시지 포맷 테스트');
console.log('---------------------------');

const sampleActivity: ActivityNotification = {
  activityName: '아침 조깅',
  distanceKm: 5.23,
  durationMin: 32,
  calories: 320,
  fatBurnedGrams: 41.56,
};

const message = formatNotificationMessage(sampleActivity);
console.log('생성된 메시지:');
console.log('---');
console.log(message);
console.log('---');

// 4. 전체 파이프라인 시뮬레이션
console.log('\n4. 전체 파이프라인 시뮬레이션');
console.log('------------------------------');

function simulatePipeline(activityName: string, distanceMeters: number, durationSeconds: number, calories?: number) {
  // 칼로리가 없으면 거리 기반 추정
  const finalCalories = calories || estimateCaloriesFromDistance(distanceMeters);
  const fatBurned = calculateFatBurn(finalCalories);

  const notification: ActivityNotification = {
    activityName,
    distanceKm: distanceMeters / 1000,
    durationMin: Math.round(durationSeconds / 60),
    calories: finalCalories,
    fatBurnedGrams: fatBurned,
  };

  return formatNotificationMessage(notification);
}

// 시뮬레이션 1: 칼로리 있는 경우
console.log('\n[케이스 1] 5km 러닝 (칼로리 제공됨)');
console.log(simulatePipeline('모닝 러닝', 5000, 1800, 320));

// 시뮬레이션 2: 칼로리 없는 경우 (거리 기반 추정)
console.log('\n[케이스 2] 10km 사이클링 (칼로리 없음 - 추정)');
console.log(simulatePipeline('출퇴근 자전거', 10000, 2400));

console.log('\n=== 테스트 완료 ===');
