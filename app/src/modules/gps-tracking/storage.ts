// =============================================================================
// AdRide GPS Tracking — lokalny bufor SQLite (offline-first)
// expo-sqlite v14 (Expo SDK 51) — async API
// =============================================================================

import * as SQLite from 'expo-sqlite';
import { BATCH_SIZE, VACUUM_AFTER_DAYS } from './config';
import type { GpsPoint, StoredPoint } from './types';

const DB_NAME = 'adride_buffer.db';

/** Wiersz zwracany przez getAllAsync dla tabeli gps_buffer */
interface RawBufferRow {
  id: number;
  session_id: string;
  lat: number;
  lng: number;
  speed_kmh: number | null;
  accuracy_m: number | null;
  heading: number | null;
  battery_level: number | null;
  recorded_at: number;
  uploaded: 0 | 1;
}

/** Mapuje wiersz SQLite → StoredPoint */
function rowToPoint(row: RawBufferRow): StoredPoint {
  return {
    id: row.id,
    sessionId: row.session_id,
    lat: row.lat,
    lng: row.lng,
    speedKmh: row.speed_kmh,
    accuracyM: row.accuracy_m,
    heading: row.heading,
    batteryLevel: row.battery_level,
    recordedAt: row.recorded_at,
    uploaded: row.uploaded,
  };
}

// =============================================================================
// GpsBuffer — singleton zarządzający lokalną bazą danych
// =============================================================================

class GpsBuffer {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /** Leniwa inicjalizacja — otwiera i migruje bazę przy pierwszym użyciu */
  private async ensureDb(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) return this.db;

    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    await this.initPromise;
    return this.db!;
  }

  private async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync(DB_NAME);

    // Schemat tabeli buffera GPS — pojedyncze execAsync dla transakcji
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;

      CREATE TABLE IF NOT EXISTS gps_buffer (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id   TEXT    NOT NULL,
        lat          REAL    NOT NULL,
        lng          REAL    NOT NULL,
        speed_kmh    REAL,
        accuracy_m   REAL,
        heading      REAL,
        battery_level REAL,
        recorded_at  INTEGER NOT NULL,
        uploaded     INTEGER NOT NULL DEFAULT 0,
        created_at   INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
      );

      CREATE INDEX IF NOT EXISTS idx_buf_upload
        ON gps_buffer (uploaded, session_id);

      CREATE INDEX IF NOT EXISTS idx_buf_session
        ON gps_buffer (session_id, recorded_at);
    `);
  }

  // ─── Zapis ────────────────────────────────────────────────────────────────

  /**
   * Zapisuje pojedynczy punkt GPS do lokalnego buffera.
   * Wywoływane z background task — przed jakimkolwiek uplodem.
   */
  async savePoint(point: GpsPoint): Promise<void> {
    const db = await this.ensureDb();
    await db.runAsync(
      `INSERT INTO gps_buffer
         (session_id, lat, lng, speed_kmh, accuracy_m, heading, battery_level, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      point.sessionId,
      point.lat,
      point.lng,
      point.speedKmh ?? null,
      point.accuracyM ?? null,
      point.heading ?? null,
      point.batteryLevel ?? null,
      point.recordedAt,
    );
  }

  /**
   * Zapisuje wiele punktów w jednej transakcji SQLite.
   * Wydajniejsze niż wielokrotne savePoint() przy odbiorze batcha z location task.
   */
  async savePoints(points: GpsPoint[]): Promise<void> {
    if (points.length === 0) return;
    const db = await this.ensureDb();

    await db.withTransactionAsync(async () => {
      for (const point of points) {
        await db.runAsync(
          `INSERT INTO gps_buffer
             (session_id, lat, lng, speed_kmh, accuracy_m, heading, battery_level, recorded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          point.sessionId,
          point.lat,
          point.lng,
          point.speedKmh ?? null,
          point.accuracyM ?? null,
          point.heading ?? null,
          point.batteryLevel ?? null,
          point.recordedAt,
        );
      }
    });
  }

  // ─── Odczyt ───────────────────────────────────────────────────────────────

  /** Zwraca do batchSize nieprzesłanych punktów (ORDER BY recorded_at ASC) */
  async getUnuploadedBatch(batchSize: number = BATCH_SIZE): Promise<StoredPoint[]> {
    const db = await this.ensureDb();
    const rows = await db.getAllAsync<RawBufferRow>(
      `SELECT * FROM gps_buffer
       WHERE uploaded = 0
       ORDER BY recorded_at ASC
       LIMIT ?`,
      batchSize,
    );
    return rows.map(rowToPoint);
  }

  /** Liczba nieprzesłanych punktów — do paska postępu i logiki uploadu */
  async getPendingCount(): Promise<number> {
    const db = await this.ensureDb();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM gps_buffer WHERE uploaded = 0',
    );
    return row?.count ?? 0;
  }

  /** Suma km nieprzesłanych punktów danej sesji (przybliżenie przez prędkość * czas) */
  async getSessionPointCount(sessionId: string): Promise<number> {
    const db = await this.ensureDb();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM gps_buffer WHERE session_id = ?',
      sessionId,
    );
    return row?.count ?? 0;
  }

  // ─── Oznaczanie jako przesłane ────────────────────────────────────────────

  /** Flaguje punkty jako przesłane po pomyślnym uploadzie do Supabase */
  async markUploaded(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await this.ensureDb();
    // Bezpieczny IN — budujemy placeholders ręcznie
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE gps_buffer SET uploaded = 1 WHERE id IN (${placeholders})`,
      ...ids,
    );
  }

  // ─── Sprzątanie ───────────────────────────────────────────────────────────

  /**
   * Usuwa przesłane punkty starsze niż daysOld dni.
   * Wywoływane po każdym udanym uplodie lub na starcie sesji.
   */
  async vacuum(daysOld: number = VACUUM_AFTER_DAYS): Promise<number> {
    const db = await this.ensureDb();
    const cutoffMs = Date.now() - daysOld * 24 * 60 * 60 * 1_000;
    const result = await db.runAsync(
      'DELETE FROM gps_buffer WHERE uploaded = 1 AND recorded_at < ?',
      cutoffMs,
    );
    return result.changes;
  }

  /** Usuwa WSZYSTKIE dane danej sesji (np. przy cofnięciu GDPR) */
  async deleteSession(sessionId: string): Promise<void> {
    const db = await this.ensureDb();
    await db.runAsync('DELETE FROM gps_buffer WHERE session_id = ?', sessionId);
  }

  /** Zamknij połączenie — wywołaj przy unmount (testy) */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initPromise = null;
    }
  }
}

/** Singleton instancja — współdzielona przez tracking-service i background task */
export const gpsBuffer = new GpsBuffer();
