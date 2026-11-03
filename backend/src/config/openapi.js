const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const object = (properties, required = []) => ({
  type: "object",
  properties,
  required,
});
const string = { type: "string" };
const id = { type: "string", pattern: "^[a-zA-Z0-9_-]{1,128}$" };
const page = [
  {
    in: "query",
    name: "limit",
    schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
  { in: "query", name: "cursor", schema: id },
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
schemas.ComponentUpdate = { ...schemas.Component, required: [] };
schemas.GameUpdate = { ...schemas.Game, required: [] };
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
  } = {},
) {
  const mutation = !["get", "head"].includes(method);
  const codes = {
    200: "Sucesso",
    ...(created ? { 201: "Criado" } : {}),
    400: "Dados inválidos",
    ...(auth || admin
      ? {
          401: "Sessão necessária",
          403: "Permissão insuficiente ou CSRF inválido",
        }
      : mutation
        ? { 403: "CSRF inválido" }
        : {}),
    404: "Recurso não encontrado",
    409: "Conflito",
    429: "Limite de tentativas",
    500: "Erro interno",
    503: "Dependência indisponível",
  };
  const responses = Object.fromEntries(
    Object.entries(codes).map(([code, text]) => [
      code,
      {
        description: text,
        content: { "application/json": { schema: ref("Envelope") } },
      },
    ]),
  );
  (paths[path] ||= {})[method] = {
    tags: [tag],
    summary,
    description:
      (admin
        ? "Exclusivo ADMIN. "
        : auth
          ? "Somente o proprietário autenticado. "
          : "") + description,
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
endpoint(
  "/api/health",
  "get",
  "Servidor",
  "Saúde HTTP; não consulta Firestore",
);
endpoint("/api/components", "get", "Catálogo", "Listar componentes", {
  parameters: [
    ...page,
    {
      in: "query",
      name: "category",
      schema: string,
      description:
        "cpu, gpu, mobo, ram, storage, psu, case ou cooler; aceita maiúsculas.",
    },
  ],
});
endpoint("/api/components/{id}", "get", "Catálogo", "Consultar um componente", {
  parameters: [parameter],
});
endpoint("/api/games", "get", "Simulação", "Listar cenários didáticos", {
  parameters: page,
});
endpoint(
  "/api/auth/session",
  "get",
  "Conta",
  "Obter perfil público e token CSRF",
);
endpoint(
  "/api/auth/register",
  "post",
  "Conta",
  "Cadastrar CLIENT e iniciar sessão",
  {
    body: "Registration",
    created: true,
    description: "O perfil enviado pelo cliente é ignorado; não concede ADMIN.",
  },
);
endpoint("/api/auth/login", "post", "Conta", "Entrar e renovar sessão", {
  body: "Login",
});
endpoint(
  "/api/auth/logout",
  "post",
  "Conta",
  "Destruir sessão e encerrar conexões da sessão",
);
endpoint(
  "/api/builds/draft",
  "get",
  "Montagens",
  "Recuperar rascunho do cookie assinado",
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
});
endpoint("/api/builds/{id}", "get", "Montagens", "Consultar sua montagem", {
  auth: true,
  parameters: [parameter],
});
endpoint(
  "/api/builds/{id}",
  "delete",
  "Montagens",
  "Remover sua montagem; preservar pedidos históricos",
  { auth: true, parameters: [parameter] },
);
endpoint(
  "/api/orders/card",
  "post",
  "Pedidos",
  "Gerar cartão fictício assinado, não bancário",
  { auth: true },
);
endpoint(
  "/api/orders/checkout-dream",
  "post",
  "Pedidos",
  "Registrar compra inteiramente simulada",
  {
    auth: true,
    body: "Checkout",
    created: true,
    description:
      "Revalida peças. Chave repetida com os mesmos dados retorna o pedido anterior; dados diferentes recebem 409. Não realiza pagamento.",
  },
);
endpoint("/api/orders/my", "get", "Pedidos", "Listar seus pedidos simulados", {
  auth: true,
  parameters: page,
});
endpoint(
  "/api/orders/{id}",
  "get",
  "Pedidos",
  "Consultar seu recibo e relatório imutáveis",
  { auth: true, parameters: [parameter] },
);
for (const [resource, model] of [
  ["components", "Component"],
  ["games", "Game"],
]) {
  endpoint(
    `/api/admin/${resource}`,
    "post",
    "Administração",
    `Cadastrar ${resource}`,
    { body: model, admin: true, created: true },
  );
  endpoint(
    `/api/admin/${resource}/{id}`,
    "put",
    "Administração",
    `Atualizar ${resource}`,
    {
      body: `${model}Update`,
      admin: true,
      parameters: [parameter],
      description:
        "Aceita campos atualizados; identificador/endereço já existente é fixo.",
    },
  );
  endpoint(
    `/api/admin/${resource}/{id}`,
    "delete",
    "Administração",
    `Remover ${resource}`,
    { admin: true, parameters: [parameter] },
  );
}
endpoint(
  "/api/admin/components/{id}",
  "patch",
  "Administração",
  "Atualizar campos do componente",
  { body: "ComponentUpdate", admin: true, parameters: [parameter] },
);
endpoint(
  "/api/admin/metrics",
  "get",
  "Administração",
  "Contagens globais sem expor dados pessoais",
  { admin: true },
);
endpoint(
  "/api/cart",
  "get",
  "Carrinho",
  "Consultar itens, quantidades e cotação atual da sessão",
);
endpoint(
  "/api/cart/items/{id}",
  "put",
  "Carrinho",
  "Definir quantidade de 1 a 10; exige oferta PIX disponível",
  { body: "CartQuantity", parameters: [parameter] },
);
endpoint(
  "/api/cart/items/{id}",
  "delete",
  "Carrinho",
  "Remover uma linha do carrinho",
  { parameters: [parameter] },
);
endpoint("/api/cart", "delete", "Carrinho", "Esvaziar o carrinho da sessão");
endpoint(
  "/api/orders/checkout-cart",
  "post",
  "Pedidos",
  "Comprar uma ou várias peças em simulação",
  {
    body: "CartCheckout",
    auth: true,
    created: true,
    description:
      "Não exige PC completo. Revalida quantidades, versão da cotação e disponibilidade. Produtos sem oferta PIX disponível são bloqueados com 409. Guarda snapshots e limpa o carrinho. A mesma chave não duplica o pedido.",
  },
);
schemas.GoogleIdToken = object(
  { idToken: { type: "string", minLength: 100, maxLength: 15000 } },
  ["idToken"],
);
endpoint(
  "/api/auth/providers",
  "get",
  "Conta",
  "Consultar configuração pública do login Google",
);
endpoint(
  "/api/auth/google",
  "post",
  "Conta",
  "Entrar com token Firebase Google verificado",
  {
    body: "GoogleIdToken",
    description:
      "Exige CSRF. Valida provedor, assinatura, validade, revogação e e-mail verificado; renova a sessão HttpOnly. Não recebe senha Google.",
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
    description:
      "Mesmo e-mail verificado; vínculo explícito. Preserva o papel existente e rejeita vínculo de outro usuário.",
  },
);
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
    description:
      "Revalida montagem no banco. Cobertura limitada por versão; modelo desconhecido fica sem FPS. Não é medição do computador.",
  },
);
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
  "/api/benchmarks",
  "get",
  "Simulação",
  "Consultar base pública de referências gráficas",
  {
    description:
      "19 GPUs, 12 jogos, 456 FPS publicados; preserva resolução, VRAM, preset, fontes e PC de teste. Não são medições do PC do visitante.",
  },
);
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
  { parameters: [parameter] },
);
endpoint(
  "/api/community/preview/{id}",
  "get",
  "Comunidade",
  "Preparar prévia privada da própria montagem",
  {
    auth: true,
    parameters: [parameter],
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
    description:
      "Exige CSRF, consentimento, apelido e título públicos; rejeita FPS/preços fornecidos pelo cliente. Retorna 409 se a prévia mudou. 12 tentativas/15 minutos. A publicação sem cobertura fica na galeria, sem posição; republicar a mesma montagem atualiza o mesmo ID.",
  },
);
endpoint(
  "/api/community/my",
  "get",
  "Comunidade",
  "Listar as próprias publicações com paginação",
  { auth: true, parameters: page },
);
endpoint(
  "/api/community/builds/{id}",
  "delete",
  "Comunidade",
  "Retirar a própria publicação e suas classificações",
  {
    auth: true,
    parameters: [parameter],
    description:
      "Transação atômica; preserva montagem privada. Outro usuário recebe 404.",
  },
);
endpoint(
  "/api/inventory",
  "get",
  "Estoque",
  "Consultar saldo e preço público da DreamBuild",
  {
    parameters: page,
    description:
      "Estoque acadêmico próprio, separado das ofertas externas. Não expõe histórico ou responsáveis.",
  },
);
endpoint(
  "/api/admin/inventory",
  "get",
  "Estoque",
  "Listar estoque com versões e limites de alerta",
  { admin: true, parameters: page },
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
    description:
      "Quantidade positiva para entry/exit; count define saldo final; settings usa quantidade zero. A versão impede sobrescrever movimentação concorrente. A chave permite repetir sem duplicação.",
  },
);
export const openapi = {
  // O carrinho não exige uma montagem completa nem executa regras de combinação.
  openapi: "3.0.3",
  info: {
    title: "DreamBuild PC API",
    version: "0.1.0",
    description:
      "Projeto acadêmico de Breno Dantas e Kaio Marques. React → Controller/Model → DAO → Firestore. Compras e telemetria são simuladas. Use dados de demonstração. A interface Swagger obtém CSRF antes das alterações; use /auth/login para a sessão.",
  },
  servers: [{ url: "/" }],
  tags: [
    "Servidor",
    "Catálogo",
    "Conta",
    "Montagens",
    "Carrinho",
    "Pedidos",
    "Simulação",
    "Comunidade",
    "Administração",
    "Estoque",
  ].map((name) => ({ name })),
  paths,
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "dreambuild.sid" },
      csrfToken: { type: "apiKey", in: "header", name: "X-CSRF-Token" },
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
