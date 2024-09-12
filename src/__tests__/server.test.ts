import request from "supertest";
import app from "../server";

describe("API Endpoints", () => {
  let server: any;

  beforeAll(() => {
    process.env.NODE_ENV = "test";
    server = app.listen(3001); // Start the app on a different port for testing
  });

  afterAll(() => {
    server.close();
  });

  test("POST /submit-job should accept a job and return jobId", async () => {
    const job = { user_id: "user1", amount: 100, status: "pending" };

    const response = await request(app)
      .post("/submit-job")
      .send(job)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.result).toHaveProperty("jobId");
  });

  test("GET /job-status/:jobId should return the job status", async () => {
    const job = { user_id: "user1", amount: 100, status: "pending" };

    const submitResponse = await request(app)
      .post("/submit-job")
      .send(job)
      .expect(200);

    const jobId = submitResponse.body.result.jobId;

    const statusResponse = await request(app)
      .get(`/job-status/${jobId}`)
      .expect(200);

    expect(statusResponse.body).toHaveProperty("jobId");
    expect(statusResponse.body.status).toBe("pending");
  });

  test("POST /shutdown should shutdown the system and process remaining jobs", async () => {
    const response = await request(app).post("/shutdown").expect(200);

    expect(response.body.message).toBe("System shut down successfully");
  });
});
