export type ReviewRating = "again" | "good" | "easy";

export type SrsState = {
  dueAt: string;
  intervalDays: number;
  ease: number;
  reviews: number;
  lapses: number;
  lastReviewedAt?: string;
};

export type ExampleSentence = {
  ja: string;
  reading?: string;
  ko: string;
};

export type Conjugation = {
  id: string;
  label: string;
  form: string;
  reading: string;
  transformation: string;
  usage: string;
  example: ExampleSentence;
};

export type VocabCard = {
  id: string;
  type: "vocab";
  kanji: string;
  kana: string;
  meaningKo: string;
  partOfSpeech: string;
  sourceLabel: string;
  createdAt: string;
  updatedAt: string;
  examples: ExampleSentence[];
  conjugations: Conjugation[];
  srs: SrsState;
};

export type GrammarCard = {
  id: string;
  type: "grammar";
  pattern: string;
  meaningKo: string;
  explanationKo: string;
  formation: string;
  sourceLabel: string;
  createdAt: string;
  updatedAt: string;
  examples: ExampleSentence[];
  notes: string[];
  srs: SrsState;
};

export type StudyItem = VocabCard | GrammarCard;

export type StudyDeck = {
  vocabulary: VocabCard[];
  grammar: GrammarCard[];
};

export type ExtractResponse = {
  sourceLabel: string;
  vocabulary: Array<{
    kanji: string;
    kana: string;
    meaningKo: string;
    partOfSpeech: string;
    examples: ExampleSentence[];
    conjugations: Array<{
      label: string;
      form: string;
      reading: string;
      transformation: string;
      usage: string;
      example: ExampleSentence;
    }>;
  }>;
  grammar: Array<{
    pattern: string;
    meaningKo: string;
    explanationKo: string;
    formation: string;
    examples: ExampleSentence[];
    notes: string[];
  }>;
};
