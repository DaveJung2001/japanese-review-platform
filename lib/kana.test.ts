import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createSampleDeck } from "./sample";
import { getExampleReading, hasKanji } from "./kana";
import type { StudyDeck } from "./types";

describe("kana readings", () => {
  it("renders public study examples without kanji in the reading line", () => {
    const deck = JSON.parse(
      readFileSync(new URL("../public/study-feed.json", import.meta.url), "utf8")
    ) as StudyDeck;
    const readings = collectExamples(deck).map((example) => getExampleReading(example));

    expect(readings.filter(hasKanji)).toEqual([]);
  });

  it("renders sample examples without kanji in the reading line", () => {
    const readings = collectExamples(createSampleDeck()).map((example) => getExampleReading(example));

    expect(readings.filter(hasKanji)).toEqual([]);
  });
});

function collectExamples(deck: StudyDeck) {
  return [
    ...deck.vocabulary.flatMap((card) => [
      ...card.examples,
      ...card.conjugations.map((conjugation) => conjugation.example)
    ]),
    ...deck.grammar.flatMap((card) => card.examples)
  ];
}
