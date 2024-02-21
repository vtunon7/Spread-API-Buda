import { fetchMarketIds, calculateSpread } from "./marketService";
import axios from "axios";

jest.mock("axios");

describe("fetchMarketIds", () => {
  test("should return an array of market ids", async () => {
    const responseData = {
      data: {
        markets: [{ id: "BTC-USD" }, { id: "ETH-USD" }],
      },
    };

    (axios.get as jest.Mock).mockResolvedValue(responseData);

    const result = await fetchMarketIds();
    expect(result).toEqual(["BTC-USD", "ETH-USD"]);
  });

  test("should handle errors when fetching market ids", async () => {
    const errorMessage = "Error: fetching market ids";

    (axios.get as jest.Mock).mockRejectedValue(new Error(errorMessage));
    jest.spyOn(global.console, "error").mockImplementation(() => {});

    await fetchMarketIds();

    expect(console.error).toHaveBeenCalledWith(
      "Error fetching market ids:",
      Error(errorMessage)
    );
  });
});

describe("calculateSpread", () => {
  test("should calculate spread correctly when there are both asks and bids in the order book", () => {
    const orderBook = {
      asks: [
        ["10", "100"],
        ["11", "200"],
      ],
      bids: [
        ["9", "150"],
        ["8", "300"],
      ],
    };
    const spread = calculateSpread(orderBook);
    expect(spread).toBe(1);
  });

  test("should calculate spread correctly when there is only one ask and one bid in the order book", () => {
    const orderBook = {
      asks: [["10", "100"]],
      bids: [["9", "150"]],
    };
    const spread = calculateSpread(orderBook);
    expect(spread).toBe(1);
  });

  test("should calculate spread correctly when there are multiple asks and one bid in the order book", () => {
    const orderBook = {
      asks: [
        ["10", "100"],
        ["11", "200"],
        ["12", "300"],
      ],
      bids: [["9", "150"]],
    };
    const spread = calculateSpread(orderBook);
    expect(spread).toBe(1);
  });

  test("should calculate spread correctly when there are duplicate prices in the asks or bids arrays", () => {
    const orderBook = {
      asks: [
        ["10", "100"],
        ["10", "200"],
      ],
      bids: [
        ["9", "150"],
        ["8", "300"],
      ],
    };
    const spread = calculateSpread(orderBook);
    expect(spread).toBe(1);
  });

  test("should calculate spread correctly when the prices in the asks or bids arrays are in descending order", () => {
    const orderBook = {
      asks: [
        ["12", "100"],
        ["11", "200"],
      ],
      bids: [
        ["10", "150"],
        ["9", "300"],
      ],
    };
    const spread = calculateSpread(orderBook);
    expect(spread).toBe(1);
  });
});
