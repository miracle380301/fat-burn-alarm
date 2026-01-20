/**
 * Description Builder
 * Strava 활동 Description 생성 및 업데이트
 */

import { matchFood } from './food-matcher';

interface ActivityData {
  distance: number; // meters
  movingTime: number; // seconds
  calories: number;
  fatBurnedG: number;
}

interface DescriptionResult {
  description: string;
  foodEmoji: string;
  foodName: string;
}

/**
 * Fat Burn Report Description 생성
 */
export function buildDescription(activity: ActivityData): DescriptionResult {
  const distanceKm = (activity.distance / 1000).toFixed(1);
  const durationMin = Math.round(activity.movingTime / 60);
  const fatBurnedG = Math.round(activity.fatBurnedG * 100) / 100;

  // 음식 매칭
  const food = matchFood(fatBurnedG);

  const description = `━━━━━━━━━━━━━━━━━━━━━
🔥 Fat Burn Report
━━━━━━━━━━━━━━━━━━━━━

📏 ${distanceKm}km | ⏱️ ${durationMin}분
🔥 ${activity.calories}kcal 소모

${food.emoji} 체지방 ${fatBurnedG}g 감량!
   ≈ ${food.name} 태웠어요!

━━━━━━━━━━━━━━━━━━━━━`;

  return {
    description,
    foodEmoji: food.emoji,
    foodName: food.name,
  };
}

/**
 * 기존 Description과 합치기
 */
export function mergeDescription(existing: string | null, newReport: string): string {
  if (!existing || existing.trim() === '') {
    return newReport;
  }

  // 이미 Fat Burn Report가 있으면 교체
  if (existing.includes('🔥 Fat Burn Report')) {
    const reportStart = existing.indexOf('━━━━━━━━━━━━━━━━━━━━━');
    if (reportStart !== -1) {
      // 기존 리포트 이전 내용만 유지
      const beforeReport = existing.substring(0, reportStart).trim();
      if (beforeReport) {
        return `${beforeReport}\n\n${newReport}`;
      }
      return newReport;
    }
  }

  // 기존 내용 아래에 추가
  return `${existing}\n\n${newReport}`;
}

/**
 * Strava API로 활동 Description 업데이트
 */
export async function updateStravaDescription(
  activityId: number,
  accessToken: string,
  description: string
): Promise<boolean> {
  try {
    const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      console.error('Failed to update Strava description:', response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating Strava description:', error);
    return false;
  }
}

export type { ActivityData, DescriptionResult };
