import { Request, Response } from "express";
import { sendErrorResponse } from "../utils/responseUtils";
import { checkAlerts, checkAlert } from "../services/alertService";

// Function for endpoint to get alert spreads for all markets
export async function getAlerts(req: Request, res: Response) {
  try {
    const alertStatus = await checkAlerts();
    if (alertStatus) {
      res.status(200).json(alertStatus);
    } else {
      sendErrorResponse(res, 500, "Error checking alert status");
    }
  } catch (error) {
    if (error instanceof Error) {
      sendErrorResponse(
        res,
        500,
        "Error fetching alert spread: " + error.message
      );
    } else {
      sendErrorResponse(res, 500, "Error fetching alert spread");
    }
  }
}

// Function for endpoint to get alert spread for specific market
export async function getAlert(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const alertSpread = await checkAlert(id);
    if (alertSpread) {
      res.status(200).json(alertSpread);
    } else {
      sendErrorResponse(res, 500, "Error fetching alert spread");
    }
  } catch (error) {
    if (error instanceof Error) {
      sendErrorResponse(
        res,
        500,
        "Error fetching alert spread: " + error.message
      );
    } else {
      sendErrorResponse(res, 500, "Error fetching alert spread");
    }
  }
}
