/**
 * SQLite WASM 型定義
 * 
 * @sqlite.org/sqlite-wasm パッケージの型定義が不完全なため、
 * 必要な型を独自に定義しています。
 * 
 * 参考: https://sqlite.org/wasm/doc/trunk/api-oo1.md
 */

/** SQLiteに渡せる/取得できる値の型 */
export type SqlValue = string | number | null | bigint | Uint8Array | Int8Array | ArrayBuffer;

/** SQLiteにバインドできる値の型 */
export type BindableValue = SqlValue | undefined | boolean;

/** バインドパラメータの型 */
export type BindingSpec = readonly BindableValue[] | { [paramName: string]: BindableValue } | BindableValue;

/** exec()メソッドのオプション */
export interface ExecOptions {
  sql: string;
  bind?: BindingSpec;
  returnValue?: "this" | "resultRows" | "saveSql";
  rowMode?: "array" | "object" | "stmt";
  callback?: (row: any) => void;
}

/** SQLite WASMのデータベースクラス */
export interface SQLiteDatabase {
  exec(sql: string): void;
  exec(options: ExecOptions): any;
  close(): void;
  prepare(sql: string): any; // PreparedStatement
}

/** SQLite WASMのOO1 API */
export interface SQLiteOO1 {
  DB: new (filename?: string, flags?: string) => SQLiteDatabase;
}

/** SQLite WASMのメインモジュール */
export interface SQLite3Module {
  oo1: SQLiteOO1;
}

/** sqlite3InitModule の設定 */
export interface SQLite3Config {
  print?: (msg: string) => void;
  printErr?: (msg: string) => void;
}

/** sqlite3InitModule 関数の型 */
export type SQLite3InitModule = (config?: SQLite3Config) => Promise<SQLite3Module>;