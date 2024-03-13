// pages/api/prices.js
import fetch from "isomorphic-unfetch";

// /api/prices?currency=uah
// {"ethereum":{"uah":154499},"optimism":{"uah":170.3},"usd-coin":{"uah":38.76}}

export default async function handler(req, res) {
  // get the currency query parameter
  let { currency = "usd" } = req.query;

  // define the cryptocurrencies we want the prices for
  const coins = ["ethereum", "usd-coin", "optimism"];

  // define the fiat currencies we accept
  const acceptedFiats = [
    "AUD",
    "EUR",
    "JPY",
    "MYR",
    "NZD",
    "RUB",
    "ZAR",
    "SAR",
    "AED",
    "GBP",
    "USD",
    "BRL",
    "IDR",
    "PKR",
    "INR",
    "PHP",
    "MXN",
    "UAH",
  ];

  // check if provided currency is valid
  if (!acceptedFiats.includes(currency.toUpperCase())) {
    return res
      .status(400)
      .json({ msg: "The currency provided is not supported." });
  }

  // fetch the prices from CoinGecko API
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coins.join(",")}&vs_currencies=${currency}`,
    );

    if (response.ok) {
      const prices = await response.json();
      res.status(200).json(prices);
    } else {
      throw new Error("Failed to fetch from CoinGecko API.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
}
