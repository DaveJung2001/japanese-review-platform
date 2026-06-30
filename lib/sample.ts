import { createId } from "./id";
import { createInitialSrs } from "./srs";
import type { StudyDeck } from "./types";

export function createSampleDeck(): StudyDeck {
  const now = new Date().toISOString();
  const vocabId = createId("vocab");

  return {
    vocabulary: [
      {
        id: vocabId,
        type: "vocab",
        kanji: "食べる",
        kana: "たべる",
        meaningKo: "먹다",
        partOfSpeech: "동사 / 2그룹",
        sourceLabel: "샘플",
        createdAt: now,
        updatedAt: now,
        examples: [
          { ja: "朝ごはんを食べます。", reading: "あさごはんをたべます。", ko: "아침밥을 먹습니다." }
        ],
        conjugations: [
          {
            id: createId("conj"),
            label: "ます형",
            form: "食べます",
            reading: "たべます",
            transformation: "2그룹 동사는 어미 る를 빼고 ます를 붙입니다.",
            usage: "정중한 현재·미래 표현",
            example: { ja: "会社で昼ごはんを食べます。", reading: "かいしゃでひるごはんをたべます。", ko: "회사에서 점심을 먹습니다." }
          },
          {
            id: createId("conj"),
            label: "て형",
            form: "食べて",
            reading: "たべて",
            transformation: "2그룹 동사는 어미 る를 빼고 て를 붙입니다.",
            usage: "연결, 부탁, 진행 표현",
            example: { ja: "薬を飲んでから、ご飯を食べてください。", reading: "くすりをのんでから、ごはんをたべてください。", ko: "약을 먹고 나서 밥을 먹어 주세요." }
          },
          {
            id: createId("conj"),
            label: "ない형",
            form: "食べない",
            reading: "たべない",
            transformation: "2그룹 동사는 어미 る를 빼고 ない를 붙입니다.",
            usage: "부정 표현",
            example: { ja: "夜遅くには食べないようにしています。", reading: "よるおそくにはたべないようにしています。", ko: "밤늦게는 먹지 않으려고 하고 있습니다." }
          }
        ],
        srs: createInitialSrs()
      }
    ],
    grammar: [
      {
        id: createId("grammar"),
        type: "grammar",
        pattern: "Vてください",
        meaningKo: "~해 주세요",
        explanationKo: "상대에게 어떤 행동을 정중하게 부탁할 때 씁니다.",
        formation: "동사의 て형 + ください",
        sourceLabel: "샘플",
        createdAt: now,
        updatedAt: now,
        examples: [
          { ja: "ここに名前を書いてください。", reading: "ここになまえをかいてください。", ko: "여기에 이름을 써 주세요." },
          { ja: "もう一度言ってください。", reading: "もういちどいってください。", ko: "한 번 더 말해 주세요." }
        ],
        notes: ["명령보다 부드럽지만 상황에 따라 직접적으로 들릴 수 있습니다."],
        srs: createInitialSrs()
      }
    ]
  };
}
