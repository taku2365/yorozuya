export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">生産性ツール集へようこそ</h1>
      <p className="text-muted-foreground">
        このアプリケーションは、ToDo管理、WBS（作業分解構成図）、カンバンボード、
        ガントチャートを統合した生産性向上ツールです。
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 text-xl font-semibold">ToDo管理</h2>
          <p className="text-sm text-muted-foreground">
            日々のタスクを効率的に管理し、期限と優先度を設定できます。
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 text-xl font-semibold">WBS</h2>
          <p className="text-sm text-muted-foreground">
            プロジェクトを階層的に分解し、進捗を可視化できます。
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 text-xl font-semibold">カンバンボード</h2>
          <p className="text-sm text-muted-foreground">
            タスクの状態を視覚的に管理し、ワークフローを最適化できます。
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-2 text-xl font-semibold">ガントチャート</h2>
          <p className="text-sm text-muted-foreground">
            プロジェクトのスケジュールと依存関係を時系列で表示できます。
          </p>
        </div>
      </div>
      
      <div className="rounded-lg bg-muted p-6">
        <h2 className="mb-2 text-lg font-semibold">特徴</h2>
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>完全オフライン対応 - インターネット接続不要</li>
          <li>会員登録不要 - すぐに使い始められます</li>
          <li>データはローカルに保存 - プライバシーを保護</li>
          <li>レスポンシブデザイン - あらゆるデバイスで快適に使用</li>
        </ul>
      </div>
    </div>
  );
}
