import type { UnifiedTask } from '@/lib/types/unified-task';

/**
 * ビューアダプターの基底クラス
 */
export abstract class BaseAdapter<T> {
  /**
   * ビュー固有のデータをUnifiedTaskに変換
   */
  abstract toUnifiedTask(data: T): UnifiedTask;

  /**
   * UnifiedTaskをビュー固有のデータに変換
   */
  abstract fromUnifiedTask(unifiedTask: UnifiedTask): T;

  /**
   * UnifiedTaskが変換可能かチェック
   */
  abstract canConvert(unifiedTask: UnifiedTask): boolean;

  /**
   * ビュー固有のメタデータを作成
   */
  abstract createMetadata(data: T): Record<string, any>;
}