const apiUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
let csrfToken = null;
let sessionRequest = null;

export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export async function getSession() {
  if (!sessionRequest)
    sessionRequest = apiRequest("/auth/session").finally(() => {
      sessionRequest = null;
    });
  return sessionRequest;
}

export async function apiRequest(
  path,
  { method = "GET", body, signal, retryCsrf = true } = {},
) {
  const mutation = !["GET", "HEAD"].includes(method);
  if (mutation && !csrfToken) await getSession();
  const headers = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(mutation ? { "X-CSRF-Token": csrfToken } : {}),
  };
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers,
    credentials: "include",
    cache: "no-store",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
      : AbortSignal.timeout(20000),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError(
      "O servidor não respondeu como esperado.",
      response.status,
    );
  }
  if (!response.ok || result.status !== "success") {
    if (
      response.status === 403 &&
      result.errors?.some((error) => error.code === "CSRF_INVALID") &&
      retryCsrf
    ) {
      csrfToken = null;
      await getSession();
      return apiRequest(path, { method, body, signal, retryCsrf: false });
    }
    throw new ApiError(
      result.message || "Não foi possível concluir a solicitação.",
      response.status,
      result.errors,
    );
  }
  if (result.data && Object.hasOwn(result.data, "csrfToken"))
    csrfToken = result.data.csrfToken;
  return result.data;
}

const catalogStorageKey = "dreambuild.public-catalog.v2:" + apiUrl;
export function clearCatalogCache() {
  try {
    sessionStorage.removeItem(catalogStorageKey);
  } catch {
    /* Armazenamento opcional. */
  }
}
export async function getCatalog(signal, { force = false } = {}) {
  if (!force)
    try {
      const saved = JSON.parse(sessionStorage.getItem(catalogStorageKey));
      const age = Date.now() - saved.createdAt;
      if (
        age >= 0 &&
        age < 5 * 60 * 1000 &&
        Array.isArray(saved.items) &&
        saved.items.length
      ) {
        const items = saved.items;
        items.localSnapshot = saved.localSnapshot === true;
        return items;
      }
    } catch {
      /* Consultar API se o cache não estiver disponível. */
    }
  const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(15000)]);
  const products = [];
  const visited = new Set();
  let cursor = null;
  do {
    const params = new URLSearchParams({ limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`${apiUrl}/components?${params}`, {
      credentials: "include",
      signal: requestSignal,
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error("O catálogo está indisponível. Tente novamente.");
    const body = await response.json();
    if (
      body.status !== "success" ||
      !Array.isArray(body.data) ||
      !body.meta ||
      (body.meta.nextCursor !== null &&
        typeof body.meta.nextCursor !== "string")
    )
      throw new Error("Não foi possível carregar o catálogo.");
    products.push(...body.data);
    if (body.meta.source === "curated-local") products.localSnapshot = true;
    cursor = body.meta.nextCursor;
    if (cursor && visited.has(cursor))
      throw new Error("Não foi possível completar a consulta do catálogo.");
    if (cursor) visited.add(cursor);
  } while (cursor);
  products.sort(
    (a, b) =>
      (a.displayOrder ?? Number.MAX_SAFE_INTEGER) -
      (b.displayOrder ?? Number.MAX_SAFE_INTEGER),
  );
  try {
    sessionStorage.setItem(
      catalogStorageKey,
      JSON.stringify({
        createdAt: Date.now(),
        items: products,
        localSnapshot: products.localSnapshot === true,
      }),
    );
  } catch {
    /* A vitrine não depende do armazenamento local. */
  }
  return products;
}

export async function listRecords(path, signal) {
  const requestSignal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
    : AbortSignal.timeout(20000);
  const items = [];
  let cursor = null;
  const visited = new Set();
  do {
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const response = await fetch(`${apiUrl}${path}?${query}`, {
      credentials: "include",
      signal: requestSignal,
      cache: "no-store",
    });
    const body = await response.json();
    if (!response.ok || body.status !== "success")
      throw new ApiError(
        body.message || "Não foi possível consultar seus registros.",
        response.status,
      );
    if (!Array.isArray(body.data) || !body.meta)
      throw new ApiError("Resposta de consulta inválida.", 502);
    items.push(...body.data);
    cursor = body.meta.nextCursor;
    if (cursor && visited.has(cursor))
      throw new ApiError("Não foi possível completar a consulta.", 502);
    if (cursor) visited.add(cursor);
  } while (cursor);
  return items.sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || ""),
  );
}

export async function getHealth(signal) {
  // O navegador só conversa com a API; não há conexão direta com o Firestore.
  const response = await fetch(`${apiUrl}/health`, {
    credentials: "include",
    signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("O serviço não respondeu como esperado.");
  const body = await response.json();
  if (body.status !== "success" || body.data?.service !== "dreambuild-api") {
    throw new Error("A resposta recebida não pertence ao serviço DreamBuild.");
  }
  return body.data;
}
