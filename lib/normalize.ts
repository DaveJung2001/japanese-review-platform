import { createId } from "./id";
import { getExampleReading } from "./kana";
import { createInitialSrs } from "./srs";
import type { ExampleSentence, ExtractResponse, GrammarCard, StudyDeck, VocabCard } from "./types";

export function normalizeExtraction(extraction: ExtractResponse): StudyDeck {
  const now = new Date().toISOString();
  const sourceLabel = extraction.sourceLabel.trim() || "사진 학습";

  return {
    vocabulary: extraction.vocabulary.map((item): VocabCard => {
      const cardId = createId("vocab");

      return {
        id: cardId,
        type: "vocab",
        kanji: item.kanji.trim(),
        kana: item.kana.trim(),
        meaningKo: item.meaningKo.trim(),
        partOfSpeech: item.partOfSpeech.trim(),
        sourceLabel,
        createdAt: now,
        updatedAt: now,
        examples: item.examples.map(normalizeExample),
        conjugations: item.conjugations.map((conjugation) => ({
          id: createId("conj"),
          label: conjugation.label.trim(),
          form: conjugation.form.trim(),
          reading: conjugation.reading.trim(),
          transformation: conjugation.transformation.trim(),
          usage: conjugation.usage.trim(),
          example: normalizeExample(conjugation.example)
        })),
        srs: createInitialSrs()
      };
    }),
    grammar: extraction.grammar.map((item): GrammarCard => ({
      id: createId("grammar"),
      type: "grammar",
      pattern: item.pattern.trim(),
      meaningKo: item.meaningKo.trim(),
      explanationKo: item.explanationKo.trim(),
      formation: item.formation.trim(),
      sourceLabel,
      createdAt: now,
      updatedAt: now,
      examples: item.examples.map(normalizeExample),
      notes: item.notes,
      srs: createInitialSrs()
    }))
  };
}

function normalizeExample(example: ExampleSentence): ExampleSentence {
  return {
    ja: example.ja.trim(),
    reading: getExampleReading(example).trim(),
    ko: example.ko.trim()
  };
}
