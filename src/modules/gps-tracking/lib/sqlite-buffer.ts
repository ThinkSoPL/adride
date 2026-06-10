/**
 * SQLite Offline Buffer
 * Stores GPS points locally when offline, uploads when online
 */

import * as SQLite from 'expo-sqlite';
import { GpsPoint } from '../types';

const DB_NAME = 'adride_gps.db';
const TABLE_NAME = 'gps_points_buffer';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDb(): Promise<void> {
  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy REAL,
        battery_percent INTEGER,
        speed_kmph REAL,
        heading_deg REAL,
        timestamp_ms INTEGER NOT NULL,
        uploaded INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_session_id ON ${TABLE_NAME}(session_id);
      CREATE INDEX IF NOT EXISTS idx_uploaded ON ${TABLE_NAME}(uploaded);
    `);
  } catch (error) {
    console.error('[sqlite] Failed to initialize database:', error);
    throw error;
  }
}

export async function insertPoint(
  sessionId: string,
  point: GpsPoint,
): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  try {
    const id = `${sessionId}_${Date.now()}_${Math.random()}`;
    await db.runAsync(
      `INSERT INTO ${TABLE_NAME} (
        id, session_id, latitude, longitude, accuracy,
        battery_percent, speed_kmph, heading_deg, timestamp_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        sessionId,
        point.latitude,
        point.longitude,
        point.accuracy,
        point.batteryPercent,
        point.speedKmph,
        point.headingDeg,
        point.timestamp,
      ],
    );
  } catch (error) {
    console.error('[sqlite] Failed to insert point:', error);
    // Don't throw - continue tracking even if buffer fails
  }
}

export async function getBufferedPoints(sessionId: string): Promise<GpsPoint[]> {
  if (!db) throw new Error('Database not initialized');

  try {
    const rows = await db.getAllAsync(
      `SELECT * FROM ${TABLE_NAME} WHERE session_id = ? AND uploaded = 0 ORDER BY timestamp_ms ASC`,
      [sessionId],
    );

    return rows.map((row: any) => ({
      latitude: row.latitude,
      longitude: row.longitude,
      accuracy: row.accuracy,
      batteryPercent: row.battery_percent,
      speedKmph: row.speed_kmph,
      headingDeg: row.heading_deg,
      timestamp: row.timestamp_ms,
    }));
  } catch (error) {
    console.error('[sqlite] Failed to get buffered points:', error);
    return [];
  }
}

export async function deletePoints(
  sessionId: string,
  pointIds: string[],
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  if (pointIds.length === 0) return;

  try {
    const placeholders = pointIds.map(() => '?').join(',');
    await db.runAsync(
      `DELETE FROM ${TABLE_NAME} WHERE session_id = ? AND id IN (${placeholders})`,
      [sessionId, ...pointIds],
    );
  } catch (error) {
    console.error('[sqlite] Failed to delete points:', error);
    // Don't throw - continue operation even if cleanup fails
  }
}

export async function markPointsAsUploaded(
  sessionId: string,
  pointIds: string[],
): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  if (pointIds.length === 0) return;

  try {
    const placeholders = pointIds.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE ${TABLE_NAME} SET uploaded = 1 WHERE session_id = ? AND id IN (${placeholders})`,
      [sessionId, ...pointIds],
    );
  } catch (error) {
    console.error('[sqlite] Failed to mark points as uploaded:', error);
  }
}

export async function clearSessionBuffer(sessionId: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  try {
    await db.runAsync(
      `DELETE FROM ${TABLE_NAME} WHERE session_id = ?`,
      [sessionId],
    );
  } catch (error) {
    console.error('[sqlite] Failed to clear session buffer:', error);
  }
}
