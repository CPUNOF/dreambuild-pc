// A curated key includes game version and rendering settings. Labels alone do not establish equivalence.
export function sameBenchmark(a, b) {
  if (!a || !b) return false;
  if (a.comparisonKey || b.comparisonKey)
    return Boolean(a.comparisonKey && a.comparisonKey === b.comparisonKey);
  return a.id === b.id && a.preset === b.preset;
}
export function commonBenchmarks(a = [], b = [], resolution = "1080p") {
  return a
    .map((game) => ({
      a: game,
      b: b.find((other) => sameBenchmark(game, other)),
    }))
    .filter(
      (pair) =>
        Number.isFinite(pair.a.results?.[resolution]) &&
        Number.isFinite(pair.b?.results?.[resolution]),
    );
}
