import { getDatabase } from "../src/config/firebaseConfig.js";
import { Component } from "../src/models/Component.js";
import { CommunityController } from "../src/controllers/CommunityController.js";
import { CommunityDAO } from "../src/dao/CommunityDAO.js";
import { ReferenceDAO } from "../src/dao/ReferenceDAO.js";
import { suggestAssembly } from "../../shared/suggestAssembly.js";
import { identifyGpu } from "../src/models/ReferencePerformance.js";
import { assemblyReadiness } from "../../shared/assemblyCompatibility.js";

// Exemplos identificados, sem criar contas nem publicar montagens dos usuários.
const examples = [
  ["BatataSuprema", "Batata com Ray Tracing"],
  ["PixParcelado", "O boleto roda Crysis"],
  ["RGBdaSilva", "RGB dá mais FPS"],
  ["KaioDoFPS", "Kaio e a máquina do caos"],
  ["BrenoTurbo", "Breno sem limite de FPS"],
  ["TioDoSetup", "Só mais uma pecinha"],
  ["CafeComGPU", "Café, código e headshot"],
  ["FritadeiraGamer", "Air Fryer de pixels"],
  ["FiscalDoFrame", "Cadê meu 1% low?"],
  ["SemLagSoDivida", "Setup do último boleto"],
];
const db = getDatabase();
try {
  const [catalog, stocks, dataset] = await Promise.all([
    db.collection("components").get(),
    db.collection("inventory").get(),
    new ReferenceDAO().dataset(),
  ]);
  const inventory = new Map(stocks.docs.map((d) => [d.id, d.data()]));
  const parts = catalog.docs.map(
    (d) => new Component(d.id, { ...d.data(), inventory: inventory.get(d.id) }),
  );
  const valid = parts.filter((p) => !assemblyReadiness(p).length);
  const cpus = valid.filter(
    (p) =>
      p.category === "cpu" &&
      Object.keys(dataset.cpuScores).some((name) => p.name.includes(name)),
  );
  const gpus = valid.filter(
    (p) => p.category === "gpu" && identifyGpu(p, dataset),
  );
  const builds = new Map();
  const controller = new CommunityController({
    builds: { getById: async (id) => builds.get(id) },
    components: {
      getMany: async (ids) => ids.map((id) => parts.find((p) => p.id === id)),
    },
    references: { dataset: async () => dataset },
  });
  const prepared = [],
    signatures = new Set();
  combinations: for (const gpu of gpus) {
    let gpuCount = 0;
    cpuVariants: for (const cpu of cpus) {
      for (const enclosure of valid.filter((p) => p.category === "case")) {
        for (const memory of valid.filter((p) => p.category === "ram")) {
          const selection = suggestAssembly(
            parts.filter(
              (p) =>
                (p.category !== "cpu" || p.id === cpu.id) &&
                (p.category !== "gpu" || p.id === gpu.id) &&
                (p.category !== "case" || p.id === enclosure.id) &&
                (p.category !== "ram" || p.id === memory.id),
            ),
            cpu.id,
          );
          if (!selection) continue;
          const signature = JSON.stringify(selection);
          if (signatures.has(signature)) continue;
          const id = `demo-community-${String(prepared.length + 1).padStart(2, "0")}`;
          builds.set(id, { userId: "dreambuild-demo", partIds: selection });
          const { data } = await controller.prepare("dreambuild-demo", id);
          if (
            !data.performance["1080p"].rankEligible ||
            !data.performance["1440p"].rankEligible
          )
            continue;
          const [nickname, title] = examples[prepared.length];
          prepared.push({
            id,
            data: {
              ...data,
              nickname,
              title,
              demo: true,
              publishedAt: new Date().toISOString(),
            },
          });
          signatures.add(signature);
          gpuCount++;
          if (prepared.length === examples.length) break combinations;
          if (gpuCount >= 5) break cpuVariants;
        }
      }
    }
    if (prepared.length === examples.length) break;
  }
  if (prepared.length !== 10)
    throw Error(
      `Apenas ${prepared.length}/10 exemplos completos e compatíveis encontrados. Nada gravado.`,
    );
  if (!process.argv.includes("--apply")) {
    console.log(
      JSON.stringify({
        prepared: prepared.length,
        applyRequired: true,
        examples: prepared.map((p) => ({
          id: p.id,
          title: p.data.title,
          cpu: p.data.configuration.cpu,
          gpu: p.data.configuration.gpu,
        })),
      }),
    );
  } else {
    const dao = new CommunityDAO();
    for (const record of prepared)
      await dao.publish("dreambuild-demo", record.id, record.data);
    console.log(
      JSON.stringify({
        published: prepared.length,
        demonstration: true,
        userBuildsChanged: false,
        stockChanged: false,
      }),
    );
  }
} finally {
  await db.terminate();
}
