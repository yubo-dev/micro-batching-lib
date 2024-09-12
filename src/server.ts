import express from "express";
import { batchingLibrary } from "./setup";

const app = express();
app.use(express.json());

app.post("/submit-job", (req, res) => {
  try {
    const job = req.body;
    const result = batchingLibrary.submitJob(job);
    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get("/job-status/:jobId", (req, res) => {
  const { jobId } = req.params;

  try {
    const jobStatus = batchingLibrary.getJobStatus(jobId);
    res.status(200).json(jobStatus);
  } catch (error) {
    res.status(404).json({ success: false, message: (error as Error).message });
  }
});

app.post("/shutdown", async (_, res) => {
  await batchingLibrary.shutdown();
  res.status(200).json({ message: "System shut down successfully" });
});

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
