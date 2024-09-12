import { randomUUID } from "crypto";
import {
  JobStatus,
  JobMeta,
  JobStatusMap,
  JobSubmissionResponse,
} from "./interfaces";

export class MicroBatchingLibrary<T> {
  private jobQueue: JobMeta<T>[] = [];
  private jobStatusMap: JobStatusMap = {};
  private timer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor(
    private batchProcessor: (jobs: T[]) => Promise<any[]>,
    private batchSize: number,
    private batchFrequency: number // Fixed frequency in milliseconds for batch processing
  ) {
    this.scheduleBatchProcessing();
  }

  public submitJob(job: T): JobSubmissionResponse {
    if (this.isShuttingDown) {
      throw new Error("System is shutting down, cannot accept new jobs");
    }

    const jobId = this.generateJobId();

    this.jobQueue.push({ job, jobId } as JobMeta<T>);
    this.jobStatusMap[jobId] = { status: JobStatus.PENDING };

    console.log(`Submitted 1 job. jobId: ${jobId}`);

    if (this.jobQueue.length >= this.batchSize) {
      this.processBatch();
    }

    return {
      jobId,
      message: "Job accepted and will be processed in the next batch.",
    } as JobSubmissionResponse;
  }

  // Start the interval-based processing
  private scheduleBatchProcessing() {
    this.timer = setInterval(() => {
      this.processBatch();
    }, this.batchFrequency);
  }

  // Process jobs in the queue as a batch
  private async processBatch() {
    if (this.jobQueue.length === 0) {
      console.log("Batch processing skipped, no jobs in queue.");
      return;
    }

    console.log(
      `Batch processing started. Jobs in queue: ${this.jobQueue.length}`
    );

    // Get the jobs to process up to the batch size
    const jobsToProcess = this.jobQueue.splice(0, this.batchSize);

    jobsToProcess.forEach((item) => {
      this.jobStatusMap[item.jobId].status = JobStatus.PROCESSING;
    });

    try {
      const results = await this.batchProcessor(
        jobsToProcess.map((item) => item.job)
      );

      jobsToProcess.forEach((item, index) => {
        this.jobStatusMap[item.jobId] = {
          status: JobStatus.COMPLETED,
          result: results[index],
        };
      });
      console.log(
        `Batch processing completed. ${jobsToProcess.length} jobs processed.`
      );
    } catch (err) {
      console.error(`Failed to process the batch`, err);
      jobsToProcess.forEach((item) => {
        this.jobStatusMap[item.jobId] = {
          status: JobStatus.FAILED,
          result: (err as Error).message,
        };
      });
    }
  }

  public getJobStatus(jobId: string): {
    jobId: string;
    status: string;
    result?: any;
  } {
    const jobData = this.jobStatusMap[jobId];
    if (!jobData) {
      throw new Error(`Job with ID ${jobId} not found.`);
    }
    return { jobId, status: jobData.status, result: jobData.result };
  }

  private generateJobId(): string {
    return randomUUID();
  }

  public async shutdown() {
    this.isShuttingDown = true;

    if (this.timer) {
      clearInterval(this.timer);
    }

    if (this.jobQueue.length > 0) {
      console.log(
        `Shutting down. Processing remaining ${this.jobQueue.length} jobs`
      );
      await this.processBatch(); // Process all remaining jobs before shutting down
    }

    if (this.jobQueue.length === 0) {
      console.log("Shutdown complete. All jobs processed.");
    }
  }
}
