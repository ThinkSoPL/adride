// Mock expo-sqlite v14 (Expo SDK 51) — in-memory store dla testów
interface MockRow {
  [key: string]: unknown;
}

const store: MockRow[] = [];

const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockImplementation(async (sql: string, ...params: unknown[]) => {
    // Symuluje INSERT
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      store.push({ id: store.length + 1 });
    }
    return { lastInsertRowId: store.length, changes: 1 };
  }),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue({ count: 0 }),
  withTransactionAsync: jest.fn().mockImplementation(async (fn: () => Promise<void>) => fn()),
  closeAsync: jest.fn().mockResolvedValue(undefined),
};

export const openDatabaseAsync = jest.fn().mockResolvedValue(mockDb);
export { mockDb as __mockDb };
