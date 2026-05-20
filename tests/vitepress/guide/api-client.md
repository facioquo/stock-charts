# API client configuration

The `@facioquo/indy-charts` library includes a lightweight API client for fetching quotes and indicator data from the stock-charts Web API.

## Basic usage

```typescript
import { createApiClient } from "@facioquo/indy-charts";

const client = createApiClient({
  baseUrl: "https://api.example.com",
  onError: (context, error) => {
    console.error(context, error);
  }
});

const quotes = await client.getQuotes();
```

## Configuration

`createApiClient()` accepts a base URL and an optional error callback:

```typescript
import { createApiClient } from "@facioquo/indy-charts";

const client = createApiClient({
  baseUrl: "https://your-api.com",
  onError: (context, error) => {
    console.error(`[indy-charts] ${context}`, error);
  }
});
```

## Available methods

```typescript
const quotes = await client.getQuotes();
const listings = await client.getListings();
const rows = await client.getSelectionData(selection, listing);
```

- `getQuotes()` fetches quote history from `GET /quotes`
- `getListings()` fetches indicator metadata from `GET /indicators`
- `getSelectionData(selection, listing)` fetches computed indicator rows using the listing endpoint and `selection.params`

## Data format

The API expects quote data in the following format:

```typescript
interface Quote {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

## Next steps

- [Basic example](/examples/)
- [Adding indicators](/examples/indicators)
- [Multiple charts](/examples/multiple)
