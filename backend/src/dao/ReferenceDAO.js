import { getDatabase } from "../config/firebaseConfig.js";
import { readFileSync } from "node:fs";
export const referenceVersion = "reference-2026-10-30-v2";
export class ReferenceDAO {
  constructor(database = getDatabase) {
    this.database = database;
    this.systemsCache = null;
    this.systemsPending = null;
    this.datasetPending = null;
  }
  async dataset() {
    this.datasetPending ??= this.fetchDataset().catch((error) => {
      this.datasetPending = null;
      throw error;
    });
    return this.datasetPending;
  }
  async fetchDataset() {
    try {
      const doc = await this.database()
        .collection("benchmark_datasets")
        .doc(referenceVersion)
        .get();
      if (!doc.exists) throw new Error("BENCHMARK_DATASET_MISSING");
      return { ...doc.data(), dataOrigin: "firestore" };
    } catch (error) {
      if (error.code !== 8 && error.message !== "BENCHMARK_DATASET_MISSING")
        throw error;
      const local = JSON.parse(
        readFileSync(
          new URL("../../data/referenceBenchmarks.json", import.meta.url),
          "utf8",
        ),
      );
      return { ...local, dataOrigin: "curated-local" };
    }
  }
  async systems() {
    if (this.systemsCache && Date.now() < this.systemsCache.expiresAt)
      return this.systemsCache.items;
    this.systemsPending ??= this.fetchSystems()
      .then((items) => {
        this.systemsCache = {
          items,
          expiresAt:
            Date.now() +
            (items.some((s) => s.dataOrigin === "curated-local")
              ? 300000
              : 1800000),
        };
        return items;
      })
      .finally(() => {
        this.systemsPending = null;
      });
    return this.systemsPending;
  }
  async fetchSystems() {
    try {
      const result = await this.database()
        .collection("reference_systems")
        .orderBy("displayOrder")
        .limit(30)
        .get();
      return result.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      if (error.code !== 8) throw error;
      return JSON.parse(
        readFileSync(
          new URL("../../data/readySystems.json", import.meta.url),
          "utf8",
        ),
      ).map((s) => ({ ...s, dataOrigin: "curated-local" }));
    }
  }
}
