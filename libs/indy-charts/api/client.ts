import {
  IndicatorListing,
  IndicatorParam,
  IndicatorSelection,
  Quote,
  RawQuote
} from "../config/types";

export interface ApiClientConfig {
  baseUrl: string;
  onError?: (context: string, error: unknown) => void;
}

export interface ApiClient {
  getQuotes(): Promise<Quote[]>;
  getListings(): Promise<IndicatorListing[]>;
  getSelectionData(selection: IndicatorSelection, listing: IndicatorListing): Promise<unknown[]>;
}

function toQuotes(raw: RawQuote[]): Quote[] {
  return raw.map(q => ({
    date: new Date(q.date),
    open: q.open,
    high: q.high,
    low: q.low,
    close: q.close,
    volume: q.volume
  }));
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const { baseUrl, onError } = config;

  const headers = {
    "Content-Type": "application/json"
  };

  return {
    async getQuotes(): Promise<Quote[]> {
      try {
        const response = await fetch(`${baseUrl}/quotes`, { headers });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const raw: RawQuote[] = await response.json();
        return toQuotes(raw);
      } catch (error) {
        onError?.("Error fetching quotes", error);
        throw error;
      }
    },

    async getListings(): Promise<IndicatorListing[]> {
      try {
        const response = await fetch(`${baseUrl}/indicators`, { headers });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        onError?.("Error fetching listings", error);
        throw error;
      }
    },

    async getSelectionData(
      selection: IndicatorSelection,
      listing: IndicatorListing
    ): Promise<unknown[]> {
      const params = new URLSearchParams();
      selection.params.forEach((p: IndicatorParam) => {
        if (p.value != null) {
          params.set(p.paramName, String(p.value));
        }
      });

      const url = params.toString() ? `${listing.endpoint}?${params.toString()}` : listing.endpoint;

      try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      } catch (error) {
        onError?.("Error fetching selection data", error);
        throw error;
      }
    }
  };
}
