const prefix = "dreambuild:assembly:v1:";
export const assemblyDraftKey = (userId) => prefix + (userId || "guest");

export function readAssemblyDraft(storage, key) {
  try {
    const draft = JSON.parse(storage.getItem(key));
    if (draft?.version !== 1 || !draft.partIds || Array.isArray(draft.partIds))
      return null;
    return draft;
  } catch {
    return null;
  }
}

export function writeAssemblyDraft(storage, key, draft) {
  try {
    storage.setItem(key, JSON.stringify({ ...draft, version: 1 }));
  } catch {
    // A bancada continua utilizável quando o navegador bloqueia armazenamento.
  }
}
