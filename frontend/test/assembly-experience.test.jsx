import { beforeAll, afterAll, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComponentPicker from "../src/components/ComponentPicker.jsx";
import BuildResourcesPanel from "../src/components/BuildResourcesPanel.jsx";
import AssemblyWorkspace from "../src/components/AssemblyWorkspace.jsx";
import { buildResources } from "../../shared/buildResources.js";

const product = (id, category, hardware) => ({
  id,
  category,
  categoryName: category,
  name: id,
  fullName: id,
  model: id,
  brand: "Teste",
  image: "/hardware/test.jpg",
  hardware,
  inventory: { quantity: 50, unitPriceCents: 10000 },
});
const cpu = product("CPU AM4", "cpu", {
  socket: "AM4",
  ramType: "DDR4",
  coolerPackage: "included",
  boxedCoolerName: "Cooler BOX",
});
const board = product("Placa AM4", "mobo", {
  socket: "AM4",
  ramType: "DDR4",
  ramSlots: 2,
  maxRamGb: 64,
  m2Slots: [{ id: "M2_1", protocols: ["nvme"], formats: ["M.2 2280"] }],
  sataPorts: 4,
});
const ram = product("Kit DDR4 16 GB", "ram", {
  ramType: "DDR4",
  modules: 2,
  capacityGb: 16,
});
const incompatible = product("Kit DDR5 32 GB", "ram", {
  ramType: "DDR5",
  modules: 2,
  capacityGb: 32,
});
let oldShow, oldClose;
beforeAll(() => {
  oldShow = HTMLDialogElement.prototype.showModal;
  oldClose = HTMLDialogElement.prototype.close;
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
afterAll(() => {
  HTMLDialogElement.prototype.showModal = oldShow;
  HTMLDialogElement.prototype.close = oldClose;
});

describe("Bancada: seleção contextual e compatibilidade", () => {
  test("fonte adequada aparece antes de escolher gabinete sem exigir comprimento", () => {
    const source = product("Fonte 650 W", "psu", {
      wattage: 650,
      lengthMm: 140,
      connectors: ["atx24", "eps8", "pcie8"],
    });
    render(
      <ComponentPicker
        category="psu"
        products={[source]}
        parts={[
          { ...cpu, hardware: { ...cpu.hardware, tdpWatts: 65 } },
          product("GPU teste", "gpu", {
            powerConnector: "pcie8",
            referencePowerWatts: 145,
            recommendedPsuWatts: 550,
            lengthMm: 197,
          }),
        ]}
        powerAnalysis={{ recommendedPsuWatts: 550 }}
        onChoose={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Selecionar Fonte 650 W" }),
    ).toBeEnabled();
    expect(
      screen.getByText(/Atende aos critérios cadastrados/),
    ).toBeInTheDocument();
  });
  test("RAM antiga com ficha incompleta não esvazia a lista de GPUs válidas", () => {
    const gpu = product("GPU validada", "gpu", {
      powerConnector: "pcie8",
      referencePowerWatts: 145,
      recommendedPsuWatts: 550,
      lengthMm: 197,
    });
    render(
      <ComponentPicker
        category="gpu"
        products={[gpu, product("GPU sem ficha", "gpu", {})]}
        parts={[
          { ...cpu, hardware: { ...cpu.hardware, tdpWatts: 65 } },
          board,
          product("RAM antiga", "ram", { ramType: "DDR4", capacityGb: 16 }),
        ]}
        onChoose={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Selecionar GPU validada" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Selecionar GPU sem ficha" }),
    ).not.toBeInTheDocument();
  });
  test("última etapa oferece carrinho e benchmark e não mostra próxima peça", async () => {
    const finish = vi.fn();
    render(
      <AssemblyWorkspace
        products={[cpu]}
        partIds={{ cpu: cpu.id }}
        activeCategory="cooler"
        onActiveCategory={vi.fn()}
        onPick={vi.fn()}
        onRemove={vi.fn()}
        resources={buildResources([cpu], {})}
        onFinish={finish}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Próxima peça/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Adicionar PC ao carrinho" }),
    );
    expect(finish).toHaveBeenLastCalledWith("cart");
    await userEvent.click(
      screen.getByRole("button", { name: "Testar desempenho" }),
    );
    expect(finish).toHaveBeenLastCalledWith("benchmark");
  });
  test("RAM incompatível não aparece na lista da plataforma AM4", () => {
    render(
      <ComponentPicker
        category="ram"
        products={[ram, incompatible]}
        parts={[cpu, board]}
        onChoose={vi.fn()}
        onClose={vi.fn()}
        onResetPlatform={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Selecionar Kit DDR4 16 GB" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Selecionar Kit DDR5 32 GB" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 modelos compatíveis",
    );
  });
  test("um socket LGA diferente fica oculto, com saída para trocar a plataforma", async () => {
    const reset = vi.fn();
    render(
      <ComponentPicker
        category="mobo"
        products={[
          product("Placa LGA1200", "mobo", {
            socket: "LGA1200",
            ramType: "DDR4",
          }),
        ]}
        parts={[product("CPU LGA1700", "cpu", { socket: "LGA1700" })]}
        onChoose={vi.fn()}
        onClose={vi.fn()}
        onResetPlatform={reset}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Selecionar Placa LGA1200" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", {
        name: "Trocar plataforma e escolher novamente",
      }),
    );
    expect(reset).toHaveBeenCalledOnce();
  });
  test("slots e quantidade aparecem na RAM; não permite exceder os dois slots", async () => {
    const pick = vi.fn(),
      quantity = vi.fn(),
      parts = [cpu, board, ram];
    render(
      <BuildResourcesPanel
        category="ram"
        parts={parts}
        quantities={{}}
        resources={buildResources(parts, {})}
        onQuantity={quantity}
        onPick={pick}
      />,
    );
    expect(screen.getByLabelText("2 de 2 slots ocupados")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: `Aumentar quantidade de ${ram.name}`,
      }),
    ).toBeDisabled();
    expect(screen.queryByText("Seus armazenamentos")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: `Remover ${ram.name}` }),
    );
    expect(pick).toHaveBeenCalledWith("ram", "remove");
    expect(quantity).not.toHaveBeenCalled();
  });
  test("refrigeração incluída reduz as etapas obrigatórias; avançar mantém a seleção", async () => {
    const active = vi.fn(),
      pick = vi.fn();
    render(
      <AssemblyWorkspace
        products={[cpu]}
        partIds={{ cpu: cpu.id }}
        activeCategory="cpu"
        onActiveCategory={active}
        onPick={pick}
        onRemove={vi.fn()}
        resources={buildResources([cpu], {})}
      />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuemax",
      "7",
    );
    await userEvent.click(screen.getByRole("button", { name: /Próxima peça/ }));
    expect(active).toHaveBeenCalledWith("mobo");
    expect(pick).not.toHaveBeenCalled();
  });
});
