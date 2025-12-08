// API source for pulling random quotes
const QUOTE_ENDPOINT = "https://quoteslate.vercel.app/api/quotes/random";

type Quote = {
  quote: string;
  author: string;
};

type QuoteResponse = Quote | { data: Quote | Quote[] };

// Fetches a quote within the provided bounds, using the API
export async function generateText(minLength = 100, maxLength = 500): Promise<Quote> {
  const params = new URLSearchParams({
    minLength: String(minLength),
    maxLength: String(maxLength),
  });

  const response = await fetch(`${QUOTE_ENDPOINT}?${params.toString()}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch quote");
  }

  const json = (await response.json()) as QuoteResponse;
  const quoteData = (() => {
    if ("data" in json) {
      return Array.isArray(json.data) ? json.data[0] : json.data;
    }

    if ("quote" in json && "author" in json) {
      return json;
    }

    return undefined;
  })();

  if (!quoteData) {
    throw new Error("QuoteSlate returned no data");
  }

  return {
    quote: quoteData.quote,
    author: quoteData.author ?? "Unknown",
  };
}
