import { inventoryState } from "../../../shared/inventory.js";
const publicFields = [
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
  "technicalSource",
  "checkedAt",
  "displayOrder",
  "hardware",
  "offers",
  "simulationScore",
  "model3d",
  "sourceLabel",
];

export class Component {
  constructor(id, document) {
    // Firestore não armazena arrays diretamente dentro de arrays.
    document = {
      ...document,
      specifications: Array.isArray(document.specifications)
        ? document.specifications.map((row) => [row?.label, row?.value])
        : null,
    };
    const required = [
      "slug",
      "category",
      "categoryName",
      "brand",
      "name",
      "fullName",
      "model",
      "image",
      "description",
      "compatibilityNote",
      "manufacturerUrl",
    ];
    if (
      required.some(
        (field) =>
          typeof document[field] !== "string" || !document[field].trim(),
      ) ||
      !Array.isArray(document.gallery) ||
      !document.gallery.length ||
      document.gallery.some(
        (image) =>
          typeof image.src !== "string" || typeof image.alt !== "string",
      ) ||
      !Array.isArray(document.highlights) ||
      document.highlights.some((item) => typeof item !== "string") ||
      !Array.isArray(document.specifications) ||
      document.specifications.some(
        (row) =>
          !Array.isArray(row) ||
          row.length !== 2 ||
          row.some((value) => typeof value !== "string"),
      )
    ) {
      throw new Error("Documento de componente incompleto.");
    }
    this.id = id;
    this.inventory = inventoryState(document.inventory);
    // A resposta pública não replica automaticamente campos internos do banco.
    for (const field of publicFields) {
      if (document[field] !== undefined) this[field] = document[field];
    }
  }
}
