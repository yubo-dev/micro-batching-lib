import pgPromise from "pg-promise";
import { PaymentTransaction } from "./interfaces";

const pgp = pgPromise();

export class BatchProcessor {
  constructor(private db: pgPromise.IDatabase<any>) {}

  async process(jobs: PaymentTransaction[]) {
    const insertQueries = jobs.map((job) => ({
      query: `
        INSERT INTO payment_transactions (user_id, amount, status) 
        VALUES ($1, $2, $3) 
        RETURNING *
      `,
      values: [job.user_id, job.amount, job.status],
    }));

    const results = await this.db.tx((t) =>
      t.batch(insertQueries.map((q) => t.one(q.query, q.values)))
    );
    return results;
  }
}
