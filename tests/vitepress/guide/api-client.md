# API Client Configuration

The `@facioquo/indy-charts` library includes a flexible API client for fetching stock quote data.

## Basic Usage

```typescript
import { fetchQuotes } from "@facioquo/indy-charts";

const quotes = await fetchQuotes("MSFT");
```

## Configuration

The API client supports multiple data sources with automatic fallback:

```typescript
import { ApiClient } from "@facioquo/indy-charts";

const client = new ApiClient({
  apiUrl: "https://your-api.com",
  cacheEnabled: true
});
```

## Data Format

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

## Next Steps

- [Basic example](/examples/)
- [Adding indicators](/examples/indicators)
- [Multiple charts](/examples/multiple)
