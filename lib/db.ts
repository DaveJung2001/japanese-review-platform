"use client";

import Dexie, { type Table } from "dexie";
import type { GrammarCard, StudyDeck, VocabCard } from "./types";

class JapaneseReviewDb extends Dexie {
  vocabulary!: Table<VocabCard, string>;
  grammar!: Table<GrammarCard, string>;

  constructor() {
    super("japanese-review-platform");
    this.version(1).stores({
      vocabulary: "id, type, sourceLabel, createdAt, updatedAt, srs.dueAt",
      grammar: "id, type, sourceLabel, createdAt, updatedAt, srs.dueAt"
    });
  }
}

export const db = new JapaneseReviewDb();

export async function loadDeck(): Promise<StudyDeck> {
  const [vocabulary, grammar] = await Promise.all([
    db.vocabulary.orderBy("createdAt").reverse().toArray(),
    db.grammar.orderBy("createdAt").reverse().toArray()
  ]);

  return { vocabulary, grammar };
}

export async function saveDeck(deck: StudyDeck): Promise<void> {
  await db.transaction("rw", db.vocabulary, db.grammar, async () => {
    await db.vocabulary.bulkPut(deck.vocabulary);
    await db.grammar.bulkPut(deck.grammar);
  });
}

export async function replaceDeck(deck: StudyDeck): Promise<void> {
  await db.transaction("rw", db.vocabulary, db.grammar, async () => {
    await db.vocabulary.clear();
    await db.grammar.clear();
    await db.vocabulary.bulkPut(deck.vocabulary);
    await db.grammar.bulkPut(deck.grammar);
  });
}

export async function clearDeck(): Promise<void> {
  await db.transaction("rw", db.vocabulary, db.grammar, async () => {
    await db.vocabulary.clear();
    await db.grammar.clear();
  });
}

export async function deleteCard(type: "vocab" | "grammar", id: string): Promise<void> {
  if (type === "vocab") {
    await db.vocabulary.delete(id);
    return;
  }

  await db.grammar.delete(id);
}
