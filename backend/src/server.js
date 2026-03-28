import "dotenv/config";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";

const port = process.env.PORT ?? 4000;
const app = createApp();

await connectDb();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
