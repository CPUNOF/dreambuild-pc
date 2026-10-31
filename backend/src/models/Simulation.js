import { AppError } from "../errors/AppError.js";
const reference = { ryzen: 100, rtx4090: 100, corsair: 100 };
const factors = { "1080p": 1, "1440p": 1.35, "4K": 1.85 };
export class Simulation {
  static setup(analysis, game, input) {
    if (!analysis.compatible)
      throw new AppError(
        400,
        "Conclua uma montagem sem incompatibilidades antes de iniciar.",
      );
    if (
      !game ||
      !Number.isFinite(game.weight) ||
      game.weight <= 0 ||
      !Object.hasOwn(factors, input.resolution) ||
      typeof input.overclock !== "boolean" ||
      typeof input.restrictedCooling !== "boolean"
    )
      throw new AppError(400, "Cenário ou opções inválidos.");
    const score = (category) => {
      const part = analysis.parts.find((item) => item.category === category);
      const value = part?.simulationScore ?? reference[part?.id];
      if (typeof value !== "number" || value < 1 || value > 100)
        throw new AppError(
          400,
          "Cadastre os índices didáticos de CPU, GPU e RAM para simular este conjunto.",
        );
      return value;
    };
    const cpu = score("cpu"),
      gpu = score("gpu"),
      ram = score("ram");
    const baseFps =
      (gpu * 0.65 + cpu * 0.25 + ram * 0.1) /
      (factors[input.resolution] * game.weight);
    return {
      ...input,
      gameId: game.id,
      gameTitle: game.title,
      gameWeight: game.weight,
      resolutionFactor: factors[input.resolution],
      baseFps,
      cpuScore: cpu,
      gpuScore: gpu,
      ramScore: ram,
      balancePercent: Math.round(
        (Math.abs(cpu - gpu) / Math.max(cpu, gpu)) * 100,
      ),
      referenceWatts: analysis.totalWatts,
      calibrated: false,
    };
  }
  static sample(setup, sequence) {
    const seconds = sequence * 0.5;
    const warm = 1 - Math.exp(-seconds / 18);
    const oc = setup.overclock ? 1.15 : 1;
    const cpuTarget =
      72 + (setup.overclock ? 15 : 0) + (setup.restrictedCooling ? 24 : 0);
    const gpuTarget =
      68 + (setup.overclock ? 10 : 0) + (setup.restrictedCooling ? 20 : 0);
    const cpuTemperature =
      Math.round((30 + (cpuTarget - 30) * warm + Math.sin(seconds / 5)) * 10) /
      10;
    const gpuTemperature =
      Math.round((29 + (gpuTarget - 29) * warm + Math.sin(seconds / 7)) * 10) /
      10;
    const throttling = cpuTemperature > 95 || gpuTemperature > 95;
    const fps = Math.max(
      1,
      Math.round(
        setup.baseFps *
          (setup.overclock ? 1.08 : 1) *
          (1 + Math.sin(sequence * 0.55) * 0.04) *
          (throttling ? 0.78 : 1),
      ),
    );
    return {
      sequence,
      elapsedSeconds: seconds,
      simulated: true,
      calibrated: false,
      fps,
      onePercentLow: Math.max(1, Math.round(fps * 0.72)),
      cpuTemperature,
      gpuTemperature,
      cpuUsage: Math.round(
        48 +
          Math.sin(seconds / 4) * 8 +
          (setup.gameId === "counter-strike-2" ? 25 : 7),
      ),
      gpuUsage: Math.round(91 + Math.sin(seconds / 6) * 5),
      cpuClockMHz: Math.round(4200 * oc),
      gpuClockMHz: Math.round(2610 * oc),
      fanRpm: Math.min(2000, Math.round(700 + warm * 1200)),
      powerWatts: Math.round(
        setup.referenceWatts *
          (setup.overclock ? 1.12 : 1) *
          (0.86 + 0.04 * Math.sin(seconds / 8)),
      ),
      throttling,
      alertThresholdC: 95,
    };
  }
}
