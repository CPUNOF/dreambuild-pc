import {
  FirebaseConfigurationError,
  getDatabase,
} from "../src/config/firebaseConfig.js";

let database;
try {
  database = getDatabase();
  console.log("Verificando leitura no Firestore do projeto configurado...");
  // Consulta real, sem criar ou alterar documentos. A coleção pode estar vazia.
  const result = await database.collection("components").limit(1).get();
  console.log(
    `Conexão e leitura confirmadas. Documentos retornados nesta consulta: ${result.size}.`,
  );
  console.log(
    "Esta verificação não substitui o cadastro e o teste de persistência do catálogo.",
  );
} catch (error) {
  console.error(
    error instanceof FirebaseConfigurationError
      ? error.message
      : "Não foi possível ler o Firestore. Confira o projeto, a conta de serviço, a conexão e se o banco padrão foi criado.",
  );
  process.exitCode = 1;
} finally {
  if (database) await database.terminate();
}
