"use client";

import {
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  Database,
  Download,
  FileJson,
  GraduationCap,
  ImageUp,
  Languages,
  Loader2,
  RefreshCcw,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { clearDeck, db, deleteCard, loadDeck, replaceDeck, saveDeck } from "@/lib/db";
import { kanaGroupLabels, kanaRows, type KanaCharacter, type KanaGroup, type KanaMode } from "@/lib/kana-chart";
import { getExampleReading } from "@/lib/kana";
import { normalizeExtraction } from "@/lib/normalize";
import { createSampleDeck } from "@/lib/sample";
import { isDue, reviewSrs } from "@/lib/srs";
import type { ExampleSentence, ExtractResponse, GrammarCard, ReviewRating, StudyDeck, StudyItem, VocabCard } from "@/lib/types";

type Tab = "review" | "photo" | "vocab" | "grammar" | "kana" | "settings";

const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: "review", label: "복습", icon: GraduationCap },
  { id: "photo", label: "사진", icon: Camera },
  { id: "vocab", label: "단어", icon: BookOpen },
  { id: "grammar", label: "문법", icon: Sparkles },
  { id: "kana", label: "가나", icon: Languages },
  { id: "settings", label: "설정", icon: Settings }
];

const emptyDeck: StudyDeck = { vocabulary: [], grammar: [] };

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("review");
  const [deck, setDeck] = useState<StudyDeck>(emptyDeck);
  const [isReady, setIsReady] = useState(false);
  const [query, setQuery] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [uploadPin, setUploadPin] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [status, setStatus] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [importText, setImportText] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function refresh() {
    const nextDeck = await loadDeck();
    setDeck(nextDeck);
    setIsReady(true);
  }

  useEffect(() => {
    async function boot() {
      let nextDeck = await loadDeck();

      if (!hasCards(nextDeck)) {
        const publicDeck = await fetchPublicDeck();
        if (publicDeck && hasCards(publicDeck)) {
          await replaceDeck(publicDeck);
          nextDeck = publicDeck;
        }
      }

      setDeck(nextDeck);
      setIsReady(true);
    }

    boot();
  }, []);

  useEffect(() => {
    const savedPin = localStorage.getItem("japanese-review-upload-pin");
    if (savedPin) {
      setUploadPin(savedPin);
    }
  }, []);

  useEffect(() => {
    if (uploadPin) {
      localStorage.setItem("japanese-review-upload-pin", uploadPin);
    }
  }, [uploadPin]);

  const allItems = useMemo(() => [...deck.vocabulary, ...deck.grammar], [deck]);
  const dueItems = useMemo(
    () =>
      allItems
        .filter((item) => isDue(item.srs))
        .sort((a, b) => new Date(a.srs.dueAt).getTime() - new Date(b.srs.dueAt).getTime()),
    [allItems]
  );
  const currentItem = dueItems[0];
  const totalConjugations = deck.vocabulary.reduce((sum, card) => sum + card.conjugations.length, 0);
  const filteredVocab = deck.vocabulary.filter((card) => matchesQuery(card, query));
  const filteredGrammar = deck.grammar.filter((card) => matchesQuery(card, query));

  async function handleReview(item: StudyItem, rating: ReviewRating) {
    const srs = reviewSrs(item.srs, rating);

    if (item.type === "vocab") {
      await db.vocabulary.update(item.id, { srs, updatedAt: new Date().toISOString() });
    } else {
      await db.grammar.update(item.id, { srs, updatedAt: new Date().toISOString() });
    }

    setRevealed(false);
    await refresh();
  }

  async function handleExtract() {
    if (selectedFiles.length === 0) {
      setStatus("사진을 선택해 주세요.");
      return;
    }

    setIsExtracting(true);
    setStatus("사진을 분석하는 중입니다.");

    try {
      const images = await Promise.all(selectedFiles.map(fileToDataUrl));
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          sourceLabel: sourceLabel.trim() || "사진 학습",
          uploadPin
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "사진 분석에 실패했습니다.");
      }

      const normalized = normalizeExtraction(payload as ExtractResponse);
      await saveDeck(normalized);
      await refresh();
      setSelectedFiles([]);
      setStatus(`${normalized.vocabulary.length + normalized.grammar.length}개 카드가 저장되었습니다.`);
      setActiveTab("review");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "사진 분석에 실패했습니다.");
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleImportText() {
    try {
      const imported = parseImport(importText);
      await saveDeck(imported);
      await refresh();
      setImportText("");
      setStatus(`${imported.vocabulary.length + imported.grammar.length}개 카드가 추가되었습니다.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "JSON을 가져오지 못했습니다.");
    }
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const imported = parseImport(text);
      await saveDeck(imported);
      await refresh();
      setStatus(`${imported.vocabulary.length + imported.grammar.length}개 카드가 추가되었습니다.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "파일을 가져오지 못했습니다.");
    }
  }

  async function handleLoadPublicDeck() {
    const publicDeck = await fetchPublicDeck();

    if (!publicDeck || !hasCards(publicDeck)) {
      setStatus("공개 학습장에 아직 카드가 없습니다.");
      return;
    }

    await replaceDeck(preserveReviewProgress(publicDeck, deck));
    await refresh();
    setStatus("공개 학습장을 불러왔습니다.");
    setActiveTab("review");
  }

  async function handleReplaceWithSample() {
    const sample = createSampleDeck();
    await replaceDeck(sample);
    await refresh();
    setStatus("샘플 카드가 준비되었습니다.");
    setActiveTab("review");
  }

  async function handleClear() {
    await clearDeck();
    await refresh();
    setStatus("저장된 카드가 모두 삭제되었습니다.");
  }

  async function handleDelete(type: "vocab" | "grammar", id: string) {
    await deleteCard(type, id);
    await refresh();
  }

  function exportDeck() {
    const blob = new Blob([JSON.stringify(deck, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `japanese-review-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="appShell">
      <section className="topBar">
        <div>
          <p className="eyebrow">日本語 review</p>
          <h1>오늘 복습</h1>
        </div>
        <div className="streakPill">
          <span>{dueItems.length}</span>
          <small>due</small>
        </div>
      </section>

      <section className="statsGrid" aria-label="학습 현황">
        <Stat label="단어" value={deck.vocabulary.length} />
        <Stat label="문법" value={deck.grammar.length} />
        <Stat label="형변환" value={totalConjugations} />
      </section>

      {status && (
        <section className="statusLine" role="status">
          {status}
          <button aria-label="상태 닫기" onClick={() => setStatus("")}>
            <X size={16} />
          </button>
        </section>
      )}

      <section className="contentPane">
        {!isReady && <LoadingState />}

        {isReady && activeTab === "review" && (
          <ReviewView
            item={currentItem}
            dueCount={dueItems.length}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onReview={handleReview}
            onSeed={handleReplaceWithSample}
          />
        )}

        {isReady && activeTab === "photo" && (
          <PhotoView
            sourceLabel={sourceLabel}
            uploadPin={uploadPin}
            selectedFiles={selectedFiles}
            isExtracting={isExtracting}
            onSourceLabelChange={setSourceLabel}
            onUploadPinChange={setUploadPin}
            onFilesChange={setSelectedFiles}
            onExtract={handleExtract}
          />
        )}

        {isReady && activeTab === "vocab" && (
          <LibraryView
            title="단어장"
            query={query}
            onQueryChange={setQuery}
            emptyLabel="저장된 단어가 없습니다."
          >
            {filteredVocab.map((card) => (
              <VocabCardView key={card.id} card={card} onDelete={() => handleDelete("vocab", card.id)} />
            ))}
          </LibraryView>
        )}

        {isReady && activeTab === "grammar" && (
          <LibraryView
            title="문법"
            query={query}
            onQueryChange={setQuery}
            emptyLabel="저장된 문법이 없습니다."
          >
            {filteredGrammar.map((card) => (
              <GrammarCardView key={card.id} card={card} onDelete={() => handleDelete("grammar", card.id)} />
            ))}
          </LibraryView>
        )}

        {isReady && activeTab === "kana" && <KanaStudyView />}

        {isReady && activeTab === "settings" && (
          <SettingsView
            importText={importText}
            fileInputRef={fileInputRef}
            onImportTextChange={setImportText}
            onImportText={handleImportText}
            onImportFile={handleImportFile}
            onExport={exportDeck}
            onLoadPublicDeck={handleLoadPublicDeck}
            onSeed={handleReplaceWithSample}
            onClear={handleClear}
          />
        )}
      </section>

      <nav className="bottomNav" aria-label="주요 메뉴">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => {
                setActiveTab(tab.id);
                setRevealed(false);
              }}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="statBox">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="emptyState">
      <Loader2 className="spin" size={28} />
      <p>불러오는 중</p>
    </div>
  );
}

function ReviewView({
  item,
  dueCount,
  revealed,
  onReveal,
  onReview,
  onSeed
}: {
  item?: StudyItem;
  dueCount: number;
  revealed: boolean;
  onReveal: () => void;
  onReview: (item: StudyItem, rating: ReviewRating) => Promise<void>;
  onSeed: () => Promise<void>;
}) {
  if (!item) {
    return (
      <div className="emptyState">
        <Check size={32} />
        <h2>지금 풀 카드가 없습니다.</h2>
        <p>사진을 추가하거나 샘플 카드로 화면을 확인할 수 있습니다.</p>
        <button className="primaryButton" onClick={onSeed}>
          <Database size={18} />
          샘플 불러오기
        </button>
      </div>
    );
  }

  return (
    <article className="quizPanel">
      <div className="quizMeta">
        <span>{item.type === "vocab" ? "단어" : "문법"}</span>
        <span>{dueCount}개 남음</span>
      </div>

      {item.type === "vocab" ? <VocabPrompt card={item} /> : <GrammarPrompt card={item} />}

      {!revealed ? (
        <button className="wideReveal" onClick={onReveal}>
          <ChevronDown size={20} />
          답 보기
        </button>
      ) : (
        <>
          <div className="answerBlock">
            {item.type === "vocab" ? <VocabAnswer card={item} /> : <GrammarAnswer card={item} />}
          </div>
          <div className="reviewButtons">
            <button className="dangerButton" onClick={() => onReview(item, "again")}>
              다시
            </button>
            <button className="secondaryButton" onClick={() => onReview(item, "good")}>
              맞음
            </button>
            <button className="primaryButton" onClick={() => onReview(item, "easy")}>
              쉬움
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function VocabPrompt({ card }: { card: VocabCard }) {
  return (
    <div className="promptBlock">
      <p className="cardType">{card.partOfSpeech}</p>
      <h2>{card.kanji || card.kana}</h2>
      <p className="kana">{card.kana}</p>
      <p className="promptHint">뜻, 읽기, 형변환을 떠올려 보세요.</p>
    </div>
  );
}

function GrammarPrompt({ card }: { card: GrammarCard }) {
  return (
    <div className="promptBlock">
      <p className="cardType">문법</p>
      <h2>{card.pattern}</h2>
      <p className="promptHint">의미, 접속 방식, 예문을 떠올려 보세요.</p>
    </div>
  );
}

function VocabAnswer({ card }: { card: VocabCard }) {
  return (
    <>
      <div className="answerTopline">
        <strong>{card.meaningKo}</strong>
        <span>{card.sourceLabel}</span>
      </div>
      <ExampleList examples={card.examples} />
      <ConjugationList conjugations={card.conjugations} />
    </>
  );
}

function GrammarAnswer({ card }: { card: GrammarCard }) {
  return (
    <>
      <div className="answerTopline">
        <strong>{card.meaningKo}</strong>
        <span>{card.formation}</span>
      </div>
      <p className="explanation">{card.explanationKo}</p>
      <ExampleList examples={card.examples} />
      {card.notes.length > 0 && (
        <div className="noteList">
          {card.notes.map((note, index) => (
            <span key={`${note}-${index}`}>{note}</span>
          ))}
        </div>
      )}
    </>
  );
}

function PhotoView({
  sourceLabel,
  uploadPin,
  selectedFiles,
  isExtracting,
  onSourceLabelChange,
  onUploadPinChange,
  onFilesChange,
  onExtract
}: {
  sourceLabel: string;
  uploadPin: string;
  selectedFiles: File[];
  isExtracting: boolean;
  onSourceLabelChange: (value: string) => void;
  onUploadPinChange: (value: string) => void;
  onFilesChange: (files: File[]) => void;
  onExtract: () => void;
}) {
  return (
    <div className="photoFlow">
      <div className="fieldGroup">
        <label htmlFor="sourceLabel">범위</label>
        <input
          id="sourceLabel"
          value={sourceLabel}
          onChange={(event) => onSourceLabelChange(event.target.value)}
          placeholder="예: 민나노 일본어 12과"
        />
      </div>

      <div className="fieldGroup">
        <label htmlFor="uploadPin">업로드 PIN</label>
        <input
          id="uploadPin"
          type="password"
          value={uploadPin}
          onChange={(event) => onUploadPinChange(event.target.value)}
          placeholder="배포 시 설정한 PIN"
          autoComplete="current-password"
        />
      </div>

      <label className="uploadBox">
        <ImageUp size={30} />
        <strong>{selectedFiles.length > 0 ? `${selectedFiles.length}장 선택됨` : "사진 선택"}</strong>
        <span>JPG, PNG, WEBP</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(event) => onFilesChange(Array.from(event.target.files ?? []))}
        />
      </label>

      {selectedFiles.length > 0 && (
        <div className="fileList">
          {selectedFiles.map((file) => (
            <span key={`${file.name}-${file.lastModified}`}>{file.name}</span>
          ))}
        </div>
      )}

      <button className="primaryButton wideAction" onClick={onExtract} disabled={isExtracting}>
        {isExtracting ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
        분석 후 저장
      </button>
    </div>
  );
}

function LibraryView({
  title,
  query,
  onQueryChange,
  emptyLabel,
  children
}: {
  title: string;
  query: string;
  onQueryChange: (value: string) => void;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <div className="libraryView">
      <div className="libraryHeader">
        <h2>{title}</h2>
        <div className="searchBox">
          <Search size={17} />
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="검색" />
        </div>
      </div>

      <div className="cardStack">{hasChildren ? children : <p className="emptyText">{emptyLabel}</p>}</div>
    </div>
  );
}

function VocabCardView({ card, onDelete }: { card: VocabCard; onDelete: () => void }) {
  return (
    <article className="studyCard">
      <div className="cardHeader">
        <div>
          <p>{card.partOfSpeech}</p>
          <h3>{card.kanji || card.kana}</h3>
          <span>{card.kana}</span>
        </div>
        <button className="iconButton" aria-label="단어 삭제" onClick={onDelete}>
          <Trash2 size={17} />
        </button>
      </div>
      <strong className="meaning">{card.meaningKo}</strong>
      <ExampleList examples={card.examples} />
      <ConjugationList conjugations={card.conjugations} />
    </article>
  );
}

function GrammarCardView({ card, onDelete }: { card: GrammarCard; onDelete: () => void }) {
  return (
    <article className="studyCard">
      <div className="cardHeader">
        <div>
          <p>{card.sourceLabel}</p>
          <h3>{card.pattern}</h3>
          <span>{card.formation}</span>
        </div>
        <button className="iconButton" aria-label="문법 삭제" onClick={onDelete}>
          <Trash2 size={17} />
        </button>
      </div>
      <strong className="meaning">{card.meaningKo}</strong>
      <p className="explanation">{card.explanationKo}</p>
      <ExampleList examples={card.examples} />
      {card.notes.length > 0 && (
        <div className="noteList">
          {card.notes.map((note, index) => (
            <span key={`${note}-${index}`}>{note}</span>
          ))}
        </div>
      )}
    </article>
  );
}

function SettingsView({
  importText,
  fileInputRef,
  onImportTextChange,
  onImportText,
  onImportFile,
  onExport,
  onLoadPublicDeck,
  onSeed,
  onClear
}: {
  importText: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImportTextChange: (value: string) => void;
  onImportText: () => void;
  onImportFile: (file: File) => void;
  onExport: () => void;
  onLoadPublicDeck: () => void;
  onSeed: () => void;
  onClear: () => void;
}) {
  return (
    <div className="settingsStack">
      <section className="settingsSection">
        <h2>Codex JSON</h2>
        <textarea
          value={importText}
          onChange={(event) => onImportTextChange(event.target.value)}
          placeholder='{"sourceLabel":"...","vocabulary":[],"grammar":[]}'
        />
        <button className="primaryButton wideAction" onClick={onImportText} disabled={!importText.trim()}>
          <FileJson size={18} />
          가져오기
        </button>
      </section>

      <section className="settingsSection">
        <h2>백업</h2>
        <div className="buttonGrid">
          <button className="secondaryButton" onClick={onLoadPublicDeck}>
            <Database size={18} />
            공개 갱신
          </button>
          <button className="secondaryButton" onClick={onExport}>
            <Download size={18} />
            내보내기
          </button>
          <button className="secondaryButton" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} />
            파일 가져오기
          </button>
          <button className="secondaryButton" onClick={onSeed}>
            <RefreshCcw size={18} />
            샘플
          </button>
          <button className="dangerButton" onClick={onClear}>
            <Trash2 size={18} />
            초기화
          </button>
        </div>
        <input
          ref={fileInputRef}
          className="hiddenInput"
          type="file"
          accept="application/json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImportFile(file);
            }
          }}
        />
      </section>
    </div>
  );
}

function KanaStudyView() {
  const [mode, setMode] = useState<KanaMode>("hiragana");
  const [group, setGroup] = useState<KanaGroup>("basic");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const characters = useMemo(() => kanaRows[group].flatMap((row) => row.characters), [group]);
  const selected = characters[selectedIndex] ?? characters[0];

  useEffect(() => {
    setSelectedIndex(0);
  }, [group, mode]);

  return (
    <div className="kanaView">
      <div className="segmentedControl" aria-label="가나 종류">
        <button className={mode === "hiragana" ? "active" : ""} onClick={() => setMode("hiragana")}>
          ひらがな
        </button>
        <button className={mode === "katakana" ? "active" : ""} onClick={() => setMode("katakana")}>
          カタカナ
        </button>
      </div>

      <div className="segmentedControl compact" aria-label="가나 묶음">
        {kanaGroupLabels.map((item) => (
          <button key={item.id} className={group === item.id ? "active" : ""} onClick={() => setGroup(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {selected && <KanaFocus mode={mode} character={selected} />}

      <div className="kanaChart">
        {kanaRows[group].map((row, rowIndex) => (
          <div className="kanaRow" key={`${group}-${row.label}`}>
            <span>{row.label}</span>
            <div>
              {row.characters.map((character, characterIndex) => {
                const index = kanaRows[group]
                  .slice(0, rowIndex)
                  .reduce((sum, currentRow) => sum + currentRow.characters.length, 0) + characterIndex;
                const symbol = mode === "hiragana" ? character.hiragana : character.katakana;

                return (
                  <button
                    key={`${character.hiragana}-${character.katakana}`}
                    className={selectedIndex === index ? "active" : ""}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <strong lang="ja">{symbol}</strong>
                    <small>{character.romaji}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KanaFocus({ mode, character }: { mode: KanaMode; character: KanaCharacter }) {
  const symbol = mode === "hiragana" ? character.hiragana : character.katakana;
  const counterpart = mode === "hiragana" ? character.katakana : character.hiragana;

  return (
    <section className="kanaFocus">
      <span lang="ja">{symbol}</span>
      <div>
        <strong>{character.romaji}</strong>
        <p>{character.ko}</p>
        <small lang="ja">{counterpart}</small>
      </div>
    </section>
  );
}

function ExampleList({ examples }: { examples: ExampleSentence[] }) {
  if (examples.length === 0) {
    return null;
  }

  return (
    <div className="exampleList">
      {examples.map((example, index) => (
        <div key={`${example.ja}-${index}`} className="exampleLine">
          <p lang="ja">{example.ja}</p>
          <ExampleReading example={example} />
          <span>{example.ko}</span>
        </div>
      ))}
    </div>
  );
}

function ExampleReading({ example }: { example: ExampleSentence }) {
  const reading = getExampleReading(example);

  if (!reading || reading === example.ja) {
    return null;
  }

  return <small lang="ja">{reading}</small>;
}

function ConjugationList({ conjugations }: { conjugations: VocabCard["conjugations"] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (conjugations.length === 0) {
    return null;
  }

  return (
    <div className="conjugationList">
      <button
        className="conjugationToggle"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>형변환 전체</span>
        <strong>{conjugations.length}개</strong>
        <ChevronDown size={18} className={isOpen ? "toggleIcon open" : "toggleIcon"} />
      </button>

      {isOpen && (
        <div className="conjugationRows">
          {conjugations.map((conjugation) => (
            <div className="conjugationRow" key={conjugation.id}>
              <div className="conjugationMain">
                <span>{conjugation.label}</span>
                <strong lang="ja">{conjugation.form}</strong>
                <small>{conjugation.reading}</small>
              </div>
              <p>{conjugation.transformation}</p>
              <em>{conjugation.usage}</em>
              <div className="miniExample">
                <p lang="ja">{conjugation.example.ja}</p>
                <ExampleReading example={conjugation.example} />
                <span>{conjugation.example.ko}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function matchesQuery(card: VocabCard | GrammarCard, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return JSON.stringify(card).toLowerCase().includes(normalized);
}

function parseImport(text: string): StudyDeck {
  const parsed = JSON.parse(text) as StudyDeck | ExtractResponse;
  const hasSavedShape =
    Array.isArray(parsed.vocabulary) &&
    Array.isArray(parsed.grammar) &&
    parsed.vocabulary.every((item) => "id" in item && "srs" in item) &&
    parsed.grammar.every((item) => "id" in item && "srs" in item);

  if (hasSavedShape) {
    return parsed as StudyDeck;
  }

  return normalizeExtraction(parsed as ExtractResponse);
}

async function fetchPublicDeck(): Promise<StudyDeck | null> {
  try {
    const response = await fetch("/study-feed.json", { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    return parseImport(await response.text());
  } catch {
    return null;
  }
}

function hasCards(deck: StudyDeck): boolean {
  return deck.vocabulary.length + deck.grammar.length > 0;
}

function preserveReviewProgress(publicDeck: StudyDeck, currentDeck: StudyDeck): StudyDeck {
  const vocabProgress = new Map(currentDeck.vocabulary.map((card) => [card.id, card.srs]));
  const grammarProgress = new Map(currentDeck.grammar.map((card) => [card.id, card.srs]));

  return {
    vocabulary: publicDeck.vocabulary.map((card) => ({
      ...card,
      srs: vocabProgress.get(card.id) ?? card.srs
    })),
    grammar: publicDeck.grammar.map((card) => ({
      ...card,
      srs: grammarProgress.get(card.id) ?? card.srs
    }))
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  if (file.type.startsWith("image/")) {
    try {
      const bitmap = await createImageBitmap(file);
      const maxSide = 1800;
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");

      if (context) {
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        return canvas.toDataURL("image/jpeg", 0.86);
      }

      bitmap.close();
    } catch {
      return readFileAsDataUrl(file);
    }
  }

  return readFileAsDataUrl(file);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}
