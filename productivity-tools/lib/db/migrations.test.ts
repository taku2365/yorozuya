import { describe, it, expect, beforeEach, vi } from "vitest";
import { runMigrations, getMigrationVersion } from "./migrations";
import { Database } from "./database";

// Mock database for testing
const mockDb = {
  exec: vi.fn(),
  execute: vi.fn(),
};

vi.mock("./database", () => ({
  Database: vi.fn().mockImplementation(() => mockDb),
}));

describe("Migrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.execute.mockResolvedValue([]);
  });

  it("should create migration table if not exists", async () => {
    await runMigrations(mockDb as any);
    
    expect(mockDb.exec).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS migrations")
    );
  });

  it("should get current migration version", async () => {
    mockDb.execute.mockResolvedValueOnce([{ version: 3 }]);
    
    const version = await getMigrationVersion(mockDb as any);
    
    expect(version).toBe(3);
    expect(mockDb.execute).toHaveBeenCalledWith(
      "SELECT MAX(version) as version FROM migrations"
    );
  });

  it("should return 0 if no migrations exist", async () => {
    mockDb.execute.mockResolvedValueOnce([{ version: null }]);
    
    const version = await getMigrationVersion(mockDb as any);
    
    expect(version).toBe(0);
  });
});