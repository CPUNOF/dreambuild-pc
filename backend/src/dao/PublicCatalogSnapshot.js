import { readFileSync, statSync } from "node:fs";
let cached, mtime;
export function localCatalog({ limit, cursor, category }) {
  const path = new URL(
      "../../data/publicCatalogSnapshot.json",
      import.meta.url,
    ),
    currentMtime = statSync(path).mtimeMs;
  if (!cached || mtime !== currentMtime) {
    cached = JSON.parse(readFileSync(path, "utf8"));
    mtime = currentMtime;
  }
  const rows = cached.items.filter(
    (p) => (!category || p.category === category) && (!cursor || p.id > cursor),
  );
  const items = rows.slice(0, limit);
  return {
    items,
    nextCursor: rows.length > limit ? items.at(-1).id : null,
    source: "curated-local",
    snapshotAt: cached.exportedAt,
  };
}
