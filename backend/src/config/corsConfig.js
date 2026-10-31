export function createCorsConfig(origins) {
  const allowedOrigins = new Set(
    origins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  return {
    // Não há wildcard: cada endereço da interface precisa ser autorizado.
    origin(origin, callback) {
      callback(null, Boolean(origin && allowedOrigins.has(origin)));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
    credentials: true,
    optionsSuccessStatus: 204,
  };
}
