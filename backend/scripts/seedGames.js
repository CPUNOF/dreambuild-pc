import { readFile } from "node:fs/promises";
import { getDatabase } from "../src/config/firebaseConfig.js";
import { Game } from "../src/models/Game.js";
const db = getDatabase();
try {
  const games = JSON.parse(
    await readFile(new URL("../data/games.json", import.meta.url), "utf8"),
  );
  for (const game of games) {
    try {
      await db
        .collection("games_benchmark")
        .doc(game.id)
        .create(Game.parse(game));
      console.log("Cenário criado:", game.title);
    } catch (error) {
      if (error.code !== 6) throw error;
      console.log("Cenário preservado:", game.title);
    }
  }
} catch {
  console.error("Não foi possível completar os cenários.");
  process.exitCode = 1;
} finally {
  await db.terminate();
}
