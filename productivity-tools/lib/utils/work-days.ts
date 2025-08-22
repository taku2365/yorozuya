/**
 * 指定された日付が営業日かどうかを判定する
 * @param date 判定する日付
 * @returns 営業日の場合true、週末の場合false
 */
export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6; // 0: Sunday, 6: Saturday
}

/**
 * 2つの日付間の営業日数を計算する
 * @param startDate 開始日
 * @param endDate 終了日
 * @returns 営業日数
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  // 終了日まで1日ずつ進めて営業日をカウント
  while (current <= endDate) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * 文字列形式の日付から営業日数を計算する
 * @param startDate 開始日（YYYY-MM-DD形式）
 * @param endDate 終了日（YYYY-MM-DD形式）
 * @returns 営業日数、または無効な日付の場合null
 */
export function calculateWorkDays(
  startDate?: string,
  endDate?: string
): number | null {
  if (!startDate || !endDate) {
    return null;
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 日付の妥当性チェック
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return null;
  }
  
  // 終了日が開始日より前の場合
  if (end < start) {
    return 0;
  }
  
  return getBusinessDaysBetween(start, end);
}

/**
 * 指定された日付に営業日を加算する
 * @param date 基準日
 * @param days 加算する営業日数
 * @returns 計算後の日付
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remainingDays = days;
  
  while (remainingDays > 0) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) {
      remainingDays--;
    }
  }
  
  return result;
}