'use client';

import { useEffect, useRef, useState } from 'react';

type StudyMode = 'general' | 'summary' | 'quiz' | 'explain' | 'translate';
type ChatMessage = { text: string; isUser: boolean };
type StoredChatState = {
  messages?: ChatMessage[];
  context?: string;
  fileName?: string;
  selectedMode?: StudyMode;
  liteMode?: boolean;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = ArrayLike<SpeechRecognitionAlternativeLike>;

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const studyModes = [
  { id: 'general', label: 'General', icon: '💬' },
  { id: 'summary', label: 'Summarize', icon: '📝' },
  { id: 'quiz', label: 'Quiz', icon: '❓' },
  { id: 'explain', label: 'Explain', icon: '🔍' },
  { id: 'translate', label: 'Translate', icon: '🌐' },
] as const satisfies ReadonlyArray<{ id: StudyMode; label: string; icon: string }>;

const quickActions = [
  { action: 'summary', label: 'Summarize', icon: '📝' },
  { action: 'quiz', label: 'Create Quiz', icon: '❓' },
  { action: 'explain', label: 'Explain Concept', icon: '💡' },
  { action: 'translate', label: 'Translate to Filipino', icon: '🌐' },
] as const satisfies ReadonlyArray<{ action: StudyMode; label: string; icon: string }>;

const isStudyMode = (value: unknown): value is StudyMode =>
  studyModes.some((mode) => mode.id === value);

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();

const MAX_CHAT_MESSAGES = 30;
const trimMessages = (messages: ChatMessage[]) => messages.slice(-MAX_CHAT_MESSAGES);

const splitSentences = (text: string) => {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(sentence => cleanText(sentence))
    .filter(Boolean);
};

const extractKeywords = (text: string) => {
  const stopWords = new Set([
    'ang', 'ng', 'sa', 'mga', 'at', 'ay', 'na', 'para', 'kung', 'ito', 'ni', 'gamit', 'may', 'buong', 'isa', 'lahat', 'tulad', 'kaysa', 'dapat', 'nito', 'kaniyang', 'kaniya', 'sina', 'siya', 'mula', 'dahil', 'ngunit', 'pero', 'hindi', 'mayroon', 'higit', 'mas', 'hindi', 'handa', 'iyong', 'atin', 'nasaan', 'lamang', 'kanila', 'kanilang', 'kanino',
  ]);

  const words = (text
    .replace(/[^a-zA-Z\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean) as string[]).filter(word => word.length > 4 && !stopWords.has(word));

  const frequency = new Map<string, number>();
  words.forEach((word) => frequency.set(word, (frequency.get(word) || 0) + 1));

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
};

const buildLiteSummary = (text: string) => {
  const sentences = splitSentences(text);
  const top = sentences.slice(0, 4).join(' ');
  const bullets = sentences.slice(0, 5).map((sentence) => `• ${sentence}`);

  return `Lite mode summary:
${top}

Key points:
${bullets.join('\n')}

Note: Para sa mas malalim na paliwanag, i-slide ang Lite Mode off at gumamit ng AI chat.`;
};

const buildLiteQuiz = (text: string) => {
  const keywords = extractKeywords(text);
  const questions = keywords.length
    ? keywords.map((keyword, index) => `Q${index + 1}. Ano ang kahulugan o kahalagahan ng "${keyword}" sa iyong notes?`)
    : [
        'Q1. Ano ang pangunahing paksa na tinalakay sa dokumento?',
        'Q2. Ano ang isang mahalagang ideya na dapat tandaan?',
        'Q3. Paano makakatulong ang impormasyon sa pag-aaral mo?',
      ];

  return `Lite mode quiz:
${questions.join('\n')}

Sagot: Gumawa ng sarili mong sagot batay sa notes at pangunahing paksa. Kung gusto mo ng aktwal na sagot, i-off ang Lite Mode at subukang gamitin ang AI chat.`;
};

const buildLiteExplanation = (text: string, question: string) => {
  const summary = buildLiteSummary(text);
  return `Lite mode explanation:
Batay sa iyong notes, ang mahalagang punto ay nasa core ng materyal. ${question ? `Tungkol sa "${question}", subukan hanapin ang mga bahagi ng text na may mga terminong ito at pag-aralan kung paano ito ginagamit.` : 'I-type ang tiyak na tanong mo para mas mabigyan ng konteksto.'}

${summary}`;
};

const buildLiteTranslate = (question: string) => {
  return `Lite mode translation:
${question}

(Tandaan: Ang translation na ito ay isang simpleng bersyon. Para sa mas tamang salin, gamitin ang AI mode.)`;
};

const createLiteResponse = (mode: StudyMode, contextText: string, question: string) => {
  if (!contextText) {
    return 'Wala pang na-upload na notes. Mag-upload ng PDF, DOCX, o text file upang gumana ang Lite Mode summary, quiz, at explanation.';
  }

  if (mode === 'summary') {
    return buildLiteSummary(contextText);
  }

  if (mode === 'quiz') {
    return buildLiteQuiz(contextText);
  }

  if (mode === 'explain') {
    return buildLiteExplanation(contextText, question);
  }

  if (mode === 'translate') {
    return buildLiteTranslate(question || contextText.slice(0, 200));
  }

  return `Lite mode response:
${buildLiteSummary(contextText)}`;
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedMode, setSelectedMode] = useState<StudyMode>('general');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [liteMode, setLiteMode] = useState(false);
  const [voiceLang, setVoiceLang] = useState('tl-PH');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('kaalaman_chat');
    if (!saved) return;

    try {
      const data = JSON.parse(saved) as StoredChatState;
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setContext(typeof data.context === 'string' ? data.context : '');
      setFileName(typeof data.fileName === 'string' ? data.fileName : '');
      setSelectedMode(isStudyMode(data.selectedMode) ? data.selectedMode : 'general');
      setLiteMode(Boolean(data.liteMode));
    } catch {
      // ignore invalid storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      'kaalaman_chat',
      JSON.stringify({ messages, context, fileName, selectedMode, liteMode }),
    );
  }, [messages, context, fileName, selectedMode, liteMode]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const notify = (message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(''), 4500);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.error) {
        notify(`Upload failed: ${data.error}`);
      } else {
        setContext(data.text ?? '');
        setFileName(data.filename ?? file.name);
        setMessages(prev => trimMessages([
          ...prev,
          { text: `Uploaded ${data.filename ?? file.name}. Notes are ready for chat.`, isUser: false },
        ]));
        notify('File uploaded successfully. Proceed with a question or use Lite Mode.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      notify('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string, modeOverride?: StudyMode) => {
    if (!message.trim()) return;

    const activeMode = modeOverride ?? selectedMode;
    const trimmed = cleanText(message);
    setMessages(prev => trimMessages([...prev, { text: trimmed, isUser: true }]));
    setInput('');

    if (liteMode) {
      const localResponse = createLiteResponse(activeMode, context, trimmed);
      setMessages(prev => trimMessages([...prev, { text: localResponse, isUser: false }]));
      speak(localResponse);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, context, mode: activeMode }),
      });
      const data = await response.json();

      if (data.error) {
        notify(`Chat failed: ${data.error}`);
        if (!data.response) {
          const fallback = createLiteResponse(activeMode, context, trimmed);
          setMessages(prev => trimMessages([...prev, { text: fallback, isUser: false }]));
          speak(fallback);
        }
      } else {
        const answer = data.response ?? 'Walang sagot mula sa AI. Subukan muli.';
        setMessages(prev => trimMessages([...prev, { text: answer, isUser: false }]));
        speak(answer);
      }
    } catch (error) {
      console.error('Chat failed:', error);
      const fallback = createLiteResponse(activeMode, context, trimmed);
      setMessages(prev => trimMessages([...prev, { text: fallback, isUser: false }]));
      notify('AI service unavailable. Lite Mode response generated.');
      speak(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (modeId: StudyMode) => {
    setSelectedMode(modeId);
    const quickPrompts: Record<StudyMode, string> = {
      summary: 'Paki-summarize ang na-upload na notes sa paraang madaling maintindihan.',
      quiz: 'Gumawa ng maikling quiz na 3 tanong batay sa na-upload na notes.',
      explain: 'Ipaliwanag ang mahahalagang konsepto sa na-upload na notes sa babae o lalaki na mag-aaral.',
      translate: 'Isalin ang huling mensahe ko sa Filipino nang natural at malinaw.',
      general: 'Tulungan mo ako sa pag-aaral batay sa na-upload na notes.',
    };
    sendMessage(quickPrompts[modeId] || quickPrompts.general, modeId);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      notify('Speech recognition hindi sinusuportahan sa browser na ito.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      notify('Speech recognition hindi sinusuportahan sa browser na ito.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = voiceLang;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (!transcript) return;
      setInput(transcript);
      sendMessage(transcript);
    };
    recognitionRef.current.onerror = () => {
      setIsListening(false);
      notify('Speech recognition error. Please try again.');
    };

    recognitionRef.current.start();
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceLang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const selectedModeLabel = studyModes.find((mode) => mode.id === selectedMode)?.label ?? 'General';


  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="gradient-bg absolute inset-0 opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/50"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="animate-slide-down">
              <div className="flex items-center gap-3">
                <div className="text-4xl">📚</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">Kaalaman</p>
                  <h1 className="text-gradient mt-1 text-2xl font-bold sm:text-3xl">AI Study Companion</h1>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-300 sm:text-base">
                Upload notes, ask in Tagalog or English, get smart summaries & quizzes
              </p>
            </div>
            
            <div className="animate-slide-down flex flex-wrap gap-3 md:flex-nowrap">
              <div className="card-glass flex items-center gap-2 px-4 py-2">
                <span className="text-2xl">🌙</span>
                <div className="text-sm">
                  <p className="font-medium text-white">Lite Mode</p>
                  <label className="mt-1 flex cursor-pointer items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={liteMode} 
                      onChange={() => setLiteMode(!liteMode)} 
                      className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/10 text-blue-500 accent-blue-500" 
                    />
                    <span className="text-xs text-slate-300">{liteMode ? 'On' : 'Off'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Study Mode Buttons */}
          <div className="flex flex-wrap gap-2">
            {studyModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSelectedMode(mode.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  selectedMode === mode.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                    : 'border border-white/20 bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Section: Upload & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Upload Section */}
          <div className="card-modern animate-slide-up p-6 sm:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📄</span>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Upload Your Notes</h2>
                  <p className="mt-1 text-sm text-slate-600">PDF, DOCX, TXT, or Markdown files</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="group relative flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-6 transition-all duration-200 hover:border-blue-500 hover:bg-blue-100/50">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.txt,.md" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  disabled={loading}
                />
                <span className="text-3xl group-hover:scale-110 transition-transform">📤</span>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">Click to upload</p>
                  <p className="text-sm text-blue-700">or drag and drop</p>
                </div>
              </label>

              {fileName && (
                <div className="animate-pulse-glow rounded-2xl border border-green-300 bg-green-50 px-4 py-3 text-sm">
                  <p className="font-semibold text-green-900">✓ File uploaded</p>
                  <p className="mt-1 text-green-700">{fileName}</p>
                </div>
              )}

              {context && (
                <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Preview</p>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-700">
                    {context.slice(0, 500)}{context.length > 500 ? '…' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-modern animate-slide-up delay-100 space-y-4 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
                <p className="mt-1 text-sm text-slate-600">One-tap study helpers</p>
              </div>
            </div>

            <div className="space-y-3">
              {quickActions.map(({ action, label, icon }) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => handleQuickAction(action)}
                  className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-3 text-left shadow-md transition-all duration-200 hover:shadow-lg hover:from-blue-50 hover:to-blue-50"
                >
                  <div className="absolute inset-0 translate-y-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 transition-transform duration-200 group-hover:translate-y-0"></div>
                  <div className="relative flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <span className="font-semibold text-slate-900">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="card-modern animate-slide-up delay-200 p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💬</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Chat</h2>
                <p className="mt-1 text-sm text-slate-600">Mode: <span className="font-semibold text-blue-600">{selectedModeLabel}</span> {liteMode && '(Lite)'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <span className="rounded-full bg-slate-100 px-3 py-2 font-medium text-slate-700">🎤 {voiceLang === 'tl-PH' ? 'Tagalog' : 'English'}</span>
              <span className={`rounded-full px-3 py-2 font-medium ${liteMode ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                {liteMode ? '⚡ Lite Mode' : '🤖 AI Mode'}
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Chat Area */}
            <div className="space-y-4">
              {/* Input Section */}
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !loading && sendMessage(input)}
                    placeholder="Ask anything in English or Tagalog..."
                    className="input-modern flex-1"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => sendMessage(input)}
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? '⏳' : '✈️'} {loading ? 'Sending' : 'Send'}
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={startListening}
                    className={`relative overflow-hidden rounded-2xl px-4 py-3 text-sm font-semibold text-white transition duration-200 ${
                      isListening
                        ? 'animate-pulse bg-red-600 shadow-lg shadow-red-600/50 hover:bg-red-500'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg hover:from-emerald-500 hover:to-emerald-400'
                    }`}
                    disabled={loading}
                  >
                    {isListening ? '🔴 Listening...' : '🎤 Speak'}
                  </button>
                  <select
                    aria-label="Voice language"
                    value={voiceLang}
                    onChange={(e) => setVoiceLang(e.target.value)}
                    className="input-modern"
                  >
                    <option value="tl-PH">📍 Tagalog</option>
                    <option value="en-US">🇺🇸 English</option>
                  </select>
                </div>
              </div>

              {/* Messages Area */}
              <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm p-4 sm:p-6 min-h-96 max-h-96 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <span className="text-5xl">👋</span>
                    <p className="text-sm text-slate-600">Start by uploading notes or using a quick action</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`animate-slide-up rounded-2xl p-4 ${
                          msg.isUser
                            ? 'ml-auto max-w-xs bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg'
                            : 'mr-auto max-w-xs bg-gradient-to-br from-slate-200 to-slate-100 text-slate-900 shadow-md'
                        }`}
                      >
                        <p className="text-sm leading-6 whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                    ))}
                    <div ref={messageEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Sidebar Tips */}
            <div className="space-y-4">
              <div className="card-glass rounded-2xl p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white">💡 Tips</p>
                  <ul className="mt-3 space-y-2 text-xs text-slate-200">
                    <li>• Upload first for context</li>
                    <li>• Use quick actions</li>
                    <li>• Try Lite Mode offline</li>
                    <li>• Speak in any language</li>
                  </ul>
                </div>
                <div className="border-t border-white/20 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">Status</p>
                  <div className="mt-2 space-y-1 text-xs text-slate-300">
                    <p>Mode: <strong>{selectedModeLabel}</strong></p>
                    <p>File: <strong>{fileName ? '✓ Ready' : '○ None'}</strong></p>
                    <p>Network: <strong>{liteMode ? 'Offline' : 'Online'}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="animate-slide-down fixed bottom-6 left-4 right-4 max-w-md rounded-2xl border border-blue-300 bg-gradient-to-r from-blue-500/20 to-blue-600/20 px-4 py-3 text-sm text-blue-100 backdrop-blur-md shadow-xl sm:left-auto sm:bottom-8">
            ℹ️ {notification}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-400 backdrop-blur-md sm:px-6">
        <p>Kaalaman © 2026 • Made for Filipino students by Copilot</p>
      </footer>
    </div>
  );
}
