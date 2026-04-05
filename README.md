# Kaalaman - AI Study Companion

AI-powered study companion built for Philippine students. Upload notes or PDFs, ask questions in English or Tagalog, and get summaries, quizzes, and explanations with a natural Filipino tone.

## Features

- Upload PDF, DOCX, TXT, and MD study notes
- Chat in Tagalog or English
- Voice input and speech synthesis
- Local Lite Mode for offline-friendly summaries, quizzes, and explanations
- Study mode buttons for quick prompts
- Notes preview and automatic chat context
- Simple localStorage persistence for ongoing study sessions

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your OpenAI API key:
   ```bash
   OPENAI_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Upload your notes or PDF file.
2. Select a study mode for summary, quiz, explanation, or translation.
3. Ask questions in English or Tagalog, or use voice input.
4. Enable Lite Mode for local study responses without calling the AI API.

## API Routes

- `POST /api/upload` - Upload and parse notes from files
- `POST /api/chat` - Send chat messages to AI with context and study mode

## Local Study Mode

If OpenAI access is not available, Lite Mode still provides local summaries, quiz prompts, and study-friendly explanations using the uploaded notes.

## Technologies Used

- Next.js 16
- TypeScript
- Tailwind CSS
- OpenAI API
- pdf-parse and mammoth for file extraction

## Notes

- Make sure the uploaded notes are clear and within the text limit for best AI results.
- The app stores chat context locally so you can continue studying across browser reloads.

## License

MIT License.

