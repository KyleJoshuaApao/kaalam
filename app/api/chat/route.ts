import { NextRequest, NextResponse } from 'next/server';

type StudyMode = 'general' | 'summary' | 'quiz' | 'explain' | 'translate';

export const runtime = 'nodejs';

const modeInstructions: Record<StudyMode, string> = {
  general: 'Answer the student question in a warm Filipino study tone, using Tagalog and English naturally.',
  summary: 'Summarize the uploaded notes into an easy-to-follow study guide. Use clear Filipino wording and bullets when possible.',
  quiz: 'Create a short quiz with useful questions and answers based on the uploaded notes. Use a friendly study tone.',
  explain: 'Explain the requested concept simply and clearly in a natural Filipino tone, as if teaching a Filipino student.',
  translate: 'Translate the student input into natural Filipino while preserving meaning and study context.',
};

const MAX_MESSAGE_LENGTH = 2_000;
const MAX_CONTEXT_LENGTH = 12_000;

const clipText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
};

const createOpenAIClient = async () => {
  const { default: OpenAI } = await import('openai');

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

let openaiClientPromise: Promise<Awaited<ReturnType<typeof createOpenAIClient>>> | null = null;

const getOpenAIClient = () => {
  if (!openaiClientPromise) {
    openaiClientPromise = createOpenAIClient();
  }

  return openaiClientPromise;
};

export async function POST(request: NextRequest) {
  try {
    const { message, context, mode } = await request.json();
    const trimmedMessage = clipText(message, MAX_MESSAGE_LENGTH);

    if (!trimmedMessage) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const openai = await getOpenAIClient();

    const selectedMode = typeof mode === 'string' && Object.prototype.hasOwnProperty.call(modeInstructions, mode) ? (mode as StudyMode) : 'general';
    const instruction = modeInstructions[selectedMode];
    const clippedContext = clipText(context, MAX_CONTEXT_LENGTH);
    const contextText = clippedContext ? `Uploaded notes:\n${clippedContext}\n\n` : '';
    const userPrompt = `${instruction}\n\n${contextText}Student question:\n${trimmedMessage}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are Kaalaman, an AI study companion for Philippine students.' },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.45,
      max_tokens: 1000,
    });

    const response = completion.choices?.[0]?.message?.content ?? 'Walang sinonang tugon mula sa AI.';

    return NextResponse.json({ response });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
