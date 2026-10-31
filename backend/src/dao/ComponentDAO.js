import { FieldPath } from "firebase-admin/firestore";
import { getDatabase } from "../config/firebaseConfig.js";
import { Component } from "../models/Component.js";
import { AppError } from "../errors/AppError.js";
import { localCatalog } from "./PublicCatalogSnapshot.js";
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
const catalogLifetime = 30 * 60 * 1000;

export class ComponentDAO {
  constructor(database = getDatabase, { cacheFile, now = Date.now } = {}) {
    this.database = database;
    this.now = now;
    this.cacheFile =
      cacheFile === undefined && database === getDatabase
        ? fileURLToPath(
            new URL("../../.cache/public-catalog.json", import.meta.url),
          )
        : cacheFile || null;
    this.catalogGeneration = 0;
    this.catalogCache = new Map();
    this.quotaUntil = 0;
    if (this.cacheFile)
      try {
        const saved = JSON.parse(readFileSync(this.cacheFile, "utf8"));
        if (saved.format === 2 && Array.isArray(saved.entries))
          for (const entry of saved.entries.slice(-64)) {
            const age = this.now() - entry.createdAt;
            if (
              age >= 0 &&
              age < catalogLifetime &&
              Array.isArray(entry.result?.items) &&
              !entry.result.source
            )
              this.catalogCache.set(entry.key, {
                createdAt: entry.createdAt,
                ttl: catalogLifetime,
                result: entry.result,
                promise: Promise.resolve(entry.result),
              });
          }
      } catch {
        /* Cache ausente/inválido não substitui uma consulta ao banco. */
      }
  }
  invalidateCatalog() {
    this.quotaUntil = 0;
    this.catalogGeneration++;
    this.catalogCache.clear();
    if (this.cacheFile)
      try {
        unlinkSync(this.cacheFile);
      } catch {
        /* Sem arquivo de cache. */
      }
  }
  persistCatalog() {
    if (!this.cacheFile) return;
    try {
      const entries = [...this.catalogCache]
        .filter(([, v]) => v.result && !v.result.source)
        .map(([key, v]) => ({ key, createdAt: v.createdAt, result: v.result }));
      mkdirSync(dirname(this.cacheFile), { recursive: true });
      writeFileSync(this.cacheFile, JSON.stringify({ format: 2, entries }));
    } catch {
      /* O cache em memória continua válido se o disco estiver indisponível. */
    }
  }
  async getById(id) {
    const snapshot = await this.database()
      .collection("components")
      .doc(id)
      .get();
    return snapshot.exists ? new Component(snapshot.id, snapshot.data()) : null;
  }
  async getMany(ids) {
    if (!ids.length) return [];
    const database = this.database();
    const snapshots = await database.getAll(
      ...ids.map((id) => database.collection("components").doc(id)),
    );
    return snapshots.map((snapshot) =>
      snapshot.exists ? new Component(snapshot.id, snapshot.data()) : null,
    );
  }
  async create(document) {
    this.invalidateCatalog();
    const collection = this.database().collection("components");
    if (
      !(await collection.where("slug", "==", document.slug).limit(1).get())
        .empty
    )
      throw new AppError(409, "Este endereço de produto já está cadastrado.");
    try {
      await collection.doc(document.slug).create(document);
      this.invalidateCatalog();
    } catch (error) {
      if (error.code === 6 || error.code === "already-exists")
        throw new AppError(409, "Este produto já está cadastrado.");
      throw error;
    }
    return new Component(document.slug, document);
  }
  async update(id, document) {
    this.invalidateCatalog();
    try {
      await this.database().collection("components").doc(id).update(document);
      this.invalidateCatalog();
    } catch (error) {
      if (error.code === 5) throw new AppError(404, "Produto não encontrado.");
      throw error;
    }
    return new Component(id, document);
  }
  async delete(id) {
    this.invalidateCatalog();
    await this.database().collection("components").doc(id).delete();
    this.invalidateCatalog();
  }

  async list({ limit, cursor, category }) {
    const key = JSON.stringify([limit, cursor || null, category || null]);
    const cached = this.catalogCache.get(key);
    if (
      cached &&
      this.now() - cached.createdAt >= 0 &&
      this.now() - cached.createdAt < cached.ttl
    )
      return cached.promise;
    const generation = this.catalogGeneration;
    const promise = this.queryList({ limit, cursor, category })
      .then((result) => {
        if (
          this.catalogGeneration === generation &&
          this.catalogCache.get(key)?.promise === promise
        ) {
          const entry = this.catalogCache.get(key);
          entry.result = result;
          entry.ttl = result.source ? 300000 : catalogLifetime;
          this.persistCatalog();
        }
        return result;
      })
      .catch((error) => {
        if (this.catalogCache.get(key)?.promise === promise)
          this.catalogCache.delete(key);
        throw error;
      });
    if (this.catalogCache.size >= 64)
      this.catalogCache.delete(this.catalogCache.keys().next().value);
    this.catalogCache.set(key, {
      createdAt: this.now(),
      ttl: catalogLifetime,
      promise,
    });
    return promise;
  }
  async queryList({ limit, cursor, category }) {
    if (Date.now() < this.quotaUntil)
      return localCatalog({ limit, cursor, category });
    let query = this.database()
      .collection("components")
      .orderBy(FieldPath.documentId());
    if (category) query = query.where("category", "==", category);
    if (cursor) query = query.startAfter(cursor);
    let snapshot;
    try {
      snapshot = await query.limit(limit + 1).get();
    } catch (error) {
      if (error.code !== 8) throw error;
      this.quotaUntil = Date.now() + 300000;
      return localCatalog({ limit, cursor, category });
    }
    const documents = snapshot.docs.slice(0, limit);
    return {
      items: documents.map(
        (document) => new Component(document.id, document.data()),
      ),
      nextCursor: snapshot.docs.length > limit ? documents.at(-1).id : null,
    };
  }
}
