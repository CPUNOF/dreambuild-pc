import { getDatabase } from "../config/firebaseConfig.js";
export class MetricsDAO {
  constructor(database = getDatabase) {
    this.database = database;
  }
  async summary() {
    const entries = await Promise.all(
      [
        "components",
        "users",
        "builds",
        "simulated_orders",
        "games_benchmark",
      ].map(async (name) => [
        name,
        (await this.database().collection(name).count().get()).data().count,
      ]),
    );
    return Object.fromEntries(entries);
  }
}
