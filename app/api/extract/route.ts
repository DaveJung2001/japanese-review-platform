import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";

const ExampleSchema = z.object({
  ja: z.string(),
  reading: z.string(),
  ko: z.string()
});

const ExtractionSchema = z.object({
  sourceLabel: z.string(),
  vocabulary: z.array(
    z.object({
      kanji: z.string(),
      kana: z.string(),
      meaningKo: z.string(),
      partOfSpeech: z.string(),
      examples: z.array(ExampleSchema),
      conjugations: z.array(
        z.object({
          label: z.string(),
          form: z.string(),
          reading: z.string(),
          transformation: z.string(),
          usage: z.string(),
          example: ExampleSchema
        })
      )
    })
  ),
  grammar: z.array(
    z.object({
      pattern: z.string(),
      meaningKo: z.string(),
      explanationKo: z.string(),
      formation: z.string(),
      examples: z.array(ExampleSchema),
      notes: z.array(z.string())
    })
  )
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const images: string[] = Array.isArray(body?.images) ? body.images : [];
  const sourceLabel = typeof body?.sourceLabel === "string" ? body.sourceLabel : "사진 학습";
  const uploadPin = typeof body?.uploadPin === "string" ? body.uploadPin : "";
  const requiredPin = process.env.UPLOAD_PIN;

  if (requiredPin && uploadPin !== requiredPin) {
    return NextResponse.json({ error: "업로드 PIN이 올바르지 않습니다." }, { status: 401 });
  }

  if (images.length === 0 || images.some((image) => typeof image !== "string")) {
    return NextResponse.json({ error: "분석할 사진이 필요합니다." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-5.5";

  const response = await client.responses.parse({
    model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildPrompt(sourceLabel)
          },
          ...images.map((image: string) => ({
            type: "input_image" as const,
            image_url: image,
            detail: "high" as const
          }))
        ]
      }
    ],
    text: {
      format: zodTextFormat(ExtractionSchema, "japanese_study_extraction")
    }
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    return NextResponse.json({ error: "사진에서 학습 항목을 추출하지 못했습니다." }, { status: 422 });
  }

  return NextResponse.json(parsed);
}

function buildPrompt(sourceLabel: string) {
  return `
너는 한국어 사용자를 위한 일본어 교재 복습 카드 생성기다.
이미지에 보이는 학습 범위에서 단어, 한자어, 동사/형용사 형변환, 문법을 추출해 JSON으로만 답한다.

규칙:
- sourceLabel은 "${sourceLabel}"로 둔다.
- 일본어 원문이 흐리거나 잘 안 보이면 추측하지 말고 확실한 항목만 만든다.
- 단어는 한자 표기, 가나, 한국어 뜻, 품사를 채운다.
- 동사, い형용사, な형용사, 명사+だ 계열은 학습에 필요한 형변환을 빠짐없이 만든다.
- 각 형변환은 label, form, reading, transformation, usage, example을 반드시 채운다.
- transformation은 한국어로 "어떻게 변했는지"를 짧고 구체적으로 설명한다.
- example.ja는 해당 변형 form을 실제로 포함해야 한다.
- example.reading은 example.ja 전체 문장의 히라가나/가타카나 읽기다. 한자는 히라가나로 풀고, 외래어는 자연스러운 가타카나로 둔다.
- example.ko는 자연스러운 한국어 해석으로 쓴다.
- 문법은 pattern, meaningKo, explanationKo, formation, examples, notes를 채운다.
- 문법 예문은 일본어, 히라가나/가타카나 읽기, 한국어 해석을 함께 제공한다.

형변환 기준:
- 동사: 사전형, ます형, て형, た형, ない형, なかった형, 가능형, 수동형, 사역형, 사역수동형, 의지형, 명령형, ば형, たら형, 진행형을 우선 포함한다.
- い형용사: 현재, 과거, 부정, 과거부정, て형, 부사형, ば형을 포함한다.
- な형용사/명사: だ/です, ではない/じゃない, だった/でした, ではなかった/じゃなかった, で, なら를 포함한다.
`.trim();
}
