/**
 * 텔레그램 알림 모듈
 * Telegram Bot API를 사용하여 메시지 발송
 */

export interface ActivityNotification {
  activityName: string;
  distanceKm: number;
  durationMin: number;
  calories: number;
  fatBurnedGrams: number;
}

/**
 * 운동 완료 알림 메시지 생성
 *
 * @param data 활동 데이터
 * @returns 마크다운 형식 메시지
 */
export function formatNotificationMessage(data: ActivityNotification): string {
  return `운동 완료!
${data.activityName} ${data.distanceKm.toFixed(2)}km, ${data.durationMin}분
소모 칼로리: ${data.calories}kcal
체지방 감량: 약 ${data.fatBurnedGrams}g`;
}

/**
 * 텔레그램 메시지 발송
 *
 * @param chatId 텔레그램 채팅 ID
 * @param message 발송할 메시지
 * @returns 발송 성공 여부
 */
export async function sendTelegramMessage(
  chatId: string,
  message: string
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Telegram API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

/**
 * 운동 완료 알림 발송
 *
 * @param chatId 텔레그램 채팅 ID
 * @param data 활동 데이터
 * @returns 발송 성공 여부
 */
export async function sendActivityNotification(
  chatId: string,
  data: ActivityNotification
): Promise<boolean> {
  const message = formatNotificationMessage(data);
  return sendTelegramMessage(chatId, message);
}
