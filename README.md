# Micro-Batching Library

## Overview

Micro-batching is a technique used in processing pipelines where individual tasks are grouped together into small batches. This can improve throughput by reducing the number of requests made to a downstream system. This library allows you to submit jobs, process them in configurable batch sizes and frequencies, and monitor their status through a simple API. It also provides a graceful shutdown process that ensures all jobs are processed before terminating.

<br>

## Features

- **Batch Processing**: The library processes jobs in batches to optimize performance and reduce overhead.
- **Configurable Batch Size & Frequency**: You can configure how many jobs should be processed in a batch and how frequently the batches should run via environment variables.
- **Job Status Tracking**: Each job has a unique ID, and the status of jobs (pending, processing, completed, or failed) can be tracked.
- **Graceful Shutdown**: The shutdown method ensures that all pending jobs are processed before the system shuts down.
- **PostgreSQL Integration**: The batch processing logic is integrated with a PostgreSQL database, making it ideal for scenarios involving large-scale data storage.

<br>

## Batch Processor

The micro-batching library uses **pg-promise**, a PostgreSQL client, for efficient batch database operations. This is ideal for handling a large number of inserts, updates, or deletes in one go, reducing overhead and improving performance.

### Why pg-promise?
- **Batching**: Allows batching multiple SQL queries into a single transaction, reducing round trips.
- **Error Handling**: Provides atomic execution, rolling back all queries in case of failure.
- **Performance**: Improves throughput by processing many database operations at once.

### Example

The batch processor uses `pg-promise` to batch insert transactions into the `payment_transactions` table:

```typescript
import pgPromise from "pg-promise";
import { PaymentTransaction } from "./interfaces";

export class BatchProcessor {
  constructor(private db: pgPromise.IDatabase<any>) {}

  async process(jobs: PaymentTransaction[]) {
    const queries = jobs.map((job) => ({
      query: `
        INSERT INTO payment_transactions (user_id, amount, status) 
        VALUES ($1, $2, $3) 
        RETURNING *
      `,
      values: [job.user_id, job.amount, job.status],
    }));

    return await this.db.tx((t) =>
      t.batch(queries.map((q) => t.one(q.query, q.values)))
    );
  }
}
```
The processor batches SQL inserts into a single transaction, improving efficiency and maintaining data integrity.

<br>

## Getting Started

This section describes how to set up and run the project locally using Docker. Make sure you have Docker and Docker Compose installed on your machine.

### Setup and Run
1. Clone the repository to your local machine:
```
git clone https://github.com/yubo-dev/micro-batching-lib.git
cd micro-batching-lib
```
2. Build and start the containers in root folder:
```
npm run docker:build
```
3. Access the application:
  - **Server**: The server will be available at http://localhost:3000.
  - **pgAdmin**: You can manage the PostgreSQL database by navigating to http://localhost:8080 in your browser. Use the credentials defined in the `.env` file to log in.
4. API Endpoints:
  - Submit a Job: `POST /submit-job`
  - Check Job Status: `GET /job-status/:jobId`
  - Shutdown: `POST /shutdown`

### Test
1. This project uses Jest as the test framework. To run tests, ensure you have all the required dependencies installed locally.
```
npm install
```
2. Execute the following command:
```
npm run test
```

<br>

## Job Processing Flow

This section outlines the flow of submitting a job, receiving confirmation with an ID, waiting for the job to be processed in the next batch, checking the job status, and performing a graceful shutdown.

### Step 1: Submit a Job

- **Endpoint**: `POST /submit-job`
- **Description**: When a job is submitted, the API responds with a `jobId` and a confirmation message indicating that the job has been accepted and will be processed in the next batch.

**Request**:

```bash
curl -X POST http://localhost:3000/submit-job \
-H "Content-Type: application/json" \
-d '{"user_id": 1, "amount": 100.00, "status": "pending"}'
```

**Response**:

```json
{
  "jobId": "abc123",
  "message": "Job accepted and will be processed in the next batch."
}
```

### Step 2: Wait for the Job to be Processed in the Next Batch

Once the job is submitted, it will wait in the job queue until the next batch is processed. The batching system processes jobs either when the batch size is reached or when the batch frequency time elapses (whichever comes first).

### Step 3: Check the Job Status

- **Endpoint**: `GET /job-status/:jobId`
- **Description**: After the job is processed in the next batch, you can check the status of the job using the `jobId`. The status will show if the job is `pending`, `processing`, `completed`, or `failed`, along with the result (if available).

**Request**:

```bash
curl http://localhost:3000/job-status/abc123
```

**Response (after processing)**:

```json
{
  "jobId": "abc123",
  "status": "completed",
  "result": {
    "user_id": 1,
    "amount": 100.00,
    "status": "completed",
    "transaction_date": "2024-09-12T12:00:00Z"
  }
}
```

### Step 4: Perform a Graceful Shutdown

- **Endpoint**: `POST /shutdown`
- **Description**: To gracefully shut down the system, this endpoint will stop accepting new jobs, process any remaining jobs in the queue, and then terminate the batch processing intervals.

**Request**:

```bash
curl -X POST http://localhost:3000/shutdown
```

**Response**:

```json
{
  "message": "System shut down successfully."
}
```

### Step 5: Verify Shutdown Completion

After initiating the shutdown, the system will stop processing new jobs and finish all jobs remaining in the queue. No new batches will be processed once the queue is emptied, and the interval processing will stop.

You can verify that:
1. No new jobs are processed after shutdown.
2. The job queue has been completely emptied.
3. The fixed interval batching has been stopped.


<br>

## Future Improvements

There are several potential improvements and extensions for this library:

- **Job Retry Mechanism**: Implement a retry mechanism for failed jobs, allowing the system to automatically reprocess jobs that encounter errors.
- **Job Prioritization**: Add support for job prioritization, so high-priority jobs are processed ahead of others.
- **Monitoring and Metrics**: Integrate monitoring tools to track the performance of the batching system, such as job processing time, failure rates, and database query times.
- **Support for Multiple Databases**: Extend the library to support other database systems such as MySQL or MongoDB.
