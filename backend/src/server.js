import "dotenv/config";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";
import { recoverInterruptedWorkspaceJobs } from "./services/jobs/workspaceJobProcessor.js";

const port = process.env.PORT ?? 4000;
const app = createApp();

await connectDb();
await recoverInterruptedWorkspaceJobs();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
