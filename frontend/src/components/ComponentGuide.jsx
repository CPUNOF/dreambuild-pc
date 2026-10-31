import { useState } from "react";
import {
  Cpu,
  CircuitBoard,
  MemoryStick,
  HardDrive,
  Zap,
  Box,
  Fan,
  Monitor,
} from "lucide-react";

const categories = [
  {
    id: "cpu",
    title: "Processador",
    short: "CPU",
    icon: Cpu,
    description:
      "É quem executa as instruções do computador. Jogos, programas e tarefas do dia a dia passam por ele.",
    tip: "O socket do processador precisa ser compatível com o da placa-mãe.",
  },
  {
    id: "gpu",
    title: "Placa de vídeo",
    short: "GPU",
    icon: Monitor,
    description:
      "Transforma os dados em imagens. Tem um papel importante em jogos, edição de vídeo e aplicações gráficas.",
    tip: "Considere o espaço no gabinete e a potência e os conectores exigidos pela placa.",
  },
  {
    id: "mobo",
    title: "Placa-mãe",
    short: "MOBO",
    icon: CircuitBoard,
    description:
      "Conecta as peças do computador e permite que elas trabalhem juntas. Define várias possibilidades de expansão.",
    tip: "Confira socket, versão de BIOS, padrão da memória e formato do gabinete.",
  },
  {
    id: "ram",
    title: "Memória RAM",
    short: "RAM",
    icon: MemoryStick,
    description:
      "Guarda temporariamente os dados dos programas em uso. Ajuda o computador a trabalhar com várias tarefas.",
    tip: "DDR4 e DDR5 são padrões diferentes. A memória deve seguir o padrão da placa-mãe.",
  },
  {
    id: "storage",
    title: "Armazenamento",
    short: "SSD / HD",
    icon: HardDrive,
    description:
      "É onde ficam o sistema, os jogos e seus arquivos, mesmo depois de desligar o computador.",
    tip: "Verifique a interface e o formato suportados pela placa-mãe antes de escolher um SSD.",
  },
  {
    id: "psu",
    title: "Fonte",
    short: "PSU",
    icon: Zap,
    description:
      "Fornece energia para todo o computador. Precisa atender ao consumo das peças e ter os conectores adequados.",
    tip: "Potência não é o único critério: confira qualidade, proteções e requisitos das peças.",
  },
  {
    id: "case",
    title: "Gabinete",
    short: "CASE",
    icon: Box,
    description:
      "Abriga os componentes e organiza o fluxo de ar. O espaço interno deve acomodar todas as peças.",
    tip: "Confira comprimento da GPU, altura do cooler e formato da placa-mãe.",
  },
  {
    id: "cooler",
    title: "Refrigeração",
    short: "COOLER",
    icon: Fan,
    description:
      "Ajuda a dissipar o calor produzido pelo processador. Trabalha junto com a ventilação do gabinete.",
    tip: "O cooler precisa ter suporte ao socket e espaço para instalação no gabinete.",
  },
];

export default function ComponentGuide() {
  const [selected, setSelected] = useState(categories[0]);
  const SelectedIcon = selected.icon;

  return (
    <section
      id="componentes"
      className="section-shell"
      aria-label="Guia das categorias de componentes"
    >
      <div className="guide-layout">
        <div className="category-grid" aria-label="Categorias de componentes">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected.id === category.id}
                aria-controls="component-description"
                onClick={() => setSelected(category)}
              >
                <Icon size={24} aria-hidden="true" />
                <span>
                  {category.title}
                  <small>{category.short}</small>
                </span>
              </button>
            );
          })}
        </div>
        <div
          className="component-description"
          id="component-description"
          aria-live="polite"
          aria-atomic="true"
        >
          <SelectedIcon size={36} strokeWidth={1.4} aria-hidden="true" />
          <h3>{selected.title}</h3>
          <p>{selected.description}</p>
          <div className="compatibility-note">
            <strong>Na hora de combinar</strong>
            <p>{selected.tip}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
