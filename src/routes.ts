import express from "express";
import bodyParser from "body-parser";
import { validateMarketId, validateSaveAlert } from "./middleware/validation";
import { getSpread, getSpreads } from "./controllers/spreadController";
import { getAlerts, getAlert, postAlert } from "./controllers/alertController";

const router = express.Router();

// Endpoint to get spread of specific market
router.get("/markets/:id/spreads", validateMarketId, getSpread);

// Endpoint to get spreads of all markets
router.get("/markets/spreads", getSpreads);

// Endpoint to save alert spread for every or specific market
router.post(
  "/markets/spreads/alert",
  bodyParser.json(),
  validateMarketId,
  validateSaveAlert,
  postAlert
);

// Endpoint to get alert spreads for all markets
router.get("/markets/spreads/alert", getAlerts);

// Endpoint to get alert spread for specific market
router.get("/markets/:id/spreads/alert", validateMarketId, getAlert);

export default router;
