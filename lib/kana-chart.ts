export type KanaMode = "hiragana" | "katakana";
export type KanaGroup = "basic" | "dakuten" | "youon";

export type KanaCharacter = {
  hiragana: string;
  katakana: string;
  romaji: string;
  ko: string;
};

export type KanaRow = {
  label: string;
  characters: KanaCharacter[];
};

export const kanaGroupLabels: Array<{ id: KanaGroup; label: string }> = [
  { id: "basic", label: "기본" },
  { id: "dakuten", label: "탁음" },
  { id: "youon", label: "요음" }
];

export const kanaRows: Record<KanaGroup, KanaRow[]> = {
  basic: [
    { label: "あ", characters: row(["あ", "ア", "a", "아"], ["い", "イ", "i", "이"], ["う", "ウ", "u", "우"], ["え", "エ", "e", "에"], ["お", "オ", "o", "오"]) },
    { label: "か", characters: row(["か", "カ", "ka", "카"], ["き", "キ", "ki", "키"], ["く", "ク", "ku", "쿠"], ["け", "ケ", "ke", "케"], ["こ", "コ", "ko", "코"]) },
    { label: "さ", characters: row(["さ", "サ", "sa", "사"], ["し", "シ", "shi", "시"], ["す", "ス", "su", "스"], ["せ", "セ", "se", "세"], ["そ", "ソ", "so", "소"]) },
    { label: "た", characters: row(["た", "タ", "ta", "타"], ["ち", "チ", "chi", "치"], ["つ", "ツ", "tsu", "츠"], ["て", "テ", "te", "테"], ["と", "ト", "to", "토"]) },
    { label: "な", characters: row(["な", "ナ", "na", "나"], ["に", "ニ", "ni", "니"], ["ぬ", "ヌ", "nu", "누"], ["ね", "ネ", "ne", "네"], ["の", "ノ", "no", "노"]) },
    { label: "は", characters: row(["は", "ハ", "ha", "하"], ["ひ", "ヒ", "hi", "히"], ["ふ", "フ", "fu", "후"], ["へ", "ヘ", "he", "헤"], ["ほ", "ホ", "ho", "호"]) },
    { label: "ま", characters: row(["ま", "マ", "ma", "마"], ["み", "ミ", "mi", "미"], ["む", "ム", "mu", "무"], ["め", "メ", "me", "메"], ["も", "モ", "mo", "모"]) },
    { label: "や", characters: row(["や", "ヤ", "ya", "야"], ["ゆ", "ユ", "yu", "유"], ["よ", "ヨ", "yo", "요"]) },
    { label: "ら", characters: row(["ら", "ラ", "ra", "라"], ["り", "リ", "ri", "리"], ["る", "ル", "ru", "루"], ["れ", "レ", "re", "레"], ["ろ", "ロ", "ro", "로"]) },
    { label: "わ", characters: row(["わ", "ワ", "wa", "와"], ["を", "ヲ", "wo", "오"], ["ん", "ン", "n", "응"]) }
  ],
  dakuten: [
    { label: "が", characters: row(["が", "ガ", "ga", "가"], ["ぎ", "ギ", "gi", "기"], ["ぐ", "グ", "gu", "구"], ["げ", "ゲ", "ge", "게"], ["ご", "ゴ", "go", "고"]) },
    { label: "ざ", characters: row(["ざ", "ザ", "za", "자"], ["じ", "ジ", "ji", "지"], ["ず", "ズ", "zu", "즈"], ["ぜ", "ゼ", "ze", "제"], ["ぞ", "ゾ", "zo", "조"]) },
    { label: "だ", characters: row(["だ", "ダ", "da", "다"], ["ぢ", "ヂ", "ji", "지"], ["づ", "ヅ", "zu", "즈"], ["で", "デ", "de", "데"], ["ど", "ド", "do", "도"]) },
    { label: "ば", characters: row(["ば", "バ", "ba", "바"], ["び", "ビ", "bi", "비"], ["ぶ", "ブ", "bu", "부"], ["べ", "ベ", "be", "베"], ["ぼ", "ボ", "bo", "보"]) },
    { label: "ぱ", characters: row(["ぱ", "パ", "pa", "파"], ["ぴ", "ピ", "pi", "피"], ["ぷ", "プ", "pu", "푸"], ["ぺ", "ペ", "pe", "페"], ["ぽ", "ポ", "po", "포"]) }
  ],
  youon: [
    { label: "きゃ", characters: row(["きゃ", "キャ", "kya", "캬"], ["きゅ", "キュ", "kyu", "큐"], ["きょ", "キョ", "kyo", "쿄"]) },
    { label: "しゃ", characters: row(["しゃ", "シャ", "sha", "샤"], ["しゅ", "シュ", "shu", "슈"], ["しょ", "ショ", "sho", "쇼"]) },
    { label: "ちゃ", characters: row(["ちゃ", "チャ", "cha", "챠"], ["ちゅ", "チュ", "chu", "츄"], ["ちょ", "チョ", "cho", "쵸"]) },
    { label: "にゃ", characters: row(["にゃ", "ニャ", "nya", "냐"], ["にゅ", "ニュ", "nyu", "뉴"], ["にょ", "ニョ", "nyo", "뇨"]) },
    { label: "ひゃ", characters: row(["ひゃ", "ヒャ", "hya", "햐"], ["ひゅ", "ヒュ", "hyu", "휴"], ["ひょ", "ヒョ", "hyo", "효"]) },
    { label: "みゃ", characters: row(["みゃ", "ミャ", "mya", "먀"], ["みゅ", "ミュ", "myu", "뮤"], ["みょ", "ミョ", "myo", "묘"]) },
    { label: "りゃ", characters: row(["りゃ", "リャ", "rya", "랴"], ["りゅ", "リュ", "ryu", "류"], ["りょ", "リョ", "ryo", "료"]) },
    { label: "ぎゃ", characters: row(["ぎゃ", "ギャ", "gya", "갸"], ["ぎゅ", "ギュ", "gyu", "규"], ["ぎょ", "ギョ", "gyo", "교"]) },
    { label: "じゃ", characters: row(["じゃ", "ジャ", "ja", "자"], ["じゅ", "ジュ", "ju", "주"], ["じょ", "ジョ", "jo", "조"]) },
    { label: "びゃ", characters: row(["びゃ", "ビャ", "bya", "뱌"], ["びゅ", "ビュ", "byu", "뷰"], ["びょ", "ビョ", "byo", "뵤"]) },
    { label: "ぴゃ", characters: row(["ぴゃ", "ピャ", "pya", "퍄"], ["ぴゅ", "ピュ", "pyu", "퓨"], ["ぴょ", "ピョ", "pyo", "표"]) }
  ]
};

function row(...items: Array<[string, string, string, string]>): KanaCharacter[] {
  return items.map(([hiragana, katakana, romaji, ko]) => ({ hiragana, katakana, romaji, ko }));
}
