using System.Text.Json;
using System.Text.Json.Nodes;

namespace WebApi.Tests.Services;

/// <summary>
/// Keeps the demo's committed offline snapshot of the catalog in step with the catalog
/// the API serves, so an indicator added or re-parameterized here cannot ship without
/// its snapshot files. Regenerate with <c>pnpm run generate:offline-snapshot</c>.
/// </summary>
public class OfflineSnapshotCatalogTests
{
    private static string SnapshotCatalogPath()
    {
        for (DirectoryInfo? dir = new(AppContext.BaseDirectory); dir is not null; dir = dir.Parent)
        {
            string candidate = Path.Combine(dir.FullName, "web", "public", "data", "chart-api", "indicators.json");
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        throw new FileNotFoundException("web/public/data/chart-api/indicators.json not found above the test output.");
    }

    /// <summary>
    /// The API leaves a <c>false</c> flag out and an older deployment writes it, so compare without it.
    /// </summary>
    private static void DropDefaultFlags(JsonNode catalog)
    {
        foreach (JsonNode? listing in catalog.AsArray())
        {
            foreach (JsonNode? result in listing?["results"]?.AsArray() ?? [])
            {
                if (result?["segmented"]?.GetValue<bool>() == false)
                {
                    result.AsObject().Remove("segmented");
                }
            }
        }
    }

    [Fact]
    public async Task CommittedSnapshotCatalog_MatchesTheCatalogTheApiServes()
    {
        // Snapshot listings carry relative endpoints, so an empty base URL yields the same ones.
        JsonSerializerOptions web = new(JsonSerializerDefaults.Web);
        JsonNode? served = JsonSerializer.SerializeToNode(Metadata.IndicatorListing(string.Empty), web);
        JsonNode? snapshot = JsonNode.Parse(
            await File.ReadAllTextAsync(SnapshotCatalogPath(), TestContext.Current.CancellationToken));

        Assert.NotNull(served);
        Assert.NotNull(snapshot);
        DropDefaultFlags(served);
        DropDefaultFlags(snapshot);
        Assert.True(
            JsonNode.DeepEquals(served, snapshot),
            "web/public/data/chart-api is out of date with the API catalog. Run `pnpm run generate:offline-snapshot` and commit the result.");
    }
}
