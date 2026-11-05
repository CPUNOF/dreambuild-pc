import { FieldPath } from "firebase-admin/firestore";
import { getDatabase } from "../config/firebaseConfig.js";
import { AppError } from "../errors/AppError.js";
import {
  communityId,
  publicPublication,
  rankingSummary,
} from "../models/CommunityBuild.js";
export class CommunityDAO {
  constructor(database = getDatabase) {
    this.database = database;
    this.cache = new Map();
    this.quotaUntil = 0;
  }
  async cached(key, loader) {
    const hit = this.cache.get(key);
    if (hit && Date.now() < hit.until) return hit.promise;
    if (Date.now() < this.quotaUntil)
      throw new AppError(
        503,
        "Ranking temporariamente indisponível: a cota gratuita do banco foi atingida. Tente novamente mais tarde.",
      );
    const promise = loader().catch((e) => {
      if (this.cache.get(key)?.promise === promise) this.cache.delete(key);
      if (e.code === 8) {
        this.quotaUntil = Date.now() + 300000;
        throw new AppError(
          503,
          "Ranking temporariamente indisponível: a cota gratuita do banco foi atingida. Nenhuma publicação foi inventada.",
        );
      }
      throw e;
    });
    if (this.cache.size >= 32)
      this.cache.delete(this.cache.keys().next().value);
    this.cache.set(key, { until: Date.now() + 600000, promise });
    return promise;
  }
  async get(id) {
    const snap = await this.database()
      .collection("public_builds")
      .doc(id)
      .get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  }
  async detail(id) {
    return this.cached("detail:" + id, async () =>
      publicPublication(await this.get(id)),
    );
  }
  async list({ version, resolution, sort, limit }) {
    return this.cached(
      JSON.stringify([version, resolution, sort, limit]),
      async () => {
        const field = sort === "value" ? "valueScore" : "averageFps";
        const result = await this.database()
          .collection("community_rankings")
          .doc(`${version}-${resolution}`)
          .collection("entries")
          .orderBy(field, "desc")
          .orderBy(FieldPath.documentId(), "desc")
          .limit(limit)
          .get();
        return result.docs.map((d) => ({ id: d.id, ...d.data() }));
      },
    );
  }
  async gallery(limit = 20) {
    return this.cached("gallery:" + limit, async () => {
      const r = await this.database()
        .collection("public_builds")
        .orderBy("public.publishedAt", "desc")
        .orderBy(FieldPath.documentId(), "desc")
        .limit(limit)
        .get();
      return r.docs.map((d) => publicPublication({ id: d.id, ...d.data() }));
    });
  }
  async mine(ownerId, { limit = 20, cursor = null } = {}) {
    let query = this.database()
      .collection("public_builds")
      .where("ownerId", "==", ownerId)
      .orderBy(FieldPath.documentId());
    if (cursor) query = query.startAfter(cursor);
    const r = await query.limit(limit + 1).get(),
      docs = r.docs.slice(0, limit);
    return {
      items: docs.map((d) => publicPublication({ id: d.id, ...d.data() })),
      nextCursor: r.docs.length > limit ? docs.at(-1).id : null,
    };
  }
  async publish(ownerId, buildId, record) {
    const db = this.database(),
      id = communityId(ownerId, buildId),
      root = db.collection("public_builds").doc(id),
      data = { ...record, id };
    await db.runTransaction(async (tx) => {
      const old = await tx.get(root);
      if (old.exists && old.data().ownerId !== ownerId)
        throw new AppError(404, "Publicação não encontrada.");
      const profiles = [];
      for (const resolution of ["1080p", "1440p"]) {
        const report = record.performance[resolution];
        if (!report.rankEligible) continue;
        const profile = `${record.version}-${resolution}`;
        profiles.push(profile);
        const row = {
          ...rankingSummary(data),
          resolution,
          averageFps: report.rankAverageFps,
          profileId: profile,
        };
        if (Number.isSafeInteger(record.priceCents) && record.priceCents > 0)
          row.valueScore = report.rankAverageFps / (record.priceCents / 100);
        tx.set(
          db
            .collection("community_rankings")
            .doc(profile)
            .collection("entries")
            .doc(id),
          row,
        );
      }
      for (const profile of old.data()?.profiles || [])
        if (!profiles.includes(profile))
          tx.delete(
            db
              .collection("community_rankings")
              .doc(profile)
              .collection("entries")
              .doc(id),
          );
      tx.set(root, { ownerId, buildId, profiles, public: data });
    });
    this.cache.clear();
    return data;
  }
  async demos({ limit = 20, cursor = null } = {}) {
    let query = this.database()
      .collection("public_builds")
      .where("public.demo", "==", true)
      .orderBy(FieldPath.documentId());
    if (cursor) query = query.startAfter(cursor);
    const result = await query.limit(limit + 1).get();
    const docs = result.docs.slice(0, limit);
    return {
      items: docs.map((d) => publicPublication({ id: d.id, ...d.data() })),
      nextCursor: result.docs.length > limit ? docs.at(-1).id : null,
    };
  }
  async remove(ownerId, id, { demoOnly = false } = {}) {
    const db = this.database(),
      root = db.collection("public_builds").doc(id);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(root);
      if (
        !snap.exists ||
        (demoOnly
          ? snap.data().public?.demo !== true
          : snap.data().ownerId !== ownerId)
      )
        throw new AppError(404, "Publicação não encontrada.");
      for (const profile of snap.data().profiles || [])
        tx.delete(
          db
            .collection("community_rankings")
            .doc(profile)
            .collection("entries")
            .doc(id),
        );
      tx.delete(root);
    });
    this.cache.clear();
  }
}
