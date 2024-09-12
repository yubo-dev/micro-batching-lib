export enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface JobMeta<T> {
  job: T;
  jobId: string;
  resolve: Function;
  reject: Function;
}

export type JobStatusMap = Record<string, { status: JobStatus; result?: any }>;

export interface JobSubmissionResponse {
  jobId: string;
  message: string;
}

export interface PaymentTransaction {
  user_id: number;
  amount: number;
  status: string;
}
