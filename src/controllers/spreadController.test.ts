import { getSpread, getSpreads } from "./spreadController";
import { fetchMarketOrderBooksCached } from "../utils/cache";
import { calculateSpread, calculateSpreads } from "../services/marketService";

const mockRequest = () => {
  const req: any = {};
  req.params = { id: "BTC-USD" }; // Simula el parámetro de la solicitud
  return req;
};
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res); // Simula la función de estado
  res.json = jest.fn().mockReturnValue(res); // Simula la función de JSON
  return res;
};

jest.mock("../utils/cache", () => ({
  fetchMarketOrderBooksCached: jest.fn(),
}));

const mockOrderBook = {
  bids: [{ price: 100, amount: 2 }],
  asks: [{ price: 105, amount: 2 }],
};

jest.mock("../services/marketService", () => ({
  ...jest.requireActual("../services/marketService"),
  calculateSpread: jest.fn(),
  calculateSpreads: jest.fn(),
}));

describe("getSpread", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return spread for a valid market ID", async () => {
    (fetchMarketOrderBooksCached as jest.Mock).mockResolvedValue(mockOrderBook);

    (calculateSpread as jest.Mock).mockReturnValue(0.05);

    const req = mockRequest();
    const res = mockResponse();

    await getSpread(req, res);

    expect(fetchMarketOrderBooksCached).toHaveBeenCalledWith("BTC-USD");

    expect(calculateSpread).toHaveBeenCalledWith(mockOrderBook);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      market: { "BTC-USD": { spread: 0.05 } },
    });
  });

  test("should handle error when fetching order book", async () => {
    (fetchMarketOrderBooksCached as jest.Mock).mockResolvedValue(undefined);

    const req = mockRequest();
    const res = mockResponse();

    await getSpread(req, res);

    expect(fetchMarketOrderBooksCached).toHaveBeenCalledWith("BTC-USD");

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error fetching order book",
    });
  });
});

describe("getSpreads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return spreads when calculation is successful", async () => {
    const mockSpreads = {
      market1: { spread: 0.01 },
      market2: { spread: 0.02 },
    };
    (calculateSpreads as jest.Mock).mockResolvedValue(mockSpreads);

    const res = mockResponse();

    await getSpreads(null as any, res);

    expect(calculateSpreads).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({ market: mockSpreads });
  });

  test("should handle error when calculation fails", async () => {
    (calculateSpreads as jest.Mock).mockResolvedValue(undefined);

    const res = mockResponse();

    await getSpreads(null as any, res);

    expect(calculateSpreads).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error fetching spreads",
    });
  });
});
