const exactName = (name) =>
  new RegExp("\\b" + name.split(/[ -]+/).join("[\\s-]*") + "\\b", "i");
export function identifyGpu(gpu, dataset) {
  const text = [gpu?.name, gpu?.fullName].filter(Boolean).join(" ");
  if (/laptop|notebook|mobile/i.test(text)) return null;
  const vram =
    Number(gpu?.hardware?.vramGb) ||
    Number(text.match(/\b(\d+)\s*(?:gb|g)\b/i)?.[1]) ||
    null;
  const matches = Object.entries(dataset.gpuProfiles).filter(([, p]) =>
    new RegExp(
      exactName(p.chip).source + "(?!\\s*(?:ti|super|d|xtx?|gre)\\b)",
      "i",
    ).test(text),
  );
  const match =
    matches.find(([, p]) => vram === p.vramGb) ||
    (!vram && matches.length === 1 && !/3060|9060/.test(matches[0][1].chip)
      ? matches[0]
      : null);
  return match?.[0] ?? null;
}
export function performanceReport(analysis, dataset, resolution = "1080p") {
  const cpu = analysis.parts.find((p) => p.category === "cpu"),
    gpu = analysis.parts.find((p) => p.category === "gpu"),
    ram = analysis.parts.find((p) => p.category === "ram");
  const cpuProfile = Object.entries(dataset.cpuScores)
    .filter(([name]) =>
      exactName(name).test(
        [cpu?.name, cpu?.fullName].filter(Boolean).join(" "),
      ),
    )
    .sort((a, b) => b[0].length - a[0].length)[0];
  const gpuProfile = identifyGpu(gpu, dataset),
    profile = dataset.gpuProfiles[gpuProfile],
    supported = Boolean(cpuProfile && gpuProfile && ram),
    referenceOnly = Boolean(!supported && cpu && gpuProfile && ram);
  const games = dataset.games.map((game) => {
    const referenceFps = game.results[gpuProfile]?.[resolution] ?? null;
    const testSetup =
      game.resultSetups?.[gpuProfile] ||
      profile?.testSetup ||
      dataset.testSetup;
    const ratio = cpuProfile
      ? cpuProfile[1] / dataset.cpuScores[testSetup.cpu]
      : null;
    const ceiling = Math.max(
      ...Object.values(game.results)
        .map((r) => r[resolution])
        .filter(Number.isFinite),
    );
    const fps =
      supported && Number.isFinite(referenceFps)
        ? Math.round(
            Math.min(referenceFps, ceiling * Math.min(ratio, 1)) * 10,
          ) / 10
        : referenceOnly
          ? referenceFps
          : null;
    return {
      id: game.id,
      name: game.name,
      preset: game.preset,
      steamId: game.steamId ?? null,
      source:
        game.resultSources?.[gpuProfile] || profile?.source || game.source,
      comparisonKey: game.comparisonKey || null,
      testSetup,
      preview: game.preview || null,
      results: { [resolution]: fps },
      referenceFps,
      kind: referenceOnly ? "gpu-reference" : "estimate",
    };
  });
  const covered = games.filter((g) => Number.isFinite(g.results[resolution])),
    cohort = dataset.rankingGameIds.map((id) => games.find((g) => g.id === id)),
    rankEligible =
      supported &&
      !dataset.cpuScoreDetails?.[cpuProfile?.[0]] &&
      cohort.length >= 10 &&
      cohort.every((g) => g && Number.isFinite(g.results[resolution]));
  const mean = (rows) =>
    Math.round(
      (rows.reduce((n, g) => n + g.results[resolution], 0) / rows.length) * 10,
    ) / 10;
  return {
    version: dataset.version,
    resolution,
    kind: referenceOnly ? "gpu-reference" : "estimate",
    cpuProfile: cpuProfile?.[0] ?? null,
    gpuProfile,
    source: profile?.source || dataset.source,
    testSetup: {
      ...dataset.testSetup,
      ...profile?.testSetup,
      source: profile?.setupSource || dataset.testSetup.source,
      notes: profile?.testNotes || "",
    },
    cpuSource:
      dataset.cpuScoreDetails?.[cpuProfile?.[0]]?.source || dataset.cpuSource,
    games,
    averageFps: covered.length ? mean(covered) : null,
    coveredGames: covered.length,
    rankEligible,
    rankAverageFps: rankEligible ? mean(cohort) : null,
    rankingGameIds: dataset.rankingGameIds,
    notes: [
      referenceOnly
        ? "Referência da GPU: sua CPU ainda não tem índice comparável. Estes são os FPS publicados no PC de teste da fonte, não uma estimativa desta montagem. Esta configuração não participa do ranking."
        : "Estimativa experimental: menor valor entre a referência da GPU e a curva da GPU mais rápida da base ajustada pelo índice médio da CPU, limitado à CPU de teste. Não é medição deste PC nem modelo validado por jogo.",
      ...(dataset.cpuScoreDetails?.[cpuProfile?.[0]]
        ? [dataset.cpuScoreDetails[cpuProfile[0]].note]
        : []),
      "RAM, BIOS, drivers, refrigeração e cenas podem alterar os resultados; não há correção numérica inventada para essas diferenças.",
      dataset.methodology,
      ...(supported
        ? []
        : [
            "Ainda não há dados suficientes dessa CPU/GPU neste conjunto de referências. FPS estimado indisponível; nenhum valor foi inventado.",
          ]),
    ],
    configuration: {
      cpu: cpu?.name ?? "Não selecionado",
      gpu: gpu?.name ?? "Não selecionado",
      ram: ram
        ? `${ram.name}${(analysis.quantities?.[ram.id] ?? 1) > 1 ? ` × ${analysis.quantities[ram.id]} kits` : ""}${analysis.resources?.ram.capacityGb ? ` · ${analysis.resources.ram.capacityGb} GB totais` : ""}`
        : "Não selecionado",
    },
  };
}
