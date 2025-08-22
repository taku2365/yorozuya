import { Database } from "./database";

let instance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!instance) {
    instance = new Database();
    await instance.initialize();
  }
  return instance;
}