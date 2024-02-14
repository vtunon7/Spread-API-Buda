import { Request, Response, NextFunction } from "express";

export function validateMarketId(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params;
  if (!id || !/^[A-Z]+-[A-Z]+$/.test(id)) {
    return res.status(400).json({
      error:
        "Invalid market ID, ID must be uppercase and inlcude both market names separated by a dash (Ex: BTC-CLP)",
    });
  }
  next();
}

// Middleware para validar el cuerpo de la solicitud para guardar alerta
export function validateSaveAlert(req: Request, res: Response, next: NextFunction) {
  const { alertSpread } = req.body;
  if (!alertSpread || typeof alertSpread !== "object") {
    return res.status(400).json({
      error:
        "Invalid alert spread data, should be an object (Ex: { alertSpread: { BTC-CLP: 1000, ... }})",
    });
  }
  next();
}
