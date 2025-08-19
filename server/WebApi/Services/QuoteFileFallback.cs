using System.Text.Json;

namespace WebApi.Services;

/// <summary>
/// Loads backup quotes from the shared JSON snapshot (client/src/app/data/backup-quotes.json)
/// so the same deterministic dataset can be used by both the API (failover) and the frontend.
/// Falls back to the compiled <see cref="QuoteBackup"/> static dataset if the file is missing
/// or invalid. The file contents are cached for the process lifetime.
/// </summary>
internal static class QuoteFileFallback
{
    private static readonly object _sync = new();
    private static IReadOnlyList<Quote>? _cached;
    private static DateTime _lastAttemptUtc;

    // Relative path from server/WebApi/bin/{Config}/net9.0/ to the client data file.
    // We walk up to repo root then into client path. This assumes standard repo layout.
    private static readonly string[] CandidatePaths =
    [
        // Typical runtime path (bin/Debug/net9.0)
        Path.Combine("..", "..", "..", "..", "client", "src", "app", "data", "backup-quotes.json"),
        // When running tests (current directory often server/WebApi.Tests/bin/... referencing WebApi assembly)
        Path.Combine("..", "..", "..", "..", "..", "client", "src", "app", "data", "backup-quotes.json")
    ];

    public static IReadOnlyList<Quote> Get()
    {
        // Fast path if already cached
        if (_cached is { Count: > 0 })
        {
            return _cached;
        }

        lock (_sync)
        {
            if (_cached is { Count: > 0 })
            {
                return _cached;
            }

            foreach (string relative in CandidatePaths)
            {
                try
                {
                    string full = Path.GetFullPath(relative);
                    if (!File.Exists(full))
                    {
                        continue;
                    }

                    using FileStream fs = File.OpenRead(full);
                    List<Quote>? quotes = JsonSerializer.Deserialize<List<Quote>>(fs);
                    if (quotes == null || quotes.Count == 0)
                    {
                        continue;
                    }

                    _cached = quotes.OrderBy(q => q.Date).ToList();
                    _lastAttemptUtc = DateTime.UtcNow;
                    return _cached;
                }
                catch
                {
                    // Ignore and try next path
                }
            }

            // Fallback to compiled static dataset
            _cached = QuoteBackup.BackupQuotes;
            _lastAttemptUtc = DateTime.UtcNow;
            return _cached;
        }
    }
}
