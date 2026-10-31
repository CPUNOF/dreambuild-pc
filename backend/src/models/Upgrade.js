import { Build } from "./Build.js";
const reference = { ryzen: 100, rtx4090: 100, corsair: 100 };
const gap = (left, right) => Math.abs(left - right) / Math.max(left, right);
const score = (part) => {
  const value = part?.simulationScore ?? reference[part?.id];
  return Number.isFinite(value) && value >= 1 && value <= 100 ? value : null;
};
export class Upgrade {
  static target(analysis) {
    const cpu = score(analysis.parts.find((p) => p.category === "cpu"));
    const gpu = score(analysis.parts.find((p) => p.category === "gpu"));
    if (!analysis.compatible || !Number.isFinite(cpu) || !Number.isFinite(gpu))
      return null;
    return gap(cpu, gpu) > 0.1 ? (cpu < gpu ? "cpu" : "gpu") : null;
  }
  static suggest(analysis, candidates) {
    const category = this.target(analysis);
    const disclaimer =
      "Comparação somente entre índices didáticos. Não é recomendação de compra nem medição de gargalo real.";
    if (!category)
      return {
        status: "balanced_or_unavailable",
        message:
          "O modelo não aponta uma troca; os índices estão próximos ou faltam parâmetros.",
        candidate: null,
        disclaimer,
      };
    const current = analysis.parts.find((part) => part.category === category);
    const other = analysis.parts.find(
      (part) => part.category === (category === "cpu" ? "gpu" : "cpu"),
    );
    const compatible = candidates
      .filter(
        (candidate) =>
          candidate.category === category &&
          candidate.id !== current.id &&
          Number.isFinite(score(candidate)) &&
          score(candidate) > score(current) &&
          gap(score(candidate), score(other)) <
            gap(score(current), score(other)),
      )
      .map((candidate) => ({
        candidate,
        analysis: Build.analyze(
          { ...analysis.partIds, [category]: candidate.id },
          [
            ...analysis.parts.filter((part) => part.category !== category),
            candidate,
          ],
          analysis.comparison.paymentMethod,
          { quantities: analysis.quantities, storageIds: analysis.storageIds },
        ),
      }))
      .filter((result) => result.analysis.compatible)
      .sort(
        (a, b) =>
          gap(score(a.candidate), score(other)) -
          gap(score(b.candidate), score(other)),
      );
    const candidate = compatible[0]?.candidate || null;
    return {
      status: candidate ? "suggested" : "no_candidate",
      category,
      currentScore: score(current),
      candidateScore: candidate ? score(candidate) : null,
      candidate,
      message: candidate
        ? "Alternativa compatível com os critérios automáticos, com índice didático superior. Confira também BIOS, cabos e instalação."
        : "Não há alternativa compatível com índice superior entre as primeiras 100 peças desta categoria.",
      disclaimer,
    };
  }
}
