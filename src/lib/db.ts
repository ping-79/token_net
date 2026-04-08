import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "token_net.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS token_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id TEXT NOT NULL,
      used REAL,
      total REAL,
      unit TEXT,
      reset_at TEXT,
      screenshot_path TEXT,
      raw_response TEXT,
      collected_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS openclaw_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instance_id TEXT NOT NULL,
      instance_url TEXT NOT NULL,
      is_online INTEGER NOT NULL DEFAULT 0,
      response_ms INTEGER,
      checked_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_sub_time
      ON token_snapshots(subscription_id, collected_at DESC);

    CREATE INDEX IF NOT EXISTS idx_openclaw_inst_time
      ON openclaw_status(instance_id, checked_at DESC);
  `);
}

export function getLatestSnapshots(): Record<string, unknown> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT ts.* FROM token_snapshots ts
       INNER JOIN (
         SELECT subscription_id, MAX(collected_at) as max_time
         FROM token_snapshots
         GROUP BY subscription_id
       ) latest ON ts.subscription_id = latest.subscription_id
         AND ts.collected_at = latest.max_time`
    )
    .all() as Array<Record<string, unknown>>;

  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.subscription_id as string] = row;
  }
  return result;
}

export function getLatestOpenClawStatuses(): Array<Record<string, unknown>> {
  const db = getDb();
  return db
    .prepare(
      `SELECT oc.* FROM openclaw_status oc
       INNER JOIN (
         SELECT instance_id, MAX(checked_at) as max_time
         FROM openclaw_status
         GROUP BY instance_id
       ) latest ON oc.instance_id = latest.instance_id
         AND oc.checked_at = latest.max_time`
    )
    .all() as Array<Record<string, unknown>>;
}

export function getHistoryData(days: number = 7): Array<Record<string, unknown>> {
  const db = getDb();
  return db
    .prepare(
      `SELECT subscription_id, used, total, unit, collected_at
       FROM token_snapshots
       WHERE collected_at >= datetime('now', ?)
       ORDER BY collected_at ASC`
    )
    .all(`-${days} days`) as Array<Record<string, unknown>>;
}

export function insertTokenSnapshot(data: {
  subscription_id: string;
  used: number | null;
  total: number | null;
  unit: string | null;
  reset_at: string | null;
  screenshot_path: string | null;
  raw_response: string | null;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO token_snapshots (subscription_id, used, total, unit, reset_at, screenshot_path, raw_response)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    data.subscription_id,
    data.used,
    data.total,
    data.unit,
    data.reset_at,
    data.screenshot_path,
    data.raw_response
  );
}

export function insertOpenClawStatus(data: {
  instance_id: string;
  instance_url: string;
  is_online: boolean;
  response_ms: number | null;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO openclaw_status (instance_id, instance_url, is_online, response_ms)
     VALUES (?, ?, ?, ?)`
  ).run(data.instance_id, data.instance_url, data.is_online ? 1 : 0, data.response_ms);
}
