import { Database } from "./database";

let instance: Database | null = null;
let initializationPromise: Promise<Database> | null = null;

export async function getDatabase(): Promise<Database> {
  if (!instance) {
    if (!initializationPromise) {
      initializationPromise = (async () => {
        const db = new Database();
        await db.initialize();
        instance = db;
        return db;
      })();
    }
    return initializationPromise;
  }
  return instance;
}