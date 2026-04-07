// ============================================
// THE WATCHER — SQLite Database
// ============================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', 'data', 'watcher.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists before opening SQLite
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    -- Events table — all CanonicalEvents
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      token TEXT NOT NULL,
      chain TEXT NOT NULL,
      type TEXT NOT NULL,
      from_address TEXT,
      to_address TEXT,
      amount REAL NOT NULL,
      amount_usd REAL NOT NULL,
      from_entity TEXT DEFAULT 'Unknown',
      to_entity TEXT DEFAULT 'Unknown',
      from_entity_type TEXT DEFAULT 'Unknown',
      to_entity_type TEXT DEFAULT 'Unknown',
      source TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      relevance TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_token ON events(token);
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_events_relevance ON events(relevance);
    CREATE INDEX IF NOT EXISTS idx_events_token_timestamp ON events(token, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

    -- Signal history
    CREATE TABLE IF NOT EXISTS signal_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      score INTEGER NOT NULL,
      label TEXT NOT NULL,
      usdc_subscore INTEGER,
      usdt_subscore INTEGER,
      whale_subscore INTEGER,
      divergence_subscore INTEGER,
      sentiment_subscore INTEGER,
      divergence_note TEXT,
      headline TEXT,
      decision_context TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_signal_timestamp ON signal_history(timestamp DESC);

    -- Pattern flags
    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      pattern TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      active INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_patterns_active ON patterns(active, timestamp DESC);

    -- Snapshots (for fallback when APIs are down)
    CREATE TABLE IF NOT EXISTS snapshots (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Supply tracking
    CREATE TABLE IF NOT EXISTS supply (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      token TEXT NOT NULL,
      chain TEXT NOT NULL,
      total_supply REAL NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_supply_token ON supply(token, timestamp DESC);

    -- News cache
    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      source TEXT,
      title TEXT NOT NULL,
      url TEXT,
      sentiment TEXT,
      relevant_tokens TEXT,
      score REAL
    );

    CREATE INDEX IF NOT EXISTS idx_news_timestamp ON news(timestamp DESC);

    -- Analyst cache
    CREATE TABLE IF NOT EXISTS analyst_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      narrative TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `);

  console.log('[DB] Schema initialized successfully');
}

// ---- Event queries ----

export function insertEvent(event: import('./types').CanonicalEvent): boolean {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(event.id);
  if (existing) return false; // Duplicate — skip

  db.prepare(`
    INSERT INTO events (id, timestamp, token, chain, type, from_address, to_address,
      amount, amount_usd, from_entity, to_entity, from_entity_type, to_entity_type,
      source, tx_hash, relevance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.id, event.timestamp, event.token, event.chain, event.type,
    event.from, event.to, event.amount, event.amountUsd,
    event.fromEntity, event.toEntity, event.fromEntityType, event.toEntityType,
    event.source, event.txHash, event.relevance
  );
  return true;
}

export function insertEvents(events: import('./types').CanonicalEvent[]): number {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO events (id, timestamp, token, chain, type, from_address, to_address,
      amount, amount_usd, from_entity, to_entity, from_entity_type, to_entity_type,
      source, tx_hash, relevance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  const tx = db.transaction((events: import('./types').CanonicalEvent[]) => {
    for (const e of events) {
      const result = insert.run(
        e.id, e.timestamp, e.token, e.chain, e.type,
        e.from, e.to, e.amount, e.amountUsd,
        e.fromEntity, e.toEntity, e.fromEntityType, e.toEntityType,
        e.source, e.txHash, e.relevance
      );
      if (result.changes > 0) inserted++;
    }
  });

  tx(events);
  return inserted;
}

export function getEvents(
  token: string,
  options: { limit?: number; minRelevance?: string; since?: string } = {}
): any[] {
  const db = getDb();
  const { limit = 50, minRelevance = 'medium', since } = options;

  const relevanceOrder = ['critical', 'high', 'medium', 'low'];
  const minIdx = relevanceOrder.indexOf(minRelevance);
  const allowedRelevances = relevanceOrder.slice(0, minIdx + 1);
  const placeholders = allowedRelevances.map(() => '?').join(',');

  let query = `
    SELECT * FROM events
    WHERE token = ? AND relevance IN (${placeholders})
  `;
  const params: any[] = [token, ...allowedRelevances];

  if (since) {
    query += ' AND timestamp >= ?';
    params.push(since);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  return db.prepare(query).all(...params);
}

export function getEventStats(token: string, hours: number = 24): {
  mints: number; burns: number; totalVolume: number; eventCount: number;
} {
  const db = getDb();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const result = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'MINT' THEN amount ELSE 0 END), 0) as mints,
      COALESCE(SUM(CASE WHEN type = 'BURN' THEN amount ELSE 0 END), 0) as burns,
      COALESCE(SUM(amount), 0) as totalVolume,
      COUNT(*) as eventCount
    FROM events
    WHERE token = ? AND timestamp >= ?
  `).get(token, since) as any;

  return {
    mints: result.mints,
    burns: result.burns,
    totalVolume: result.totalVolume,
    eventCount: result.eventCount,
  };
}

export function getTopFlows(
  token: string,
  direction: 'in' | 'out',
  limit: number = 10,
  hours: number = 24
): any[] {
  const db = getDb();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  // "in" = transfers TO entities (inflows to exchanges/institutions)
  // "out" = transfers FROM entities (outflows from exchanges/institutions)
  const entityField = direction === 'in' ? 'to_entity' : 'from_entity';
  const entityTypeField = direction === 'in' ? 'to_entity_type' : 'from_entity_type';

  return db.prepare(`
    SELECT
      ${entityField} as entity,
      ${entityTypeField} as entityType,
      SUM(amount) as totalAmount,
      COUNT(*) as eventCount,
      MAX(timestamp) as lastSeen
    FROM events
    WHERE token = ? AND timestamp >= ?
      AND ${entityField} != 'Unknown'
      AND type = 'TRANSFER'
    GROUP BY ${entityField}
    ORDER BY totalAmount DESC
    LIMIT ?
  `).all(token, since, limit);
}

// ---- Snapshot queries ----

export function saveSnapshot(key: string, data: any): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO snapshots (key, data, updated_at)
    VALUES (?, ?, datetime('now'))
  `).run(key, JSON.stringify(data));
}

export function getSnapshot(key: string): { data: any; updatedAt: string } | null {
  const db = getDb();
  const row = db.prepare('SELECT data, updated_at FROM snapshots WHERE key = ?').get(key) as any;
  if (!row) return null;
  return { data: JSON.parse(row.data), updatedAt: row.updated_at };
}

// ---- Signal queries ----

export function insertSignal(signal: {
  score: number; label: string; subscores: import('./types').SignalSubscores;
  divergenceNote: string; headline: string; decisionContext: string[];
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO signal_history (timestamp, score, label,
      usdc_subscore, usdt_subscore, whale_subscore, divergence_subscore, sentiment_subscore,
      divergence_note, headline, decision_context)
    VALUES (datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    signal.score, signal.label,
    signal.subscores.usdc, signal.subscores.usdt,
    signal.subscores.whales, signal.subscores.divergence, signal.subscores.sentiment,
    signal.divergenceNote, signal.headline, JSON.stringify(signal.decisionContext)
  );
}

export function getSignalHistory(days: number = 30): any[] {
  const db = getDb();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return db.prepare(`
    SELECT * FROM signal_history
    WHERE timestamp >= ?
    ORDER BY timestamp DESC
  `).all(since);
}

// ---- Pattern queries ----

export function upsertPattern(pattern: import('./types').PatternFlag): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO patterns (id, timestamp, pattern, severity, message, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(pattern.id, pattern.timestamp, pattern.pattern, pattern.severity, pattern.message, pattern.active ? 1 : 0);
}

export function getActivePatterns(): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM patterns WHERE active = 1 ORDER BY timestamp DESC LIMIT 20
  `).all();
}

export function deactivateOldPatterns(hoursOld: number = 6): void {
  const db = getDb();
  const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();
  db.prepare('UPDATE patterns SET active = 0 WHERE timestamp < ? AND active = 1').run(cutoff);
}

// ---- News queries ----

export function insertNews(item: import('./types').NewsItem): boolean {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM news WHERE id = ?').get(item.id);
  if (existing) return false;

  db.prepare(`
    INSERT INTO news (id, timestamp, source, title, url, sentiment, relevant_tokens, score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(item.id, item.timestamp, item.source, item.title, item.url,
    item.sentiment, JSON.stringify(item.relevantTokens), item.score);
  return true;
}

export function getRecentNews(limit: number = 20): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM news ORDER BY timestamp DESC LIMIT ?').all(limit);
}

// ---- Chart data queries ----

export function getDailyMintBurn(token: string, days: number = 7): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      date(timestamp) as day,
      COALESCE(SUM(CASE WHEN type = 'MINT' THEN amount_usd ELSE 0 END), 0) as mint,
      COALESCE(SUM(CASE WHEN type = 'BURN' THEN amount_usd ELSE 0 END), 0) as burn
    FROM events
    WHERE token = ? AND timestamp >= date('now', '-' || ? || ' days')
    GROUP BY date(timestamp)
    ORDER BY day ASC
  `).all(token, days);
}
