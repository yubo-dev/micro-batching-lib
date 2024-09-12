import { BatchProcessor } from "../batchProcessor";
import { IDatabase } from "pg-promise";
import { PaymentTransaction } from "../interfaces";

describe("BatchProcessor", () => {
  let mockDb: IDatabase<any>;
  let batchProcessor: BatchProcessor;

  beforeEach(() => {
    mockDb = {
      tx: jest.fn((cb) =>
        cb({
          one: jest.fn().mockResolvedValue({ id: "fakeId" }),
          batch: jest.fn((queries) =>
            Promise.resolve(queries.map(() => ({ id: "fakeId" })))
          ),
        })
      ),
    } as unknown as IDatabase<any>;
    batchProcessor = new BatchProcessor(mockDb);
  });

  test("should process batch and insert transactions into the database", async () => {
    const jobs = [
      { user_id: 123, amount: 100, status: "pending" },
      { user_id: 123, amount: 200, status: "pending" },
    ] as PaymentTransaction[];

    const results = await batchProcessor.process(jobs);

    expect(mockDb.tx).toHaveBeenCalled();
    expect(results.length).toBe(2);
    expect(results[0]).toEqual({ id: "fakeId" });
  });
});
