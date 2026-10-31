// Fonte da carga inicial do servidor. A vitrine lê os produtos pela API/DAO/Firestore.
const asset = (file) => `/hardware/official/${file}`;
const checkedAt = "2026-10-30";
export const products = [
  {
    id: "rtx4090",
    slug: "asus-rog-strix-rtx-4090-oc-24gb",
    category: "gpu",
    categoryName: "Placa de vídeo",
    brand: "Asus",
    name: "ROG Strix RTX 4090 OC 24 GB",
    fullName:
      "Placa de vídeo Asus ROG Strix GeForce RTX 4090 OC Edition, 24 GB GDDR6X",
    model: "ROG-STRIX-RTX4090-O24G-GAMING",
    image: asset("rtx4090-1.webp"),
    gallery: [
      {
        src: asset("rtx4090-1.webp"),
        alt: "ROG Strix RTX 4090 vista de frente, com três ventoinhas",
      },
      {
        src: asset("rtx4090-3.png"),
        alt: "ROG Strix RTX 4090 em perspectiva, com iluminação lateral",
      },
      {
        src: asset("rtx4090-2.png"),
        alt: "Parte traseira da ROG Strix RTX 4090, com backplate",
      },
    ],
    description:
      "A ROG Strix RTX 4090 OC Edition combina a GPU GeForce RTX 4090 com 24 GB de memória GDDR6X. A construção ocupa 3,5 slots e utiliza três ventoinhas. Confira o espaço disponível no gabinete e as conexões da fonte antes de escolher esta placa.",
    highlights: ["24 GB GDDR6X", "PCI Express 4.0", "Três ventoinhas"],
    specifications: [
      ["Fabricante", "Asus"],
      ["Modelo", "ROG-STRIX-RTX4090-O24G-GAMING"],
      ["Processador gráfico", "NVIDIA GeForce RTX 4090"],
      ["Memória de vídeo", "24 GB GDDR6X"],
      ["Interface", "PCI Express 4.0"],
      ["Boost padrão", "2610 MHz"],
      ["Boost em modo OC", "2640 MHz"],
      ["Dimensões", "357,6 × 149,3 × 70,1 mm"],
      ["Espaço ocupado", "3,5 slots"],
      ["Conector de energia", "1 × 16 pinos"],
      ["Fonte recomendada pelo fabricante", "1000 W"],
    ],
    compatibilityNote:
      "A indicação de 1000 W é a recomendação da Asus para o cenário descrito na ficha do fabricante. A fonte e o gabinete devem ser avaliados para o conjunto completo.",
    manufacturerUrl:
      "https://rog.asus.com/graphics-cards/graphics-cards/rog-strix/rog-strix-rtx4090-o24g-gaming-model/spec/",
    checkedAt,
  },
  {
    id: "ryzen",
    slug: "amd-ryzen-7-7800x3d",
    category: "cpu",
    categoryName: "Processador",
    brand: "AMD",
    name: "Ryzen 7 7800X3D",
    fullName:
      "Processador AMD Ryzen 7 7800X3D, 8 núcleos, 16 threads, socket AM5",
    model: "100-100000910WOF",
    image: asset("ryzen-1.jpg"),
    gallery: [
      {
        src: asset("ryzen-1.jpg"),
        alt: "Embalagem do AMD Ryzen 7 7800X3D vista de frente",
      },
      {
        src: asset("ryzen-3.jpg"),
        alt: "Embalagem do AMD Ryzen 7 7800X3D em perspectiva pela direita",
      },
      {
        src: asset("ryzen-2.jpg"),
        alt: "Embalagem do AMD Ryzen 7 7800X3D em perspectiva pela esquerda",
      },
    ],
    description:
      "Processador da família Ryzen 7000 com arquitetura Zen 4 e tecnologia AMD 3D V-Cache. Conta com 8 núcleos e 16 threads, utiliza o socket AM5 e trabalha com memória DDR5. A versão identificada nesta página não inclui cooler.",
    highlights: ["8 núcleos / 16 threads", "Socket AM5", "96 MB de cache L3"],
    specifications: [
      ["Fabricante", "AMD"],
      ["Modelo", "Ryzen 7 7800X3D"],
      ["Código da versão em caixa", "100-100000910WOF"],
      ["Arquitetura", "Zen 4"],
      ["Núcleos / threads", "8 / 16"],
      ["Socket", "AM5"],
      ["Clock base", "4,2 GHz"],
      ["Boost máximo", "Até 5,0 GHz"],
      ["Cache L3", "96 MB"],
      ["TDP padrão", "120 W"],
      ["Memória suportada", "DDR5"],
      ["Cooler incluído", "Não"],
    ],
    compatibilityNote:
      "É necessário escolher uma placa-mãe AM5 com suporte ao processador e um cooler compatível. A versão de BIOS também deve ser conferida.",
    manufacturerUrl:
      "https://www.amd.com/en/products/processors/desktops/ryzen/7000-series/amd-ryzen-7-7800X3d.html",
    checkedAt,
  },
  {
    id: "corsair",
    slug: "corsair-vengeance-rgb-ddr5-32gb-6000-branco",
    category: "ram",
    categoryName: "Memória RAM",
    brand: "Corsair",
    name: "Vengeance RGB DDR5 32 GB",
    fullName:
      "Memória Corsair Vengeance RGB DDR5, 32 GB (2 × 16 GB), 6000 MT/s, CL36, branca",
    model: "CMH32GX5M2D6000C36W",
    image: asset("corsair-1.webp"),
    gallery: [
      {
        src: asset("corsair-1.webp"),
        alt: "Kit Corsair Vengeance RGB branco com dois módulos DDR5 iluminados",
      },
      {
        src: asset("corsair-2.webp"),
        alt: "Outro ângulo do kit Corsair Vengeance RGB DDR5 branco",
      },
      {
        src: asset("corsair-3.webp"),
        alt: "Vista adicional dos módulos Corsair Vengeance RGB brancos",
      },
    ],
    description:
      "Kit de memória DDR5 com dois módulos de 16 GB, dissipadores de alumínio brancos e iluminação RGB. Este código de produto utiliza perfil Intel XMP e possui velocidade testada de 6000 MT/s, conforme as condições informadas pela Corsair.",
    highlights: [
      "32 GB em dois módulos",
      "DDR5-6000 / CL36",
      "Perfil Intel XMP",
    ],
    specifications: [
      ["Fabricante", "Corsair"],
      ["Modelo", "CMH32GX5M2D6000C36W"],
      ["Capacidade total", "32 GB (2 × 16 GB)"],
      ["Padrão", "DDR5"],
      ["Formato", "UDIMM, 288 pinos"],
      ["Velocidade testada", "6000 MT/s"],
      ["Latência testada", "CL36"],
      ["Tensão testada", "1,35 V"],
      ["Perfil de desempenho", "Intel XMP"],
      ["Cor", "Branca"],
      ["Dissipador", "Alumínio"],
    ],
    compatibilityNote:
      "A velocidade testada depende da configuração de BIOS e dos componentes. Este kit usa Intel XMP; DDR5, por si só, não garante a validação do perfil em qualquer placa-mãe.",
    manufacturerUrl:
      "https://www.corsair.com/us/en/p/memory/cmh32gx5m2d6000c36w/vengeance-rgb-32gb-2x16gb-ddr5-dram-6000mhz-c36-memory-kit-white-cmh32gx5m2d6000c36w",
    checkedAt,
  },
  {
    id: "samsung",
    slug: "samsung-980-pro-nvme-1tb",
    category: "storage",
    categoryName: "SSD",
    brand: "Samsung",
    name: "980 PRO NVMe M.2 1 TB",
    fullName: "SSD Samsung 980 PRO, 1 TB, M.2 2280, PCIe 4.0 ×4 NVMe",
    model: "MZ-V8P1T0B/AM",
    image: asset("samsung-1.jpg"),
    gallery: [
      {
        src: asset("samsung-1.jpg"),
        alt: "Samsung 980 PRO de 1 TB em foto oficial de apresentação",
      },
    ],
    description:
      "SSD interno de 1 TB no formato M.2 2280, com interface PCIe 4.0 ×4 e protocolo NVMe. Para esta capacidade, a Samsung informa leitura sequencial de até 7000 MB/s e gravação de até 5000 MB/s, conforme as condições de teste do fabricante.",
    highlights: [
      "Capacidade de 1 TB",
      "M.2 2280 / NVMe",
      "Leitura de até 7000 MB/s",
    ],
    specifications: [
      ["Fabricante", "Samsung"],
      ["Modelo", "980 PRO"],
      ["Código da versão fotografada", "MZ-V8P1T0B/AM"],
      ["Capacidade nominal", "1 TB"],
      ["Formato", "M.2 2280"],
      ["Interface", "PCIe 4.0 ×4"],
      ["Protocolo", "NVMe 1.3c"],
      ["Leitura sequencial", "Até 7000 MB/s"],
      ["Gravação sequencial", "Até 5000 MB/s"],
      ["Dimensões máximas", "80,15 × 22,15 × 2,38 mm"],
    ],
    compatibilityNote:
      "Confira o suporte ao SSD NVMe e o espaço M.2 2280 na placa-mãe. A velocidade depende da interface, do firmware e das condições de uso; a capacidade disponível ao sistema é menor que a nominal.",
    manufacturerUrl:
      "https://www.samsung.com/us/memory-storage/nvme-ssd/980-pro-pcie-4-0-nvme-ssd-1tb-sku-mz-v8p1t0b-am/",
    technicalSource:
      "https://download.semiconductor.samsung.com/resources/data-sheet/Samsung-NVMe-SSD-980-PRO-Data-Sheet_Rev.2.1_230509_10129500052824.pdf",
    checkedAt,
  },
  {
    id: "tuf-b650",
    slug: "asus-tuf-gaming-b650-plus-wifi",
    category: "mobo",
    categoryName: "Placa-mãe",
    brand: "Asus",
    name: "TUF Gaming B650-PLUS WIFI",
    fullName:
      "Placa-mãe Asus TUF Gaming B650-PLUS WIFI, AMD B650, AM5, DDR5, ATX",
    model: "TUF GAMING B650-PLUS WIFI",
    image: asset("b650-1.webp"),
    gallery: [1, 2, 3].map((number) => ({
      src: asset(`b650-${number}.webp`),
      alt: `Placa-mãe Asus TUF Gaming B650-PLUS WIFI, vista ${number}`,
    })),
    description:
      "Placa-mãe ATX com chipset AMD B650, socket AM5, quatro slots DDR5 e três conexões M.2. Inclui rede cabeada de 2,5 Gb e Wi-Fi. A lista de CPUs da Asus informa suporte ao Ryzen 7 7800X3D a partir da BIOS 1409.",
    highlights: [
      "Socket AM5 / chipset B650",
      "Quatro slots DDR5",
      "Wi-Fi e Ethernet 2,5 Gb",
    ],
    specifications: [
      ["Fabricante", "Asus"],
      ["Modelo", "TUF GAMING B650-PLUS WIFI"],
      ["Chipset", "AMD B650"],
      ["Socket", "AM5"],
      ["Formato", "ATX"],
      ["Dimensões", "305 × 244 mm"],
      ["Memória", "4 slots DDR5, até 256 GB conforme configuração"],
      ["Slot principal com Ryzen 7000", "PCIe 4.0 ×16"],
      ["Armazenamento", "3 × M.2 e 4 × SATA 6 Gb/s"],
      ["BIOS mínima para Ryzen 7 7800X3D", "1409"],
    ],
    compatibilityNote:
      "Confira a versão instalada da BIOS e a lista de memórias validadas. O perfil de 6000 MT/s do kit Corsair não é garantido apenas por ambas as peças usarem DDR5.",
    manufacturerUrl:
      "https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b650-plus-wifi/techspec/",
    technicalSource:
      "https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b650-plus-wifi/helpdesk_cpu?model2Name=TUF-GAMING-B650-PLUS-WIFI",
    checkedAt,
  },
  {
    id: "rm1000e",
    slug: "corsair-rm1000e-2025-1000w",
    category: "psu",
    categoryName: "Fonte",
    brand: "Corsair",
    name: "RM1000e 2025, 1000 W",
    fullName:
      "Fonte Corsair RM1000e 2025, 1000 W, ATX 3.1, modular, Cybenetics Gold",
    model: "CP-9020297-NA",
    image: asset("rm1000e-1.webp"),
    gallery: [1, 2, 3].map((number) => ({
      src: asset(`rm1000e-${number}.webp`),
      alt: `Fonte Corsair RM1000e 2025 preta, vista ${number}`,
    })),
    description:
      "Fonte de 1000 W com cabeamento totalmente modular e certificação de eficiência Cybenetics Gold. Esta versão da linha RMe atende ao padrão ATX 3.1 e inclui cabo de GPU 12V-2x6 com capacidade declarada de até 600 W.",
    highlights: [
      "1000 W / ATX 3.1",
      "Cabeamento modular",
      "Cabo de GPU 12V-2x6",
    ],
    specifications: [
      ["Fabricante", "Corsair"],
      ["Modelo", "RM1000e 2025"],
      ["Código da variante", "CP-9020297-NA"],
      ["Potência contínua", "1000 W"],
      ["Padrão ATX", "3.1"],
      ["Eficiência", "Cybenetics Gold"],
      ["Cabeamento", "Totalmente modular"],
      ["Dimensões", "140 × 150 × 86 mm"],
      ["Cabo de GPU", "12V-2x6, até 600 W"],
      ["Cabos EPS", "2 × 8 pinos (4+4)"],
    ],
    compatibilityNote:
      "Use os cabos indicados para esta fonte e confira o encaixe completo do conector da GPU. A potência precisa atender ao conjunto; o código regional da oferta deve ser conferido.",
    manufacturerUrl:
      "https://www.corsair.com/us/en/p/psu/cp-9020297-na/rme-series-rm1000e-fully-modular-low-noise-atx-power-supply-cp-9020297-na",
    technicalSource:
      "https://www.corsair.com/us/en/explorer/diy-builder/power-supply-units/corsair-rme-series-2025/",
    checkedAt,
  },
  {
    id: "5000d",
    slug: "corsair-5000d-airflow-preto",
    category: "case",
    categoryName: "Gabinete",
    brand: "Corsair",
    name: "5000D Airflow, preto",
    fullName:
      "Gabinete Corsair 5000D Airflow, mid-tower ATX, vidro temperado, preto",
    model: "CC-9011210-WW",
    image: asset("5000d-1.webp"),
    gallery: [1, 2, 3].map((number) => ({
      src: asset(`5000d-${number}.webp`),
      alt: `Gabinete Corsair 5000D Airflow preto, vista ${number}`,
    })),
    description:
      "Gabinete com painel frontal perfurado e lateral de vidro temperado. O espaço interno permite organizar os cabos e instalar diferentes conjuntos de ventilação. A versão cadastrada é a preta, sem o conjunto RGB das outras edições da família.",
    highlights: [
      "Frontal perfurada",
      "Lateral de vidro temperado",
      "Suporte a placa-mãe ATX",
    ],
    specifications: [
      ["Fabricante", "Corsair"],
      ["Modelo", "5000D Airflow"],
      ["Código", "CC-9011210-WW"],
      ["Cor", "Preta"],
      ["Categoria", "Mid-tower"],
      ["Lateral", "Vidro temperado"],
      ["Comprimento máximo de GPU na ficha", "420 mm"],
      ["Altura máxima do cooler", "170 mm"],
      ["Comprimento máximo de fonte na ficha", "250 mm"],
      ["Ventilação", "Até 10 ventoinhas de 120 mm"],
    ],
    compatibilityNote:
      "Os limites dependem da instalação de ventoinhas, radiadores e cabos. A ficha atual informa 420 mm para GPU; confirme o espaço da montagem e a folga para o conector de energia da placa.",
    manufacturerUrl:
      "https://www.corsair.com/us/en/p/pc-cases/cc-9011210-ww/5000d-airflow-tempered-glass-mid-tower-atx-pc-case-black-cc-9011210-ww",
    checkedAt,
  },
  {
    id: "nh-u12a",
    slug: "noctua-nh-u12a",
    category: "cooler",
    categoryName: "Cooler",
    brand: "Noctua",
    name: "NH-U12A, duas ventoinhas",
    fullName:
      "Cooler para processador Noctua NH-U12A, torre de 158 mm, duas ventoinhas de 120 mm",
    model: "NH-U12A",
    image: asset("nh-u12a-1.jpg"),
    gallery: [
      {
        src: asset("nh-u12a-1.jpg"),
        alt: "Cooler Noctua NH-U12A com dissipador e duas ventoinhas marrom e bege",
      },
    ],
    description:
      "Cooler a ar do tipo torre com duas ventoinhas NF-A12x25 PWM. Possui altura total de 158 mm e suporte a AM5 e AM4, conforme a lista atual do fabricante. O conjunto inclui sistema de fixação SecuFirm2 e pasta térmica NT-H1.",
    highlights: [
      "Suporte a AM5 e AM4",
      "Altura total de 158 mm",
      "Duas NF-A12x25 PWM",
    ],
    specifications: [
      ["Fabricante", "Noctua"],
      ["Modelo", "NH-U12A"],
      ["Refrigeração", "Torre a ar"],
      ["Altura total", "158 mm"],
      ["Sockets AMD", "AM5 e AM4"],
      ["Ventoinhas", "2 × 120 × 120 × 25 mm"],
      ["Modelo das ventoinhas", "NF-A12x25 PWM"],
      ["Controle de rotação", "PWM"],
      ["Fixação", "SecuFirm2"],
      ["Índice NSPR do fabricante", "169 (índice, não potência em watts)"],
    ],
    compatibilityNote:
      "Confira o suporte de montagem disponível na embalagem e a compatibilidade com placa-mãe e gabinete. O índice NSPR não representa TDP em watts nem uma garantia de temperatura.",
    manufacturerUrl: "https://www.noctua.at/en/products/nh-u12a/specifications",
    checkedAt,
  },
];
export const departments = [
  { id: "all", name: "Todos os produtos" },
  { id: "cpu", name: "Processadores" },
  { id: "gpu", name: "Placas de vídeo" },
  { id: "ram", name: "Memórias" },
  { id: "storage", name: "SSDs" },
  { id: "mobo", name: "Placas-mãe" },
  { id: "psu", name: "Fontes" },
  { id: "case", name: "Gabinetes" },
  { id: "cooler", name: "Coolers" },
];
