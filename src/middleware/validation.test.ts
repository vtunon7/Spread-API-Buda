import { validateMarketId, validateSaveAlert } from "./validation";
import { getCachedMarketIds } from "../utils/cache";
import { Request, Response, NextFunction } from "express";
import { mock } from "node:test";

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

jest.mock("../utils/cache", () => ({
  getCachedMarketIds: jest.fn(),
}));

const next: NextFunction = jest.fn();

describe("validateMarketId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return 400 if market ID not found in request parameters or body", async () => {
    const req: Partial<Request> = {};
    const res = mockResponse();

    await validateMarketId(
      req as Request,
      res as Response,
      next as NextFunction
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Market ID not found in request parameters or body",
    });
  });

  test("should return 400 if market ID is invalid", async () => {
    const req: Partial<Request> = { params: { id: "invalid-id" } };
    const res = mockResponse();

    await validateMarketId(
      req as Request,
      res as Response,
      next as NextFunction
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error:
        "Invalid market ID (invalid-id), ID must include both market names separated by a dash (Ex: BTC-CLP)",
    });
  });

  test("should return 400 if market ID not found in available markets", async () => {
    const req: Partial<Request> = { params: { id: "BTC-USD" } };
    const res = mockResponse();

    (getCachedMarketIds as jest.Mock).mockResolvedValue([]);

    await validateMarketId(
      req as Request,
      res as Response,
      next as NextFunction
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Market ID (BTC-USD) not found in available markets",
    });
  });

  test("should call next() if all validations pass", async () => {
    const req: Partial<Request> = { params: { id: "BTC-USD" } };
    const res = mockResponse();

    (getCachedMarketIds as jest.Mock).mockResolvedValue(["BTC-USD", "ETH-USD"]);

    await validateMarketId(
      req as Request,
      res as Response,
      next as NextFunction
    );

    expect(next).toHaveBeenCalled();
  });
});

describe("validateSaveAlert", () => {
  // Validates alert spread data when test is an object
  test("should validate alert spread data when test is an object", () => {
    const req: Partial<Request> = {
      body: {
        alertSpread: { "BTC-CLP": 1000 },
      },
    };
    const res = mockResponse();

    validateSaveAlert(req as Request, res as Response, next as NextFunction);
  });

  // Returns a 400 error when alert spread data is missing
  test("should return a 400 error when alert spread data is missing", () => {
    const req: Partial<Request> = {
      body: {},
    };
    const res = mockResponse();

    validateSaveAlert(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error:
        "Invalid alert spread data, should be an object (Ex: { alertSpread: { BTC-CLP: 1000, ... }})",
    });
  });

  test("should call next function when alert spread data is an object", () => {
    const req: Partial<Request> = {
      body: {
        alertSpread: { "BTC-CLP": 1000 },
      },
    };
    const res = mockResponse();

    validateSaveAlert(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalled();
  });
});
