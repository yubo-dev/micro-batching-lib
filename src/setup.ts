import pgPromise from "pg-promise";
import { MicroBatchingLibrary } from "./microBatchingLibrary";
import { BatchProcessor } from "./batchProcessor";

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  BATCH_SIZE,
  BATCH_FREQUENCY,
} = process.env;

const pgp = pgPromise();
const db = pgp({
  host: DB_HOST || "db",
  port: parseInt(DB_PORT || "5432", 10),
  database: DB_NAME || "db",
  user: DB_USER || "user",
  password: DB_PASSWORD || "password",
});

const batchSize = parseInt(BATCH_SIZE || "3", 10);
const batchFrequency = parseInt(BATCH_FREQUENCY || "10000", 10);

const batchProcessor = new BatchProcessor(db);

export const batchingLibrary = new MicroBatchingLibrary(
  batchProcessor.process.bind(batchProcessor),
  batchSize,
  batchFrequency
);
