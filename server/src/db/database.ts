import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { SCHEMA_SQL } from './schema.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'study_companion.db');

export class AppDatabase {
  private static instance: DatabaseSync | null = null;

  public static getDB(): DatabaseSync {
    if (!this.instance) {
      this.instance = new DatabaseSync(DB_PATH);
      // Enable foreign keys and WAL mode for high concurrency
      this.instance.exec('PRAGMA foreign_keys = ON;');
      this.instance.exec('PRAGMA journal_mode = WAL;');
      this.instance.exec(SCHEMA_SQL);
      console.log(`[Database] Initialized SQLite at ${DB_PATH}`);
    }
    return this.instance;
  }

  public static query<T = any>(sql: string, params: any[] = []): T[] {
    const db = this.getDB();
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  public static get<T = any>(sql: string, params: any[] = []): T | undefined {
    const db = this.getDB();
    const stmt = db.prepare(sql);
    return (stmt.get(...params) as T) || undefined;
  }

  public static run(sql: string, params: any[] = []): { changes: number | bigint; lastInsertRowid: number | bigint } {
    const db = this.getDB();
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  }

  public static transaction<T>(callback: () => T): T {
    const db = this.getDB();
    db.exec('BEGIN TRANSACTION;');
    try {
      const result = callback();
      db.exec('COMMIT;');
      return result;
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }
  }
}
