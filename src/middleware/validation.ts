import { Request, Response, NextFunction } from "express";
import { getCachedMarketIds } from "../utils/cache";

// Middleware to validate market ID
export async function validateMarketId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let marketId: string[];
  if (req.params && req.params.id) {
    marketId = [req.params.id];
  } else if (req.body && req.body.alertSpread) {
    marketId = Object.keys(req.body.alertSpread);
  } else {
    return res.status(400).json({
      error: "Market ID not found in request parameters or body",
    });
  }
  const cachedMarketIds = await getCachedMarketIds();
  for (const id of marketId) {
    if (!id || !/^[A-Z]+-[A-Z]+$/.test(id)) {
      return res.status(400).json({
        error: `Invalid market ID (${id}), ID must include both market names separated by a dash (Ex: BTC-CLP)`,
      });
    } else if (!cachedMarketIds.includes(id)) {
      return res.status(400).json({
        error: `Market ID (${id}) not found in available markets`,
      });
    }
  }
  next();
}

// Middleware to validate alert spread data
export function validateSaveAlert(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { alertSpread } = req.body;
  if (!alertSpread || typeof alertSpread !== "object") {
    return res.status(400).json({
      error:
        "Invalid alert spread data, should be an object (Ex: { alertSpread: { BTC-CLP: 1000, ... }})",
    });
  }
  next();
}
