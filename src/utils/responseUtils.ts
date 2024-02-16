import { Response } from "express";

export function sendErrorResponse(
  res: Response,
  status: number,
  message: string
) {
  res.status(status).json({ message });
}
