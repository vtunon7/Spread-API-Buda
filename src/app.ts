import express, { Request, Response, NextFunction } from "express";
import { setInterval } from "timers";
import { pollAlerts, pollingInterval } from "./services/alertService";
import dotenv from "dotenv";
import routes from "./routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(routes);

// Start polling interval
setInterval(pollAlerts, pollingInterval);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${process.env.PORT}`);
});
