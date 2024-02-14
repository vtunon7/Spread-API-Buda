export function calculateSpread(orderBook: Record<string, string[]>): number {
  const asks = orderBook.asks;
  const bids = orderBook.bids;
  const asksPrices = asks.map((ask: any) => parseFloat(ask[0]));
  const bidsPrices = bids.map((bid: any) => parseFloat(bid[0]));
  const minAskPrice = asksPrices.reduce(
    (min, price) => (price < min ? price : min),
    asksPrices[0]
  );
  const maxBidPrice = bidsPrices.reduce(
    (max, price) => (price > max ? price : max),
    bidsPrices[0]
  );
  const spread = minAskPrice - maxBidPrice;
  return spread;
}
