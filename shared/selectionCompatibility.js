const canonical = (value) =>
  typeof value === "string" ? value.toUpperCase().replace(/[\s-]/g, "") : null;
export function selectionIssues(components) {
  const parts = Object.fromEntries(
      components.filter(Boolean).map((p) => [p.category, p]),
    ),
    issues = [];
  const cpu = parts.cpu?.hardware || {},
    board = parts.mobo?.hardware || {},
    ram = parts.ram?.hardware || {};
  if (parts.cpu && parts.cooler) {
    const socket = canonical(cpu.socket),
      supported = parts.cooler.hardware?.supportedSockets;
    if (!socket || !Array.isArray(supported) || !supported.length)
      issues.push({
        code: "UNKNOWN_COOLER_SOCKET",
        message:
          "Falta a lista confirmada de sockets do cooler ou o socket da CPU.",
      });
    else if (!supported.some((s) => canonical(s) === socket))
      issues.push({
        code: "COOLER_SOCKET",
        message: `O cooler escolhido não declara suporte ao socket ${socket}.`,
      });
  }
  if (parts.cpu && parts.mobo) {
    const a = canonical(cpu.socket),
      b = canonical(board.socket);
    if (!a || !b)
      issues.push({
        code: "UNKNOWN_CRITICAL_SOCKET",
        message:
          "Faltam dados de socket para combinar este processador e esta placa-mãe.",
      });
    else if (a !== b)
      issues.push({
        code: "SOCKET",
        message: `Sockets diferentes: CPU ${a}, placa-mãe ${b}. LGA e AM não são intercambiáveis.`,
      });
  }
  if (parts.mobo && parts.ram) {
    const a = canonical(board.ramType),
      b = canonical(ram.ramType);
    if (!a || !b)
      issues.push({
        code: "UNKNOWN_CRITICAL_RAM",
        message:
          "Falta o padrão DDR da memória ou da placa-mãe. Não é possível combinar sem conferir.",
      });
    else if (a !== b)
      issues.push({
        code: "RAM_TYPE",
        message: `Esta placa-mãe utiliza ${a}; a memória escolhida é ${b}.`,
      });
  }
  if (parts.cpu && parts.ram) {
    const socket = canonical(cpu.socket),
      type = canonical(cpu.ramType) || { AM4: "DDR4", AM5: "DDR5" }[socket],
      actual = canonical(ram.ramType);
    if (["DDR4", "DDR5"].includes(type) && actual && type !== actual)
      issues.push({
        code: "CPU_RAM_TYPE",
        message: `A plataforma ${socket || type} requer ${type}; esta memória é ${actual}.`,
      });
  }
  return issues;
}
