'use client';

import { useEffect, useRef, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

type ChatMessage = { text: string; isUser: boolean; timestamp: number };

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const cleanText = (value: string) => value.replace(/\s+/g, ' ').trim();

export default function Home() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

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
        alert(`Upload failed: ${data.error}`);
      } else {
        setContext(data.text ?? '');
        setFileName(data.filename ?? file.name);
        setMessages(prev => [...prev, { 
          text: `📎 Document uploaded: ${data.filename ?? file.name}`, 
          isUser: false,
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || loading) return;

    const trimmed = cleanText(message);
    setMessages(prev => [...prev, { text: trimmed, isUser: true, timestamp: Date.now() }]);
    setInput('');

    try {
      setLoading(true);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, context }),
      });
      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, { 
          text: `❌ Error: ${data.error}. ${data.details || ''}`, 
          isUser: false,
          timestamp: Date.now()
        }]);
      } else {
        const answer = data.response ?? 'No response received.';
        setMessages(prev => [...prev, { text: answer, isUser: false, timestamp: Date.now() }]);
      }
    } catch (error) {
      console.error('Chat failed:', error);
      setMessages(prev => [...prev, { 
        text: '❌ Connection error. Please try again.', 
        isUser: false,
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      alert('Voice recognition error.');
    };

    recognition.start();
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const newChat = () => {
    setMessages([]);
    setContext('');
    setFileName('');
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white">
      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-zinc-800 p-8 shadow-2xl animate-slide-up">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                <span className="text-2xl font-bold">K</span>
              </div>
              <h2 className="text-2xl font-bold">Welcome to Kaalaman</h2>
              <p className="mt-2 text-sm text-zinc-400">Sign in to save your conversations</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-medium hover:bg-zinc-800 transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <button
                onClick={() => signIn('github', { callbackUrl: '/' })}
                className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-medium hover:bg-zinc-800 transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>
            </div>

            <button
              onClick={() => setShowAuth(false)}
              className="mt-6 w-full text-sm text-zinc-400 hover:text-white transition"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`flex flex-col bg-[#0a0a0a] border-r border-zinc-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
        <div className="flex flex-col h-full p-3">
          {/* New Chat Button */}
          <button
            onClick={newChat}
            className="flex items-center gap-3 rounded-lg border border-zinc-700 px-3 py-2.5 mb-2 hover:bg-zinc-900 transition group"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">New chat</span>
          </button>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto">
            <div className="text-xs font-semibold text-zinc-500 px-3 py-2">Recent</div>
            {messages.length > 0 && (
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 transition text-sm text-zinc-300 truncate">
                {messages[0]?.text.slice(0, 30)}...
              </button>
            )}
          </div>

          {/* Bottom Section */}
          <div className="border-t border-zinc-800 pt-3 space-y-2">
            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={handleFileUpload}
              disabled={loading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 transition text-sm"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>{loading ? 'Uploading...' : 'Upload file'}</span>
            </button>

            {fileName && (
              <div className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  <span className="text-zinc-400 truncate">{fileName}</span>
                </div>
              </div>
            )}

            {/* User Profile */}
            {session?.user ? (
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 transition"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium truncate">{session.user.name}</div>
                  <div className="text-xs text-zinc-500">Sign out</div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 transition"
              >
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-sm">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 hover:bg-zinc-900 transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm">
                K
              </div>
              <span className="font-semibold">Kaalaman</span>
            </div>
          </div>
          <div className="text-xs text-zinc-500">Gemini 2.5 Flash</div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-2xl text-center px-4">
                <div className="mb-6 mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <span className="text-3xl font-bold">K</span>
                </div>
                <h1 className="text-4xl font-bold mb-4">How can I help you today?</h1>
                <p className="text-zinc-400 mb-8">Ask me anything or upload a document to get started</p>
                
                <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                  <button
                    onClick={() => sendMessage("Explain quantum computing")}
                    className="text-left p-4 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition"
                  >
                    <div className="text-sm font-medium mb-1">Explain a concept</div>
                    <div className="text-xs text-zinc-500">Quantum computing basics</div>
                  </button>
                  <button
                    onClick={() => sendMessage("Write a Python function")}
                    className="text-left p-4 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition"
                  >
                    <div className="text-sm font-medium mb-1">Write code</div>
                    <div className="text-xs text-zinc-500">Python function example</div>
                  </button>
                  <button
                    onClick={() => sendMessage("Summarize recent AI trends")}
                    className="text-left p-4 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition"
                  >
                    <div className="text-sm font-medium mb-1">Get insights</div>
                    <div className="text-xs text-zinc-500">AI industry trends</div>
                  </button>
                  <button
                    onClick={() => sendMessage("Help me brainstorm ideas")}
                    className="text-left p-4 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition"
                  >
                    <div className="text-sm font-medium mb-1">Brainstorm</div>
                    <div className="text-xs text-zinc-500">Creative ideas</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 mb-6 ${msg.isUser ? 'justify-end' : ''}`}>
                  {!msg.isUser && (
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      K
                    </div>
                  )}
                  <div className={`flex-1 ${msg.isUser ? 'max-w-xl' : ''}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.isUser 
                        ? 'bg-zinc-800 ml-auto' 
                        : 'bg-transparent'
                    }`}>
                      <p className="whitespace-pre-wrap leading-7">{msg.text}</p>
                    </div>
                  </div>
                  {msg.isUser && (
                    <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-4 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm">
                    K
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-zinc-600 animate-bounce"></div>
                      <div className="h-2 w-2 rounded-full bg-zinc-600 animate-bounce delay-100"></div>
                      <div className="h-2 w-2 rounded-full bg-zinc-600 animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-800 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 focus-within:border-zinc-600 transition">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Kaalaman..."
                disabled={loading}
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none placeholder-zinc-500 max-h-[200px]"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                  className={`p-2 rounded-lg transition ${
                    isListening ? 'bg-red-500 text-white' : 'hover:bg-zinc-800'
                  }`}
                  title="Voice input"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="p-2 rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-zinc-600 mt-2">
              Kaalaman can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
