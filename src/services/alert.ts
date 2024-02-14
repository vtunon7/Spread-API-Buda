import { Request, Response } from "express";

export let alertSpreads: { [market: string]: number } = {};

export async function saveAlert(req: Request, res: Response) {
  const { alertSpread } = req.body;
  if (alertSpread) {
    alertSpreads = { ...alertSpreads, ...alertSpread };
    res
      .status(201)
      .json({ message: "Alert spread saved successfully", alertSpreads });
  } else {
    res
      .status(400)
      .json({ message: "Invalid request body: alertSpread is required" });
  }
}
