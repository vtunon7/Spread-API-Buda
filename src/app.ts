import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { setInterval } from "timers";
import { getSpread, getSpreads } from "./controllers/spreadController";
import { saveAlert } from "./services/alertService";
import { getAlerts, getAlert } from "./controllers/alertController";
import { validateMarketId, validateSaveAlert } from "./middleware/validation";
import { pollAlerts, pollingInterval } from "./services/alertService";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Endpoint to get spread of specific market
app.get("/markets/:id/spreads", validateMarketId, getSpread);

// Endpoint to get spreads of all markets
app.get("/markets/spreads", getSpreads);

// Endpoint to save alert spread for every or specific market
app.post(
  "/markets/spreads/alert",
  bodyParser.json(),
  validateMarketId,
  validateSaveAlert,
  saveAlert
);

// Endpoint to get alert spreads for all markets
app.get("/markets/spreads/alert", getAlerts);

// Endpoint to get alert spread for specific market
app.get("/markets/:id/spreads/alert", validateMarketId, getAlert);

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
