const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
// OpenAPI 3.0 não aceita "required: []"; a lista só entra quando há campos.
const object = (properties, required = []) => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
});
const string = { type: "string" };
const id = {
  type: "string",
  pattern: "^[a-zA-Z0-9_-]{1,128}$",
  example: "kabum-105015",
};
const page = [
  {
    in: "query",
    name: "limit",
    schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
  {
    in: "query",
    name: "cursor",
    // Sem exemplo: o Swagger UI preencheria o campo e pularia a 1ª página.
    schema: { type: "string", pattern: "^[a-zA-Z0-9_-]{1,128}$" },
    description: "Deixe vazio na 1ª página; depois use meta.nextCursor.",
  },
];
const parameter = { in: "path", name: "id", required: true, schema: id };
const schemas = {
  Envelope: object(
    {
      status: { type: "string", enum: ["success", "error"] },
      message: string,
      data: { nullable: true },
      errors: { type: "array", items: { type: "object" } },
      meta: { type: "object" },
    },
    ["status", "message", "data", "errors", "meta"],
  ),
  Registration: object(
    {
      name: { type: "string", minLength: 2, maxLength: 80 },
      email: { type: "string", format: "email", maxLength: 254 },
      password: {
        type: "string",
        minLength: 8,
        maxLength: 128,
        format: "password",
      },
    },
    ["name", "email", "password"],
  ),
  Login: object(
    {
      email: { type: "string", format: "email" },
      password: { type: "string", format: "password" },
    },
    ["email", "password"],
  ),
  PartIds: object(
    Object.fromEntries(
      ["cpu", "mobo", "ram", "gpu", "storage", "psu", "case", "cooler"].map(
        (key) => [key, id],
      ),
    ),
  ),
  BuildInput: object(
    {
      partIds: ref("PartIds"),
      paymentMethod: {
        type: "string",
        enum: ["pix", "cash", "card"],
        default: "pix",
      },
    },
    ["partIds"],
  ),
  SaveBuild: object(
    {
      name: { type: "string", minLength: 2, maxLength: 80 },
      partIds: ref("PartIds"),
      paymentMethod: { type: "string", enum: ["pix", "cash", "card"] },
    },
    ["name", "partIds"],
  ),
  DemoCard: object(
    {
      number: { type: "string", pattern: "^000000[0-9]{10}$" },
      cvv: { type: "string", pattern: "^[0-9]{3}$" },
      validUntil: { type: "integer" },
      token: string,
    },
    ["number", "cvv", "validUntil", "token"],
  ),
  Checkout: object(
    {
      buildId: id,
      idempotencyKey: { type: "string", minLength: 16, maxLength: 128 },
      card: ref("DemoCard"),
    },
    ["buildId", "idempotencyKey", "card"],
  ),
  Offer: object(
    {
      store: { type: "string", enum: ["kabum", "pichau", "terabyte"] },
      paymentMethod: { type: "string", enum: ["pix", "cash", "card"] },
      availability: {
        type: "string",
        enum: ["in_stock", "out_of_stock", "unknown"],
      },
      priceCents: {
        type: "integer",
        minimum: 1,
        nullable: true,
        description:
          "Centavos inteiros. Nulo somente sem disponibilidade confirmada.",
      },
      sourceUrl: { type: "string", format: "uri" },
      checkedAt: { type: "string", format: "date-time" },
    },
    ["store", "paymentMethod", "availability", "sourceUrl", "checkedAt"],
  ),
  Component: object(
    {
      slug: { type: "string", maxLength: 100 },
      category: {
        type: "string",
        enum: ["cpu", "gpu", "mobo", "ram", "storage", "psu", "case", "cooler"],
      },
      categoryName: string,
      brand: string,
      name: string,
      fullName: string,
      model: string,
      image: string,
      gallery: {
        type: "array",
        minItems: 1,
        maxItems: 12,
        items: object({ src: string, alt: string }, ["src", "alt"]),
      },
      description: string,
      highlights: { type: "array", items: string },
      specifications: {
        type: "array",
        description:
          "Pares [característica, valor]. O Model converte para mapas no Firestore.",
        items: { type: "array", minItems: 2, maxItems: 2, items: string },
      },
      compatibilityNote: string,
      manufacturerUrl: { type: "string", format: "uri" },
      hardware: {
        type: "object",
        description: "Dados técnicos por categoria, validados no Model.",
      },
      offers: { type: "array", items: ref("Offer") },
      simulationScore: {
        type: "number",
        minimum: 1,
        maximum: 100,
        nullable: true,
        description: "Índice didático, não benchmark medido.",
      },
    },
    [
      "slug",
      "category",
      "categoryName",
      "brand",
      "name",
      "fullName",
      "model",
      "image",
      "gallery",
      "description",
      "highlights",
      "specifications",
      "compatibilityNote",
      "manufacturerUrl",
    ],
  ),
  Game: object(
    {
      id: { type: "string", pattern: "^[a-z0-9-]{1,100}$" },
      title: string,
      weight: { type: "number", minimum: 0.1, maximum: 10 },
      coverUrl: string,
      screenshotUrl: string,
      sourceUrl: { type: "string", format: "uri" },
    },
    ["id", "title", "weight", "coverUrl", "screenshotUrl", "sourceUrl"],
  ),
};
const paths = {};
schemas.CartLine = object(
  { componentId: id, quantity: { type: "integer", minimum: 1, maximum: 10 } },
  ["componentId", "quantity"],
);
schemas.CartQuantity = object(
  { quantity: { type: "integer", minimum: 1, maximum: 10 } },
  ["quantity"],
);
schemas.CartCheckout = object(
  {
    items: { type: "array", minItems: 1, maxItems: 30, items: ref("CartLine") },
    quoteVersion: { type: "string", pattern: "^[a-f0-9]{64}$" },
    idempotencyKey: { type: "string", minLength: 16, maxLength: 128 },
    card: ref("DemoCard"),
  },
  ["items", "quoteVersion", "idempotencyKey", "card"],
);
const buildQuantities = {
  type: "object",
  additionalProperties: { type: "integer", minimum: 1, maximum: 16 },
  description:
    "Unidades de compra por ID da RAM/armazenamento. Cada kit ocupa hardware.modules × quantidade; omitir significa 1.",
};
for (const schema of [schemas.BuildInput, schemas.SaveBuild])
  Object.assign(schema.properties, {
    quantities: buildQuantities,
    storageIds: {
      type: "array",
      maxItems: 15,
      uniqueItems: true,
      items: id,
      description:
        "Outros modelos de armazenamento, além de partIds.storage. Até 16 unidades totais.",
    },
  });
const optional = ({ required, ...schema }) => schema;
schemas.ComponentUpdate = optional(schemas.Component);
schemas.GameUpdate = optional(schemas.Game);
schemas.Component.properties.model3d = object(
  {
    url: { type: "string", pattern: "^/models/[a-z0-9-]+\\.glb$" },
    caption: { type: "string", minLength: 20, maxLength: 600 },
    hasRgb: { type: "boolean" },
  },
  ["url", "caption", "hasRgb"],
);
schemas.Checkout.properties.quoteVersion = {
  type: "string",
  pattern: "^[a-f0-9]{64}$",
};
schemas.Checkout.required.push("quoteVersion");
schemas.StockMovement = object(
  {
    type: { type: "string", enum: ["entry", "exit", "count", "settings"] },
    quantity: { type: "integer", minimum: 0, maximum: 1000000 },
    unitPriceCents: { type: "integer", minimum: 1, maximum: 1000000000 },
    reorderPoint: { type: "integer", minimum: 0, maximum: 1000000 },
    expectedVersion: { type: "integer", minimum: 0 },
    reason: { type: "string", minLength: 3, maxLength: 200 },
    idempotencyKey: { type: "string", pattern: "^[a-zA-Z0-9_-]{16,128}$" },
  },
  [
    "type",
    "quantity",
    "unitPriceCents",
    "reorderPoint",
    "expectedVersion",
    "reason",
    "idempotencyKey",
  ],
);

// ---------------------------------------------------------------------------
// Schemas de resposta (formato real devolvido pelos controllers)
// ---------------------------------------------------------------------------
schemas.Health = object(
  {
    service: { type: "string", enum: ["dreambuild-api"] },
    version: string,
    database: {
      type: "string",
      enum: ["not-checked", "not-configured"],
      description:
        "Indica só se há credenciais configuradas; a rota não consulta o Firestore.",
    },
  },
  ["service", "version", "database"],
);
schemas.PublicUser = object(
  {
    id: string,
    name: string,
    email: { type: "string", format: "email" },
    role: { type: "string", enum: ["CLIENT", "ADMIN"] },
    preferences: { type: "object" },
    googleLinked: { type: "boolean" },
  },
  ["id", "name", "email", "role", "googleLinked"],
);
schemas.Session = object(
  {
    user: { ...ref("PublicUser"), nullable: true },
    csrfToken: {
      type: "string",
      nullable: true,
      description:
        "Enviar no cabeçalho X-CSRF-Token em toda requisição que altera dados.",
    },
  },
  ["user", "csrfToken"],
);
schemas.PageMeta = object(
  {
    limit: { type: "integer", minimum: 1, maximum: 100 },
    nextCursor: {
      type: "string",
      nullable: true,
      description: "Passe em ?cursor= para a próxima página; null no fim.",
    },
    source: {
      type: "string",
      description:
        "curated-local quando o banco excedeu a cota e a cópia local verificada foi usada.",
    },
  },
  ["limit", "nextCursor"],
);
schemas.CartItem = object(
  {
    componentId: id,
    quantity: { type: "integer", minimum: 1, maximum: 10 },
    component: { ...ref("Component"), nullable: true },
    unavailable: { type: "boolean" },
    unavailableReason: {
      type: "string",
      nullable: true,
      enum: ["missing", "unconfigured", "insufficient", null],
    },
    stockQuantity: { type: "integer", minimum: 0 },
    unitPriceCents: { type: "integer", nullable: true },
    lineTotalCents: { type: "integer", nullable: true },
  },
  [
    "componentId",
    "quantity",
    "component",
    "unavailable",
    "unitPriceCents",
    "lineTotalCents",
  ],
);
schemas.CartSummary = object(
  {
    items: { type: "array", items: ref("CartItem") },
    quoteVersion: {
      type: "string",
      pattern: "^[a-f0-9]{64}$",
      description: "Hash da cotação; deve ser reenviado no checkout.",
    },
    itemCount: { type: "integer", minimum: 0 },
    totalCents: {
      type: "integer",
      nullable: true,
      description: "Null quando há item indisponível.",
    },
    knownSubtotalCents: { type: "integer" },
    hasMissingProducts: { type: "boolean" },
    hasUnavailableProducts: { type: "boolean" },
    comparison: {
      type: "object",
      description:
        "Referência externa por loja, separada do total do estoque próprio DreamBuild.",
    },
  },
  [
    "items",
    "quoteVersion",
    "itemCount",
    "totalCents",
    "knownSubtotalCents",
    "hasMissingProducts",
    "hasUnavailableProducts",
  ],
);
schemas.IssuedDemoCard = {
  ...object(
    {
      ...schemas.DemoCard.properties,
      holderName: string,
      simulated: { type: "boolean", enum: [true] },
    },
    [...(schemas.DemoCard.required || []), "holderName", "simulated"],
  ),
  description:
    "Cartão fictício assinado para o usuário, válido por 10 minutos. Prefixo 000000, sem valor bancário.",
};
schemas.OrderLine = object(
  {
    componentId: id,
    quantity: { type: "integer" },
    unitPriceCents: { type: "integer" },
    lineTotalCents: { type: "integer" },
  },
  ["componentId", "quantity", "unitPriceCents", "lineTotalCents"],
);
schemas.Order = object(
  {
    id: string,
    userId: string,
    kind: { type: "string", enum: ["cart", "dream"] },
    buildId: { type: "string", nullable: true },
    buildName: string,
    simulated: { type: "boolean", enum: [true] },
    approvalCode: { type: "string", pattern: "^[A-F0-9]{10}$" },
    totalCents: { type: "integer", nullable: true },
    lines: { type: "array", items: ref("OrderLine") },
    fakeCardDetails: object({
      maskedNumber: string,
      holderName: string,
      label: string,
    }),
    buildSnapshot: {
      type: "object",
      description:
        "Fotografia imutável das peças e preços no momento da compra.",
    },
    createdAt: { type: "string", format: "date-time" },
  },
  ["id", "kind", "buildName", "simulated", "totalCents", "createdAt"],
);
schemas.DeletedId = object({ id }, ["id"]);
schemas.ApiError = {
  ...object(
    {
      status: { type: "string", enum: ["error"] },
      message: { type: "string", description: "Mensagem pronta para exibir." },
      data: { nullable: true, enum: [null] },
      errors: {
        type: "array",
        items: object({ code: string, field: string }),
      },
      meta: { type: "object" },
    },
    ["status", "message", "data", "errors", "meta"],
  ),
  description:
    "Toda falha usa este envelope. Nenhuma resposta inclui stack trace ou detalhes do banco.",
};

// ---------------------------------------------------------------------------
// Exemplos (dados de demonstração; nunca use dados reais)
// ---------------------------------------------------------------------------
Object.assign(schemas.Registration, {
  example: {
    name: "Ana Souza",
    email: "ana@exemplo.com",
    password: "senha-de-exemplo-123",
  },
});
Object.assign(schemas.Login, {
  example: { email: "ana@exemplo.com", password: "senha-de-exemplo-123" },
});
Object.assign(schemas.CartQuantity, { example: { quantity: 2 } });
Object.assign(schemas.CartCheckout, {
  example: {
    items: [{ componentId: "kabum-105015", quantity: 1 }],
    quoteVersion: "a".repeat(64),
    idempotencyKey: "pedido-2026-10-31-0001",
    card: {
      number: "0000003242448722",
      cvv: "498",
      validUntil: 1793495971898,
      token: "token-assinado-devolvido-por-/orders/card",
    },
  },
});
Object.assign(schemas.Game, {
  example: {
    id: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    weight: 1.25,
    coverUrl: "/games/cyberpunk-2077-cover.jpg",
    screenshotUrl: "/games/cyberpunk-2077-scene.jpg",
    sourceUrl: "https://store.steampowered.com/app/1091500/",
  },
});
Object.assign(schemas.GameUpdate, { example: { weight: 1.4 } });
Object.assign(schemas.ComponentUpdate, {
  example: {
    name: "SSD Adata SU650, 240GB",
    offers: [
      {
        store: "kabum",
        paymentMethod: "pix",
        availability: "in_stock",
        priceCents: 35999,
        sourceUrl:
          "https://www.kabum.com.br/produto/105015/ssd-adata-su650-240gb-2-5-sata-iii-leitura-520-mb-s-gravacao-450-mb-s-preto-asu650ss-240gt-r",
        checkedAt: "2026-10-30T21:07:23.165Z",
      },
    ],
  },
});
Object.assign(schemas.BuildInput, {
  example: {
    partIds: {
      cpu: "kabum-102248",
      ram: "kabum-1029658",
      gpu: "kabum-1000741",
    },
    paymentMethod: "pix",
  },
});
Object.assign(schemas.SaveBuild, {
  example: {
    name: "Meu PC de entrada",
    partIds: { cpu: "kabum-102248", ram: "kabum-1029658" },
  },
});

// Exemplo extraído de data/publicCatalogSnapshot.json (produto real do catálogo).
const componentExample = {
  id: "kabum-105015",
  slug: "kabum-105015",
  category: "storage",
  categoryName: "Armazenamento",
  brand: "Adata",
  name: "SSD Adata SU650, 240GB",
  fullName:
    'SSD Adata SU650, 240GB, 2.5", SATA III, Leitura: 520 MB/s, Gravação: 450 MB/s, Preto - ASU650SS-240GT-R',
  model: "ASU650SS-240GT-R",
  image: "/hardware/expanded/kabum-105015-availability-1.jpg",
  gallery: [
    {
      src: "/hardware/expanded/kabum-105015-availability-1.jpg",
      alt: 'SSD Adata SU650, 240GB, 2.5", SATA III, Leitura: 520 MB/s, Gravação: 450 MB/s, Preto - ASU650SS-240GT-R — foto publicada pela loja',
    },
  ],
  description:
    "SSD Adata SU650, 240GB. Variante anunciada: ASU650SS-240GT-R. Consulte a ficha, os requisitos e as condições da oferta para o seu conjunto.",
  highlights: ["Armazenamento", "Adata"],
  specifications: [
    ["Marca", "Adata"],
    ["Modelo anunciado", "ASU650SS-240GT-R"],
    ["Código na loja", "105015"],
  ],
  compatibilityNote:
    "Dados não publicados nesta ficha precisam de conferência no manual. Disponibilidade para compra não certifica compatibilidade com o conjunto.",
  manufacturerUrl:
    "https://www.kabum.com.br/produto/105015/ssd-adata-su650-240gb-2-5-sata-iii-leitura-520-mb-s-gravacao-450-mb-s-preto-asu650ss-240gt-r",
  offers: [
    {
      store: "kabum",
      paymentMethod: "pix",
      availability: "in_stock",
      priceCents: 35999,
      sourceUrl:
        "https://www.kabum.com.br/produto/105015/ssd-adata-su650-240gb-2-5-sata-iii-leitura-520-mb-s-gravacao-450-mb-s-preto-asu650ss-240gt-r",
      checkedAt: "2026-10-30T21:07:23.165Z",
    },
  ],
};
schemas.Component.example = componentExample;
schemas.PublicUser.example = {
  id: "u-123",
  name: "Ana Souza",
  email: "ana@exemplo.com",
  role: "CLIENT",
  preferences: {},
  googleLinked: false,
};
schemas.Session.example = {
  user: schemas.PublicUser.example,
  csrfToken: "Q3sR0x9kP2vL7mN4tY8wZ1aB6cD5eF0gH",
};
schemas.Health.example = {
  service: "dreambuild-api",
  version: "0.1.0",
  database: "not-checked",
};
schemas.PageMeta.example = { limit: 20, nextCursor: null };
schemas.CartSummary.example = {
  items: [
    {
      componentId: "kabum-105015",
      quantity: 2,
      component: componentExample,
      unavailable: false,
      unitPriceCents: 35999,
      lineTotalCents: 71998,
    },
  ],
  quoteVersion:
    "3f9a1c0e7b2d4a6f8e1c3b5d7f9a2c4e6b8d0f1a3c5e7b9d1f3a5c7e9b1d3f5a",
  itemCount: 2,
  totalCents: 71998,
  knownSubtotalCents: 71998,
  hasMissingProducts: false,
  hasUnavailableProducts: false,
};
schemas.IssuedDemoCard.example = {
  number: "0000003242448722",
  cvv: "498",
  holderName: "Ana Souza",
  validUntil: 1793495971898,
  simulated: true,
  token: "fe1e340650cf48dadd7c267b095185a0447c80a714985a9845ed50f73c924a7a",
};
schemas.Order.example = {
  id: "8f14e45f-ceea-467f-a0e6-1b3b6f5c2e11",
  userId: "u-123",
  kind: "cart",
  buildId: null,
  buildName: "Pedido com 2 peças",
  simulated: true,
  approvalCode: "A1B2C3D4E5",
  totalCents: 71998,
  lines: [
    {
      componentId: "kabum-105015",
      quantity: 2,
      unitPriceCents: 35999,
      lineTotalCents: 71998,
    },
  ],
  fakeCardDetails: {
    maskedNumber: "0000 **** **** 8722",
    holderName: "Ana Souza",
    label: "DREAMBUILD DEMO — SEM VALOR BANCÁRIO",
  },
  buildSnapshot: { kind: "cart", itemCount: 2, parts: [] },
  createdAt: "2026-10-31T18:20:00.000Z",
};
schemas.DeletedId.example = { id: "kabum-105015" };

const errorExamples = {
  400: "Informe um e-mail válido.",
  401: "Entre na sua conta para continuar.",
  403: "Acesso permitido somente a administradores.",
  404: "Recurso não encontrado.",
  409: "Os preços ou a disponibilidade mudaram. Volte ao carrinho e revise a cotação atual.",
  413: "Corpo da requisição muito grande.",
  429: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
  500: "Erro interno do servidor.",
  503: "O banco atingiu um limite temporário de consultas. Tente novamente quando a cota for renovada.",
};
const errorBody = (code, message) => ({
  status: "error",
  message,
  data: null,
  errors: [],
  meta: {},
  ...(code === "403-csrf" ? { errors: [{ code: "CSRF_INVALID" }] } : {}),
});

/**
 * Registra uma operação.
 * - errors: erros específicos da regra de negócio, { código: descrição }.
 * - Automáticos: 401/403 em rotas autenticadas, 403 CSRF em alterações,
 *   400/413 com corpo, 400 com {id} na rota, 503 quando consulta o banco e 500.
 * - data: schema do campo data da resposta de sucesso.
 */
function endpoint(
  path,
  method,
  tag,
  summary,
  {
    body,
    parameters = [],
    auth = false,
    admin = false,
    created = false,
    description = "",
    errors = {},
    data,
    paged = false,
    db = true,
    success = created ? "Criado" : "Sucesso",
  } = {},
) {
  const mutation = !["get", "head"].includes(method);
  const hasId = parameters.some((p) => p.in === "path");
  const hasQuery = parameters.some((p) => p.in === "query");
  const codes = {};
  const add = (code, text) => {
    codes[code] = codes[code] ? `${codes[code]}; ${text}` : text;
  };
  if (body) add(400, "Dados inválidos ou JSON malformado");
  if (hasId) add(400, "Identificador inválido (use letras, números, - ou _)");
  if (hasQuery && !body) add(400, "Parâmetros de consulta inválidos");
  if (auth || admin)
    add(401, "Sem sessão, sessão expirada ou conta desativada");
  if (admin) add(403, "Perfil sem permissão (exige ADMIN)");
  if (mutation)
    add(403, "Token CSRF ausente ou inválido (errors[0].code = CSRF_INVALID)");
  for (const [code, text] of Object.entries(errors)) add(code, text);
  if (body) add(413, "Corpo maior que 100 kB");
  if (db) add(503, "Banco indisponível ou cota temporariamente excedida");
  add(500, "Erro interno");

  const successSchema = data
    ? {
        allOf: [
          ref("Envelope"),
          object({
            status: { type: "string", enum: ["success"] },
            data,
            ...(paged ? { meta: ref("PageMeta") } : {}),
          }),
        ],
      }
    : ref("Envelope");
  const exampleOf = (schema) => {
    if (!schema) return undefined;
    if (schema.$ref) return schemas[schema.$ref.split("/").pop()]?.example;
    if (schema.type === "array") {
      const item = exampleOf(schema.items);
      return item === undefined ? undefined : [item];
    }
    return schema.example;
  };
  const dataExample = exampleOf(data);
  const responses = {
    [created ? 201 : 200]: {
      description: success,
      content: {
        "application/json": {
          schema: successSchema,
          ...(dataExample !== undefined
            ? {
                example: {
                  status: "success",
                  message: summary + ".",
                  data: dataExample,
                  errors: [],
                  meta: paged ? schemas.PageMeta.example : {},
                },
              }
            : {}),
        },
      },
    },
  };
  for (const [code, text] of Object.entries(codes).sort()) {
    const csrfOnly = code === "403" && mutation && !admin;
    responses[code] = {
      description: text,
      content: {
        "application/json": {
          schema: ref("ApiError"),
          example: errorBody(
            csrfOnly ? "403-csrf" : code,
            csrfOnly
              ? "Atualize a sessão e tente novamente."
              : errors[code]
                ? `${errors[code]}.`
                : errorExamples[code] || text,
          ),
        },
      },
    };
  }
  const access = admin
    ? "**Acesso:** somente ADMIN (sessão + CSRF)."
    : auth
      ? "**Acesso:** usuário autenticado; só enxerga os próprios registros."
      : mutation
        ? "**Acesso:** público, mas exige o token CSRF da sessão."
        : "**Acesso:** público.";
  (paths[path] ||= {})[method] = {
    tags: [tag],
    summary,
    description: [access, description].filter(Boolean).join("\n\n"),
    operationId: `${method}${path
      .replace(/^\/api/, "")
      .replace(/\{(\w+)\}/g, "By_$1")
      .split(/[/-]/)
      .filter(Boolean)
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join("")}`,
    parameters,
    responses,
    security:
      auth || admin
        ? [{ cookieAuth: [], ...(mutation ? { csrfToken: [] } : {}) }]
        : mutation
          ? [{ csrfToken: [] }]
          : [],
    ...(body
      ? {
          requestBody: {
            required: true,
            content: { "application/json": { schema: ref(body) } },
          },
        }
      : {}),
  };
}

// ---- Servidor e catálogo ---------------------------------------------------
endpoint(
  "/api/health",
  "get",
  "Servidor",
  "Saúde HTTP; não consulta Firestore",
  {
    data: ref("Health"),
    db: false,
  },
);
endpoint("/api/components", "get", "Catálogo", "Listar componentes", {
  parameters: [
    ...page,
    {
      in: "query",
      name: "category",
      schema: {
        type: "string",
        enum: [
          "all",
          "cpu",
          "gpu",
          "mobo",
          "ram",
          "storage",
          "psu",
          "case",
          "cooler",
        ],
      },
      description: "Aceita maiúsculas (CPU = cpu).",
    },
  ],
  data: { type: "array", items: ref("Component") },
  paged: true,
  description:
    "Paginação por cursor: repita a chamada com `cursor = meta.nextCursor` até receber `null`.",
});
endpoint("/api/components/{id}", "get", "Catálogo", "Consultar um componente", {
  parameters: [parameter],
  data: ref("Component"),
  errors: { 404: "Produto não encontrado" },
});
endpoint(
  "/api/systems",
  "get",
  "Catálogo",
  "Consultar PCs e notebooks para comparação",
  {
    description:
      "Preços, vendedor, consulta, estoque e referências identificadas. Cache público de 30 minutos; dados locais identificados durante cota excedida.",
  },
);

// ---- Conta ------------------------------------------------------------------
endpoint(
  "/api/auth/session",
  "get",
  "Conta",
  "Obter perfil público e token CSRF",
  {
    data: ref("Session"),
    description:
      "Primeira chamada de qualquer cliente: cria o cookie de sessão e devolve o `csrfToken`. `user` é `null` para visitantes.",
  },
);
endpoint(
  "/api/auth/register",
  "post",
  "Conta",
  "Cadastrar CLIENT e iniciar sessão",
  {
    body: "Registration",
    created: true,
    data: ref("Session"),
    errors: {
      409: "E-mail já cadastrado",
      429: "Limite de tentativas por IP (15 minutos)",
    },
    description:
      "O perfil enviado pelo cliente é ignorado; a conta é sempre CLIENT. A sessão é regenerada e um novo `csrfToken` é devolvido.",
  },
);
endpoint("/api/auth/login", "post", "Conta", "Entrar e renovar sessão", {
  body: "Login",
  data: ref("Session"),
  errors: {
    401: "E-mail ou senha incorretos (mesma mensagem para conta inexistente ou desativada)",
    429: "10 tentativas malsucedidas por IP em 15 minutos",
  },
  description:
    "O carrinho do visitante é preservado. Guarde o novo `csrfToken` da resposta: o anterior deixa de valer.",
});
endpoint(
  "/api/auth/logout",
  "post",
  "Conta",
  "Destruir sessão e encerrar conexões da sessão",
  { data: ref("Session"), db: false },
);
endpoint(
  "/api/auth/providers",
  "get",
  "Conta",
  "Consultar configuração pública do login Google",
  { db: false },
);
schemas.GoogleIdToken = object(
  { idToken: { type: "string", minLength: 100, maxLength: 15000 } },
  ["idToken"],
);
endpoint(
  "/api/auth/google",
  "post",
  "Conta",
  "Entrar com token Firebase Google verificado",
  {
    body: "GoogleIdToken",
    data: ref("Session"),
    errors: {
      401: "Token Google inválido ou conta Google sem e-mail verificado",
      403: "Conta desativada",
      409: "E-mail já usado por uma conta que exige vínculo autenticado",
      429: "Limite de tentativas",
    },
    description:
      "Valida provedor, assinatura, validade, revogação e e-mail verificado; renova a sessão HttpOnly. Não recebe senha Google.",
  },
);
endpoint(
  "/api/auth/google/link",
  "post",
  "Conta",
  "Vincular Google à conta já autenticada",
  {
    body: "GoogleIdToken",
    auth: true,
    data: ref("Session"),
    errors: {
      409: "E-mail do Google diferente do da conta, ou Google já vinculado a outro usuário",
      429: "Limite de tentativas",
    },
    description:
      "Mesmo e-mail verificado; vínculo explícito. Preserva o papel existente e rejeita vínculo de outro usuário.",
  },
);

// ---- Montagens ------------------------------------------------------------
endpoint(
  "/api/builds/draft",
  "get",
  "Montagens",
  "Recuperar rascunho do cookie assinado",
  { db: false },
);
endpoint(
  "/api/builds/analyze",
  "post",
  "Montagens",
  "Analisar IDs com dados atuais do banco",
  { body: "BuildInput" },
);
endpoint("/api/builds", "post", "Montagens", "Salvar montagem privada", {
  body: "SaveBuild",
  auth: true,
  created: true,
  errors: { 409: "Incompatibilidade crítica entre as peças" },
});
endpoint(
  "/api/builds/upgrade",
  "post",
  "Montagens",
  "Consultar alternativa baseada em índices didáticos",
  {
    body: "BuildInput",
    description:
      "Consulta até 100 alternativas e verifica compatibilidade. Não é recomendação de compra.",
  },
);
endpoint("/api/builds/my", "get", "Montagens", "Listar suas montagens", {
  auth: true,
  parameters: page,
  paged: true,
  data: { type: "array", items: { type: "object" } },
});
endpoint("/api/builds/{id}", "get", "Montagens", "Consultar sua montagem", {
  auth: true,
  parameters: [parameter],
  errors: { 404: "Montagem inexistente ou de outro usuário" },
});
endpoint(
  "/api/builds/{id}",
  "delete",
  "Montagens",
  "Remover sua montagem; preservar pedidos históricos",
  {
    auth: true,
    parameters: [parameter],
    errors: { 404: "Montagem inexistente ou de outro usuário" },
  },
);

// ---- Carrinho -------------------------------------------------------------
schemas.AddBuildToCart = object(
  {
    ...schemas.BuildInput.properties,
    idempotencyKey: { type: "string", pattern: "^[a-zA-Z0-9_-]{16,128}$" },
  },
  ["partIds", "idempotencyKey"],
);
endpoint(
  "/api/cart/build",
  "post",
  "Carrinho",
  "Adicionar uma montagem completa e compatível ao carrinho",
  {
    body: "AddBuildToCart",
    data: ref("CartSummary"),
    errors: {
      400: "Montagem incompleta, incompatível ou limite de quantidades excedido",
      409: "Saldo insuficiente ou chave repetida com outra configuração",
    },
    description:
      "Acrescenta as quantidades aos itens existentes e valida todo o carrinho antes de salvá-lo. Repetir a mesma chave/configuração não duplica a adição. Não reserva nem desconta estoque.",
  },
);
endpoint(
  "/api/cart",
  "get",
  "Carrinho",
  "Consultar itens, quantidades e cotação atual da sessão",
  {
    data: ref("CartSummary"),
    description:
      "Funciona para visitantes: o carrinho fica na sessão e é mantido ao entrar na conta.",
  },
);
endpoint(
  "/api/cart/items/{id}",
  "put",
  "Carrinho",
  "Definir quantidade de 1 a 10; exige oferta PIX disponível",
  {
    body: "CartQuantity",
    parameters: [parameter],
    data: ref("CartSummary"),
    errors: {
      400: "Quantidade fora de 1..10 ou mais de 30 modelos no carrinho",
      404: "Produto não encontrado",
      409: "Produto sem oferta PIX disponível",
    },
  },
);
endpoint(
  "/api/cart/items/{id}",
  "delete",
  "Carrinho",
  "Remover uma linha do carrinho",
  { parameters: [parameter], data: ref("CartSummary") },
);
endpoint("/api/cart", "delete", "Carrinho", "Esvaziar o carrinho da sessão", {
  data: ref("CartSummary"),
});

// ---- Pedidos --------------------------------------------------------------
endpoint(
  "/api/orders/card",
  "post",
  "Pedidos",
  "Gerar cartão fictício assinado, não bancário",
  {
    auth: true,
    data: ref("IssuedDemoCard"),
    db: false,
    description:
      "Passo 1 do checkout. Envie o objeto devolvido, sem alterar, no campo `card` do checkout.",
  },
);
endpoint(
  "/api/orders/checkout-cart",
  "post",
  "Pedidos",
  "Comprar uma ou várias peças em simulação",
  {
    body: "CartCheckout",
    auth: true,
    created: true,
    data: ref("Order"),
    success:
      "Pedido criado. Repetir a mesma `idempotencyKey` com os mesmos dados devolve 200 com o pedido original.",
    errors: {
      400: "Chave de idempotência inválida, carrinho vazio ou cartão adulterado/expirado",
      409: "Carrinho mudou, cotação desatualizada, produto removido/indisponível ou chave reutilizada com outros dados",
    },
    description:
      "Fluxo: `GET /api/cart` (guarde `quoteVersion`) → `POST /api/orders/card` → este endpoint. Não exige PC completo. Revalida quantidades, versão da cotação e disponibilidade; guarda snapshots e limpa o carrinho. Nenhum pagamento é realizado.",
  },
);
endpoint(
  "/api/orders/checkout-dream",
  "post",
  "Pedidos",
  "Registrar compra inteiramente simulada de uma montagem salva",
  {
    auth: true,
    body: "Checkout",
    created: true,
    data: ref("Order"),
    errors: {
      400: "Montagem incompleta ou incompatível, ou cartão adulterado/expirado",
      404: "Montagem inexistente ou de outro usuário",
      409: "Peça sem oferta disponível na modalidade ou chave reutilizada com outros dados",
    },
    description:
      "Revalida peças. Chave repetida com os mesmos dados retorna o pedido anterior. Não realiza pagamento.",
  },
);
endpoint("/api/orders/my", "get", "Pedidos", "Listar seus pedidos simulados", {
  auth: true,
  parameters: page,
  paged: true,
  data: { type: "array", items: ref("Order") },
});
endpoint(
  "/api/orders/{id}",
  "get",
  "Pedidos",
  "Consultar seu recibo e relatório imutáveis",
  {
    auth: true,
    parameters: [parameter],
    data: ref("Order"),
    errors: {
      404: "Pedido inexistente ou de outro usuário (não revela que existe)",
    },
  },
);

// ---- Administração --------------------------------------------------------
for (const [resource, model, label] of [
  ["components", "Component", "produto"],
  ["games", "Game", "cenário de jogo"],
]) {
  endpoint(
    `/api/admin/${resource}`,
    "post",
    "Administração",
    `Cadastrar ${label}`,
    {
      body: model,
      admin: true,
      created: true,
      data: ref(model),
      errors: { 409: `Já existe ${label} com este identificador` },
    },
  );
  endpoint(
    `/api/admin/${resource}/{id}`,
    "put",
    "Administração",
    `Atualizar ${label}`,
    {
      body: `${model}Update`,
      admin: true,
      parameters: [parameter],
      data: ref(model),
      errors: {
        400: "Tentativa de trocar o identificador/endereço, que é fixo",
        404: `${label[0].toUpperCase()}${label.slice(1)} não encontrado`,
      },
      description:
        "Envie só os campos que mudam; o restante é mantido. O identificador/endereço é fixo.",
    },
  );
  endpoint(
    `/api/admin/${resource}/{id}`,
    "delete",
    "Administração",
    `Remover ${label}`,
    {
      admin: true,
      parameters: [parameter],
      data: ref("DeletedId"),
      errors: {
        404: `${label[0].toUpperCase()}${label.slice(1)} não encontrado`,
      },
    },
  );
}
endpoint(
  "/api/admin/components/{id}",
  "patch",
  "Administração",
  "Atualizar campos do produto (igual ao PUT)",
  {
    body: "ComponentUpdate",
    admin: true,
    parameters: [parameter],
    data: ref("Component"),
    errors: {
      400: "Tentativa de trocar o endereço, que é fixo",
      404: "Produto não encontrado",
    },
  },
);
endpoint(
  "/api/admin/metrics",
  "get",
  "Administração",
  "Contagens globais sem expor dados pessoais",
  { admin: true },
);

// ---- Simulação ------------------------------------------------------------
endpoint("/api/games", "get", "Simulação", "Listar cenários didáticos", {
  parameters: page,
  paged: true,
  data: { type: "array", items: ref("Game") },
});
endpoint(
  "/api/builds/{id}/performance",
  "get",
  "Simulação",
  "Consultar estimativa experimental do seu PC",
  {
    auth: true,
    parameters: [
      parameter,
      {
        in: "query",
        name: "resolution",
        schema: { type: "string", enum: ["1080p", "1440p"], default: "1080p" },
      },
    ],
    errors: {
      404: "Montagem inexistente ou de outro usuário",
      409: "Montagem com incompatibilidades",
    },
    description:
      "Revalida montagem no banco. Cobertura limitada por versão; modelo desconhecido fica sem FPS. Não é medição do computador.",
  },
);
endpoint(
  "/api/benchmarks",
  "get",
  "Simulação",
  "Consultar base pública de referências gráficas",
  {
    description:
      "19 GPUs, 12 jogos, 456 FPS publicados; preserva resolução, VRAM, preset, fontes e PC de teste. Não são medições do PC do visitante.",
  },
);

// ---- Comunidade -----------------------------------------------------------
schemas.CommunityPublication = object(
  {
    buildId: id,
    nickname: { type: "string", minLength: 2, maxLength: 30 },
    title: { type: "string", minLength: 2, maxLength: 60 },
    consent: { type: "boolean", enum: [true] },
    previewHash: { type: "string", pattern: "^[a-f0-9]{64}$" },
  },
  ["buildId", "nickname", "title", "consent", "previewHash"],
);
schemas.CommunityPublication.additionalProperties = false;
endpoint(
  "/api/community/ranking",
  "get",
  "Comunidade",
  "Consultar classificação pública de estimativas",
  {
    parameters: [
      {
        in: "query",
        name: "resolution",
        schema: { type: "string", enum: ["1080p", "1440p"], default: "1080p" },
      },
      {
        in: "query",
        name: "sort",
        schema: {
          type: "string",
          enum: ["performance", "value"],
          default: "performance",
        },
      },
      {
        in: "query",
        name: "limit",
        schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
      },
    ],
    description:
      "Mesmos 10 jogos e versão da base. Custo-benefício exige cotação PIX completa; limite 50. Cache compartilhado de 10 minutos, invalidado por publicação/remoção; recuo de 5 minutos em cota excedida. Não lê sessão.",
  },
);
endpoint(
  "/api/community/gallery",
  "get",
  "Comunidade",
  "Consultar as 20 publicações mais recentes",
);
endpoint(
  "/api/community/builds/{id}",
  "get",
  "Comunidade",
  "Consultar ficha pública sem dados da conta",
  { parameters: [parameter], errors: { 404: "Publicação não encontrada" } },
);
endpoint(
  "/api/community/preview/{id}",
  "get",
  "Comunidade",
  "Preparar prévia privada da própria montagem",
  {
    auth: true,
    parameters: [parameter],
    errors: {
      404: "Montagem inexistente ou de outro usuário",
      409: "Montagem incompatível; conclua uma montagem compatível antes de publicar",
    },
    description:
      "Revalida peças e cotações atuais; retorna previewHash. Não publica nada.",
  },
);
endpoint(
  "/api/community/builds",
  "post",
  "Comunidade",
  "Publicar ou atualizar voluntariamente a própria montagem",
  {
    auth: true,
    body: "CommunityPublication",
    created: true,
    errors: {
      404: "Montagem inexistente ou de outro usuário",
      409: "A prévia mudou desde a consulta; gere outra prévia",
      429: "12 publicações a cada 15 minutos",
    },
    description:
      "Exige CSRF, consentimento, apelido e título públicos; rejeita FPS/preços fornecidos pelo cliente. A publicação sem cobertura fica na galeria, sem posição; republicar a mesma montagem atualiza o mesmo ID.",
  },
);
endpoint(
  "/api/community/my",
  "get",
  "Comunidade",
  "Listar as próprias publicações com paginação",
  {
    auth: true,
    parameters: page,
    paged: true,
    data: { type: "array", items: { type: "object" } },
  },
);
endpoint(
  "/api/community/builds/{id}",
  "delete",
  "Comunidade",
  "Retirar a própria publicação e suas classificações",
  {
    auth: true,
    parameters: [parameter],
    errors: { 404: "Publicação inexistente ou de outro usuário" },
    description: "Transação atômica; preserva montagem privada.",
  },
);
endpoint(
  "/api/inventory",
  "get",
  "Estoque",
  "Consultar saldo e preço público da DreamBuild",
  {
    parameters: page,
    data: { type: "array", items: { type: "object" } },
    description:
      "Estoque acadêmico próprio, separado das ofertas externas. Não expõe histórico ou responsáveis.",
  },
);
endpoint(
  "/api/admin/inventory",
  "get",
  "Estoque",
  "Listar estoque com versões e limites de alerta",
  {
    admin: true,
    parameters: page,
    data: { type: "array", items: { type: "object" } },
  },
);
endpoint(
  "/api/admin/inventory/{id}",
  "get",
  "Estoque",
  "Consultar saldo e últimas 20 movimentações",
  { admin: true, parameters: [parameter] },
);
endpoint(
  "/api/admin/inventory/{id}/movements",
  "post",
  "Estoque",
  "Receber, dar baixa, contar ou configurar produto",
  {
    admin: true,
    parameters: [parameter],
    body: "StockMovement",
    errors: {
      404: "Produto inexistente",
      409: "Versão desatualizada, saldo insuficiente ou chave repetida com dados diferentes",
    },
    description:
      "Quantidade positiva para entry/exit; count define saldo final; settings usa quantidade zero. A versão impede sobrescrever movimentação concorrente. A chave permite repetir sem duplicação.",
  },
);

schemas.Address = object(
  Object.fromEntries(
    [
      "label",
      "recipient",
      "postalCode",
      "street",
      "number",
      "complement",
      "district",
      "city",
      "state",
    ].map((key) => [key, { type: "string", maxLength: 100 }]),
  ),
  [
    "label",
    "recipient",
    "postalCode",
    "street",
    "number",
    "district",
    "city",
    "state",
  ],
);
schemas.SavedAddress = object({
  ...schemas.Address.properties,
  id,
  isDefault: { type: "boolean" },
});
schemas.Delivery = object(
  {
    address: ref("Address"),
    method: { type: "string", enum: ["economy", "express"] },
  },
  ["address", "method"],
);
schemas.Checkout.properties.delivery = ref("Delivery");
schemas.CartCheckout.properties.delivery = ref("Delivery");
schemas.DemoCard.properties.expiry = {
  type: "string",
  pattern: "^[0-9]{2}/[0-9]{2}$",
};
schemas.Order.properties.delivery = {
  nullable: true,
  allOf: [ref("Delivery")],
  description:
    "Snapshot privado do endereço e entrega simulada; preço calculado pelo servidor.",
};
schemas.Order.properties.subtotalCents = { type: "integer", minimum: 0 };
const addressList = { type: "array", items: ref("SavedAddress") };
endpoint(
  "/api/account/addresses",
  "get",
  "Conta",
  "Listar os próprios endereços de demonstração",
  { auth: true, data: addressList },
);
endpoint(
  "/api/account/addresses",
  "post",
  "Conta",
  "Salvar endereço de demonstração (até cinco)",
  { auth: true, body: "Address", data: addressList },
);
endpoint(
  "/api/account/addresses/{id}",
  "put",
  "Conta",
  "Editar o próprio endereço",
  {
    auth: true,
    body: "Address",
    parameters: [parameter],
    data: addressList,
    errors: { 404: "Endereço não pertence à conta" },
  },
);
endpoint(
  "/api/account/addresses/{id}",
  "delete",
  "Conta",
  "Excluir o próprio endereço salvo",
  {
    auth: true,
    parameters: [parameter],
    data: addressList,
    errors: { 404: "Endereço não pertence à conta" },
  },
);
endpoint(
  "/api/account/addresses/{id}/default",
  "put",
  "Conta",
  "Definir endereço padrão",
  {
    auth: true,
    parameters: [parameter],
    data: addressList,
    errors: { 404: "Endereço não pertence à conta" },
  },
);

const guide = `Projeto acadêmico de Breno Dantas e Kaio Marques. React → Controller/Model → DAO → Firestore. **Compras e telemetria são simuladas; use apenas dados de demonstração.**

### Como testar por esta página
1. **Conta → \`GET /api/auth/session\`** → *Try it out* → *Execute*. Cria o cookie de sessão (\`dreambuild.sid\`, HttpOnly) e devolve o \`csrfToken\`.
2. **Conta → \`POST /api/auth/login\`** com uma conta de teste (ou \`/api/auth/register\` para criar uma CLIENT).
3. Chame as demais rotas. Esta interface busca o token CSRF sozinha antes de cada alteração (POST, PUT, PATCH, DELETE), então não é preciso preencher o cabeçalho.

### Perfis de acesso
| Perfil | Rotas públicas | Rotas da própria conta | \`/api/admin/*\` |
|---|---|---|---|
| Visitante | ✔ | 401 | 401 |
| CLIENT | ✔ | ✔ (só os próprios registros) | 403 |
| ADMIN | ✔ | ✔ | ✔ |

### Convenções
- **Envelope:** toda resposta é \`{ status, message, data, errors, meta }\`; erros usam \`status: "error"\` e \`data: null\`, sem stack trace.
- **CSRF:** alterações exigem o cabeçalho \`X-CSRF-Token\`. Token ausente ou inválido → 403 com \`errors[0].code = "CSRF_INVALID"\`. Após login, cadastro ou logout o token muda.
- **Paginação:** \`?limit=1..100\` e \`?cursor=<meta.nextCursor>\`; \`nextCursor: null\` indica a última página.
- **Valores monetários:** sempre em centavos inteiros (\`39999\` = R$ 399,99).
- **Limites:** login e cadastro aceitam 10 falhas por IP a cada 15 min (depois 429); corpo JSON até 100 kB (413).

Os códigos de status de cada operação seguem o comportamento verificado pela suíte de testes (\`backend/test/api/\`).`;

export const openapi = {
  // O carrinho não exige uma montagem completa nem executa regras de combinação.
  openapi: "3.0.3",
  info: {
    title: "DreamBuild PC API",
    version: "0.1.0",
    description: guide,
  },
  servers: [{ url: "/", description: "Mesmo endereço do site" }],
  tags: [
    ["Servidor", "Disponibilidade do serviço"],
    ["Catálogo", "Produtos públicos, paginação e PCs prontos"],
    ["Conta", "Sessão, cadastro, login, logout e Google"],
    [
      "Montagens",
      "Montador de PC: análise, compatibilidade e montagens salvas",
    ],
    ["Carrinho", "Carrinho na sessão (visitante ou conta)"],
    ["Pedidos", "Cartão fictício, compra simulada e histórico"],
    ["Simulação", "Cenários didáticos e estimativas de FPS"],
    ["Comunidade", "Publicação voluntária e ranking"],
    ["Estoque", "Saldo próprio e movimentações administrativas"],
    ["Administração", "CRUD de produtos e cenários (somente ADMIN)"],
  ].map(([name, description]) => ({ name, description })),
  paths,
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "dreambuild.sid",
        description:
          "Cookie HttpOnly criado por GET /api/auth/session e renovado no login.",
      },
      csrfToken: {
        type: "apiKey",
        in: "header",
        name: "X-CSRF-Token",
        description: "Valor de data.csrfToken devolvido por /api/auth/session.",
      },
    },
    schemas,
  },
  "x-websocket-events": {
    transport: "Socket.IO sobre WebSocket, mesma sessão e origem permitida",
    authentication: "Cookie HttpOnly + auth.csrfToken",
    client: ["bench:start", "bench:stop"],
    server: ["bench:sample", "bench:state", "catalog:updated"],
    limits:
      "1 teste por usuário; amostra nominal 500 ms; duração máxima 120 segundos; logout encerra conexões da sessão.",
  },
};
