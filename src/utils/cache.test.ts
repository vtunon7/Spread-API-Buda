import {
  getCachedMarketIds,
  fetchMarketOrderBooksCached,
  orderBookCache,
} from "./cache";
import * as marketService from "../services/marketService";
import axios from "axios";

describe("getCachedMarketIds", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should fetch market ids and then return cached market ids calling only 1 time fetchMarketIds", async () => {
    const cachedMarketIds = ["BTC-USD", "ETH-USD"];
    const fetchMarketIdsMock = jest
      .spyOn(marketService, "fetchMarketIds")
      .mockResolvedValue(cachedMarketIds);

    const response = await getCachedMarketIds();
    const response2 = await getCachedMarketIds();

    expect(fetchMarketIdsMock).toHaveBeenCalledTimes(1);
    expect(response).toEqual(cachedMarketIds);
    expect(response2).toEqual(cachedMarketIds);
  });
});

jest.mock("axios");

describe("fetchMarketOrderBooksCached", () => {
  const mockOrderBook = { asks: [["10", "1"]], bids: [["9", "2"]] };
  const marketId = "BTC-USD";
  const apiUrl = `${process.env.BUDA_URL}/markets/${marketId}/order_book`;
  const cachedOrderBook = { orderBook: mockOrderBook, timestamp: Date.now() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should handle error when fetching order book from API", async () => {
    const errorMessage = "Error fetching order book";
    const mockedAxiosGet = jest
      .spyOn(axios, "get")
      .mockRejectedValueOnce(new Error(errorMessage));

    const result = await fetchMarketOrderBooksCached(marketId);

    expect(result).toBeUndefined();
    expect(mockedAxiosGet).toHaveBeenCalledWith(apiUrl);
  });

  test("should fetch order book from API if not available in cache or cache expired", async () => {
    const currentTime = Date.now();
    const expirationTime = currentTime + 5000;
    const mockedAxiosGet = jest
      .spyOn(axios, "get")
      .mockResolvedValueOnce({ data: { order_book: mockOrderBook } });
    jest.spyOn(Date, "now").mockReturnValueOnce(expirationTime);

    const result = await fetchMarketOrderBooksCached(marketId);

    expect(result).toEqual(mockOrderBook);
    expect(mockedAxiosGet).toHaveBeenCalledWith(apiUrl);
  });

  test("should return order book from cache if available and not expired", async () => {
    const currentTime = Date.now();
    const expirationTime = currentTime - 5000;
    const mockedAxiosGet = jest
      .spyOn(axios, "get")
      .mockResolvedValueOnce({ data: { order_book: mockOrderBook } });
    jest.spyOn(Date, "now").mockReturnValueOnce(expirationTime);

    orderBookCache[marketId] = cachedOrderBook;

    const result = await fetchMarketOrderBooksCached(marketId);

    expect(result).toEqual(mockOrderBook);
    expect(mockedAxiosGet).not.toHaveBeenCalled();
  });
});
