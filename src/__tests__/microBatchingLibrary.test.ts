import { MicroBatchingLibrary } from "../microBatchingLibrary";
import { JobStatus } from "../interfaces";

describe("MicroBatchingLibrary", () => {
  let mockBatchProcessor: jest.Mock;
  let batchingLibrary: MicroBatchingLibrary<any>;
  const batchSize = 3;
  const batchFrequency = 10_000;
  const job1 = { task: "job 1" };
  const job2 = { task: "job 2" };
  const job3 = { task: "job 3" };

  beforeEach(() => {
    mockBatchProcessor = jest
      .fn()
      .mockResolvedValue(["result1", "result2", "result3"]);
    batchingLibrary = new MicroBatchingLibrary(
      mockBatchProcessor,
      batchSize,
      batchFrequency
    );
  });

  afterEach(async () => {
    await batchingLibrary.shutdown();
  });

  test("should submit a job and return jobId", () => {
    const job = { task: "some task" };
    const result = batchingLibrary.submitJob(job);

    expect(result).toHaveProperty("jobId");
    expect(result.message).toBe(
      "Job accepted and will be processed in the next batch."
    );
  });

  test("should skip processing if no jobs are in the queue", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await batchingLibrary["processBatch"]();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Batch processing skipped, no jobs in queue."
    );
    expect(mockBatchProcessor).not.toHaveBeenCalled(); // Ensure batchProcessor was not called

    consoleSpy.mockRestore();
  });

  test("should process batch successfully when jobs are in the queue", async () => {
    mockBatchProcessor.mockResolvedValue(["result1", "result2", "result3"]);

    batchingLibrary.submitJob(job1);
    batchingLibrary.submitJob(job2);
    batchingLibrary.submitJob(job3);

    await batchingLibrary["processBatch"]();

    expect(mockBatchProcessor).toHaveBeenCalledWith([job1, job2, job3]);

    const jobIds = Object.keys(batchingLibrary["jobStatusMap"]);
    jobIds.forEach((jobId, index) => {
      const status = batchingLibrary.getJobStatus(jobId);
      expect(status.status).toBe(JobStatus.COMPLETED);
      expect(status.result).toBe(`result${index + 1}`);
    });
  });

  test("should return job status", () => {
    const job = { task: "test" };
    const result = batchingLibrary.submitJob(job);

    const jobStatus = batchingLibrary.getJobStatus(result.jobId);
    expect(jobStatus.status).toBe(JobStatus.PENDING);
  });

  test("should throw error when shutting down and submitting job", async () => {
    await batchingLibrary.shutdown();

    expect(() => batchingLibrary.submitJob({ task: "job" })).toThrowError(
      "System is shutting down, cannot accept new jobs"
    );
  });

  test("should process remaining jobs and remove batching interval during shutdown", async () => {
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    batchingLibrary.submitJob({ task: "remaining job" });

    await batchingLibrary.shutdown();
    expect(batchingLibrary["jobQueue"].length).toBe(0);
    expect(clearIntervalSpy).toHaveBeenCalledWith(batchingLibrary["timer"]);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Shutdown complete. All jobs processed."
    );

    clearIntervalSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
