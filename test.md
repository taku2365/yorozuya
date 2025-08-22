#　TDDテスト計画書
## Claude Code + Playwright MCP + Serena MCP

---

## 1. テスト計画概要

### 1.1 目的
TDD手法に基づき、Claude Codeが自動実行可能なテストスイートを構築するためのガイドラインです。

### 1.2 スコープ
- **対象**: Webアプリケーション/システムの自動テスト
- **テストツール**: 
  - Playwright MCP (ブラウザ自動化)
  - Serena MCP (テスト管理・実行)
- **実行環境**: Claude Code

### 1.3 TDDの基本サイクル
```
1. RED: 失敗するテストを書く
2. GREEN: テストを通す最小限のコードを書く
3. REFACTOR: コードを改善する
```

---

## 2. テスト戦略

### 2.1 テストの分類（テストピラミッド）

#### Unit Tests (70%)
```javascript
// 例: 単体テストの構造
describe('計算機能', () => {
  test('2つの数値の加算が正しく動作する', () => {
    // Arrange
    const a = 5;
    const b = 3;
    
    // Act
    const result = add(a, b);
    
    // Assert
    expect(result).toBe(8);
  });
});
```

#### Integration Tests (20%)
```javascript
// 例: 統合テストの構造
describe('API統合テスト', () => {
  test('ユーザー作成からログインまでのフロー', async () => {
    // Given: ユーザー情報を準備
    const userData = { email: 'test@example.com', password: 'secure123' };
    
    // When: ユーザー作成とログイン
    const user = await createUser(userData);
    const session = await login(userData);
    
    // Then: セッションが有効であることを確認
    expect(session.isValid).toBe(true);
  });
});
```

#### E2E Tests (10%)
```javascript
// 例: Playwright MCPを使用したE2Eテスト
describe('ユーザージャーニーテスト', () => {
  test('商品購入の完全フロー', async ({ page }) => {
    // ページ遷移
    await page.goto('https://example.com');
    
    // 商品検索
    await page.fill('[data-testid="search-input"]', 'laptop');
    await page.click('[data-testid="search-button"]');
    
    // 商品選択
    await page.click('[data-testid="product-item"]:first-child');
    
    // カートに追加
    await page.click('[data-testid="add-to-cart"]');
    
    // 購入確認
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
  });
});
```

---

## 3. TDD実装手順

### 3.1 テストファースト開発フロー

```markdown
1. **要件の明確化**
   - ユーザーストーリーを定義
   - 受け入れ条件を設定

2. **テストケース設計**
   - Given-When-Thenフォーマットで記述
   - エッジケースを含める

3. **失敗するテストの作成（RED）**
   - 最小限のテストコードを書く
   - テストが失敗することを確認

4. **実装（GREEN）**
   - テストを通す最小限のコードを実装
   - 過度な実装は避ける

5. **リファクタリング（REFACTOR）**
   - コードの重複を除去
   - 可読性を向上
   - テストが通り続けることを確認
```

### 3.2 Claude Code実行用のテストテンプレート

```javascript
// test-template.js
const { test, expect } = require('@playwright/test');

// Serena MCPでのテスト管理設定
const testConfig = {
  project: 'MyProject',
  suite: 'TDD-Suite',
  tags: ['tdd', 'automated'],
};

// テストのセットアップ
test.beforeEach(async ({ page }) => {
  // 初期化処理
  await page.goto(process.env.BASE_URL || 'http://localhost:3000');
});

// テストケース
test.describe('機能名', () => {
  test('シナリオ: 正常系', async ({ page }) => {
    // Arrange (準備)
    
    // Act (実行)
    
    // Assert (検証)
  });
  
  test('シナリオ: 異常系', async ({ page }) => {
    // エラーケースのテスト
  });
});

// テストの後処理
test.afterEach(async ({ page }) => {
  // クリーンアップ処理
});
```

---

## 4. テスト実行計画

### 4.1 継続的インテグレーション（CI）

```yaml
# .claude-code/test-config.yml
name: TDD Test Suite

triggers:
  - on_commit
  - on_pull_request
  - scheduled: "0 2 * * *"  # 毎日2時に実行

steps:
  - name: Setup
    run: |
      npm install
      npx playwright install
      
  - name: Unit Tests
    run: npm run test:unit
    
  - name: Integration Tests
    run: npm run test:integration
    
  - name: E2E Tests
    run: npm run test:e2e
    
  - name: Report
    run: |
      # Serena MCPでレポート生成
      serena-mcp generate-report
```

### 4.2 テスト実行コマンド

```bash
# Claude Code用の実行コマンド例

# 全テスト実行
claude-code run "npm test"

# TDDサイクル実行
claude-code run "npm run tdd:watch"

# 特定のテストスイート実行
claude-code run "npm run test:unit -- --grep='計算機能'"

# Playwrightテスト実行
claude-code run "npx playwright test"

# Serena MCPでのテスト管理
claude-code run "serena-mcp execute --suite=TDD-Suite"
```

---

## 5. テスト品質基準

### 5.1 カバレッジ目標
- **コードカバレッジ**: 80%以上
- **ブランチカバレッジ**: 75%以上
- **関数カバレッジ**: 90%以上

### 5.2 テストの原則（FIRST）
- **Fast**: 高速に実行できる
- **Independent**: 他のテストに依存しない
- **Repeatable**: 何度でも同じ結果
- **Self-Validating**: 自動で成功/失敗を判定
- **Timely**: 適切なタイミングで作成

### 5.3 アサーションの指針
```javascript
// 良い例: 具体的で明確なアサーション
expect(user.age).toBe(25);
expect(response.status).toBe(200);
expect(button).toBeEnabled();

// 避けるべき例: 曖昧なアサーション
expect(result).toBeTruthy();
expect(data).toBeDefined();
```

---

## 6. テストデータ管理

### 6.1 テストフィクスチャ
```javascript
// fixtures/users.js
export const testUsers = {
  valid: {
    email: 'test@example.com',
    password: 'SecurePass123!',
    name: 'Test User'
  },
  invalid: {
    email: 'invalid-email',
    password: '123',
    name: ''
  }
};
```

### 6.2 モックとスタブ
```javascript
// mocks/api.js
export const mockApiResponses = {
  success: { status: 200, data: { message: 'Success' } },
  error: { status: 500, data: { error: 'Internal Server Error' } }
};
```

---

## 7. 実行スケジュール

### 7.1 日次実行
- **対象**: 全テストスイート
- **時間**: 毎日 02:00 JST
- **通知**: Slack/Email

### 7.2 コミット時実行
- **対象**: 変更に関連するテストのみ
- **所要時間**: 5分以内
- **ブロッキング**: 失敗時はマージを防止

### 7.3 リリース前実行
- **対象**: 全E2Eテスト + 回帰テスト
- **環境**: ステージング環境
- **承認**: テスト成功が必須

---

## 8. トラブルシューティング

### 8.1 よくある問題と対処法

| 問題 | 原因 | 対処法 |
|------|------|--------|
| テストがランダムに失敗 | 非同期処理の待機不足 | 適切なwait/awaitを追加 |
| テスト実行が遅い | 不要なsetup/teardown | beforeAll/afterAllを活用 |
| false positive | アサーションが不適切 | より具体的な検証を追加 |

### 8.2 デバッグ手法
```javascript
// デバッグモードでの実行
test('デバッグテスト', async ({ page }) => {
  // スクリーンショット取得
  await page.screenshot({ path: 'debug.png' });
  
  // ブラウザの一時停止
  await page.pause();
  
  // コンソールログ出力
  page.on('console', msg => console.log(msg.text()));
});
```

---

## 9. 成功指標（KPI）

- **テスト実行時間**: 全体で30分以内
- **テスト成功率**: 95%以上
- **バグ検出率**: リリース前に80%以上
- **テストメンテナンス時間**: 週2時間以内

---



## 付録: 参考リンク

- [WADA-T TDDブートキャンプ資料](https://github.com/twada/tdd-boot-camp)
- [Playwright Documentation](https://playwright.dev)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [テスト駆動開発（Kent Beck）](https://www.amazon.co.jp/dp/4274217884)

---

*このテスト計画書は継続的に更新され、プロジェクトの成長に合わせて改善されます。*