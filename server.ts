import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '15mb' }));

// Shared Gemini client initialization per instructions
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory sessions store for remote TV sync
interface LiveSession {
  sessionId: string;
  pin: string;
  examId: string;
  examData?: any;
  currentQuestionIndex: number;
  totalQuestions: number;
  isTimerRunning: boolean;
  remainingSeconds: number;
  timerPerQuestion: number;
  showAnswerOnTV: boolean;
  showChoicesOnTV: boolean;
  fontSize: 'normal' | 'large' | 'huge';
  studentVotes: Record<string, number>;
  lastUpdated: number;
}

const sessions = new Map<string, LiveSession>();

// Periodically clean up sessions older than 24 hours
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastUpdated > 24 * 60 * 60 * 1000) {
      sessions.delete(id);
    }
  }
}, 60 * 60 * 1000);

// API: Generate Exam with Gemini
app.post('/api/gemini/generate-exam', async (req, res) => {
  try {
    const {
      grade = 'ป.3',
      subject = 'วิทยาศาสตร์',
      topic = 'สิ่งมีชีวิตและการปรับตัว',
      questionCount = 20,
      difficulty = 'ปานกลาง',
      termType = 'ทั่วไป',
      additionalPrompt = '',
    } = req.body;

    const count = Math.min(Math.max(Number(questionCount) || 20, 5), 40);

    const systemInstruction = `คุณเป็นผู้เชี่ยวชาญการออกข้อสอบระดับประถมศึกษา (ป.1 - ป.6) ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐานของกระทรวงศึกษาธิการไทย (สพฐ.)
หน้าที่ของคุณคือการคิดข้อสอบปรนัย 4 ตัวเลือก (ก, ข, ค, ง) ที่มีคุณภาพสูง ชัดเจน ไม่กำกวม เหมาะกับวัยและระดับชั้นของเด็กประถมอย่างแท้จริง
เกณฑ์สำคัญ:
1. ภาษาและคำศัพท์: ป.1-2 ใช้คำง่าย ประโยคสั้น กระชับ / ป.3-4 เริ่มใช้การคิดเชื่อมโยง / ป.5-6 มีการวิเคราะห์และโจทย์ปัญหาแบบ O-NET
2. มี 4 ตัวเลือกเสมอ คือ ก, ข, ค, ง
3. มีคำตอบที่ถูกต้องชัดเจนเพียง 1 ตัวเลือก
4. มีคำอธิบายเฉลยที่เข้าใจง่าย อธิบายเหตุผลว่าทำไมถึงถูก และทำไมตัวเลือกอื่นจึงผิด
5. มี "คำแนะนำสำหรับครู" (teachingTip) แนะนำจุดสังเกตหรือข้อผิดพลาดทั่วไปที่เด็กประถมชอบตอบผิด
6. ห้ามมีคำถามที่สร้างความสับสนหรือมีคำตอบถูกหลายข้อ`;

    const promptText = `กรุณาออกข้อสอบจำนวน ${count} ข้อ สำหรับ:
- ระดับชั้น: ${grade}
- รายวิชา: ${subject}
- หัวข้อ/เนื้อหา: ${topic}
- ระดับความยาก: ${difficulty}
- ประเภทแบบทดสอบ: ${termType}
${additionalPrompt ? `- คำขอเพิ่มเติมจากครูผู้สอน: ${additionalPrompt}` : ''}

ให้ออกข้อสอบจำนวนครบทั้ง ${count} ข้อ พร้อมตัวเลือก ก, ข, ค, ง และเฉลยพร้อมคำอธิบายภาษาไทย`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'ชื่อชุดข้อสอบ เช่น แบบทดสอบวิทยาศาสตร์ ป.3 เรื่องวัฏจักรชีวิต',
            },
            questions: {
              type: Type.ARRAY,
              description: `รายการข้อสอบทั้งหมด ${count} ข้อ`,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.INTEGER, description: 'ลำดับข้อสอบ 1, 2, ...' },
                  question: { type: Type.STRING, description: 'โจทย์คำถามภาษาไทยที่ชัดเจน' },
                  choices: {
                    type: Type.ARRAY,
                    description: 'ตัวเลือก 4 ข้อ ก ข ค ง',
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING, description: 'ก หรือ ข หรือ ค หรือ ง' },
                        text: { type: Type.STRING, description: 'เนื้อหาตัวเลือก' },
                      },
                      required: ['key', 'text'],
                    },
                  },
                  correctAnswer: { type: Type.STRING, description: 'ตัวเลือกที่ถูกต้อง เช่น ก, ข, ค หรือ ง' },
                  explanation: { type: Type.STRING, description: 'คำอธิบายเฉลยอย่างละเอียดและเข้าใจง่ายสำหรับเด็ก' },
                  teachingTip: { type: Type.STRING, description: 'คำแนะนำการสอนสำหรับครู หรือจุดที่เด็กมักเข้าใจผิด' },
                },
                required: ['number', 'question', 'choices', 'correctAnswer', 'explanation'],
              },
            },
          },
          required: ['title', 'questions'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsedData = JSON.parse(jsonText);

    // Format and sanitize questions
    const formattedQuestions = (parsedData.questions || []).map((q: any, idx: number) => ({
      id: `q-${Date.now()}-${idx + 1}`,
      number: q.number || idx + 1,
      question: q.question || '',
      choices: Array.isArray(q.choices) ? q.choices.map((c: any) => ({
        key: ['ก', 'ข', 'ค', 'ง'].includes(c.key) ? c.key : (['A', 'B', 'C', 'D'].includes(c.key) ? ['ก', 'ข', 'ค', 'ง'][['A', 'B', 'C', 'D'].indexOf(c.key)] : 'ก'),
        text: String(c.text || ''),
      })) : [],
      correctAnswer: ['ก', 'ข', 'ค', 'ง'].includes(q.correctAnswer) ? q.correctAnswer : 'ก',
      explanation: q.explanation || '',
      teachingTip: q.teachingTip || '',
    }));

    const resultExam = {
      id: `exam-${Date.now()}`,
      title: parsedData.title || `ชุดข้อสอบ ${subject} ${grade}: ${topic}`,
      grade,
      subject,
      topic,
      difficulty,
      termType,
      totalQuestions: formattedQuestions.length,
      questions: formattedQuestions,
      createdAt: new Date().toISOString().split('T')[0],
      timerPerQuestion: 60,
    };

    return res.json({ success: true, exam: resultExam });
  } catch (error: any) {
    console.error('Error generating exam with Gemini:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'เกิดข้อผิดพลาดในการสร้างข้อสอบด้วย AI กรุณาลองใหม่อีกครั้ง',
    });
  }
});

// API: Session management for TV & Teacher Remote Sync
app.post('/api/session', (req, res) => {
  const { examData, pin, timerPerQuestion = 60 } = req.body;
  const sessionId = pin ? String(pin).toUpperCase() : Math.floor(1000 + Math.random() * 9000).toString();

  const session: LiveSession = {
    sessionId,
    pin: sessionId,
    examId: examData?.id || `exam-${sessionId}`,
    examData,
    currentQuestionIndex: 0,
    totalQuestions: examData?.questions?.length || 0,
    isTimerRunning: false,
    remainingSeconds: timerPerQuestion,
    timerPerQuestion: timerPerQuestion,
    showAnswerOnTV: false,
    showChoicesOnTV: true,
    fontSize: 'large',
    studentVotes: { ก: 0, ข: 0, ค: 0, ง: 0 },
    lastUpdated: Date.now(),
  };

  sessions.set(sessionId, session);
  res.json({ success: true, session });
});

app.get('/api/session/:id', (req, res) => {
  const sessionId = req.params.id.toUpperCase();
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'ไม่พบห้องสอบนี้' });
  }
  res.json({ success: true, session });
});

app.post('/api/session/:id/action', (req, res) => {
  const sessionId = req.params.id.toUpperCase();
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'ไม่พบห้องสอบนี้' });
  }

  const { action, payload } = req.body;

  switch (action) {
    case 'NEXT':
      if (session.currentQuestionIndex < session.totalQuestions - 1) {
        session.currentQuestionIndex += 1;
        session.showAnswerOnTV = false;
        session.remainingSeconds = session.timerPerQuestion;
        session.isTimerRunning = false;
        session.studentVotes = { ก: 0, ข: 0, ค: 0, ง: 0 };
      }
      break;
    case 'PREV':
      if (session.currentQuestionIndex > 0) {
        session.currentQuestionIndex -= 1;
        session.showAnswerOnTV = false;
        session.remainingSeconds = session.timerPerQuestion;
        session.isTimerRunning = false;
        session.studentVotes = { ก: 0, ข: 0, ค: 0, ง: 0 };
      }
      break;
    case 'JUMP':
      if (typeof payload?.index === 'number' && payload.index >= 0 && payload.index < session.totalQuestions) {
        session.currentQuestionIndex = payload.index;
        session.showAnswerOnTV = false;
        session.remainingSeconds = session.timerPerQuestion;
        session.isTimerRunning = false;
        session.studentVotes = { ก: 0, ข: 0, ค: 0, ง: 0 };
      }
      break;
    case 'TOGGLE_TIMER':
      session.isTimerRunning = typeof payload?.running === 'boolean' ? payload.running : !session.isTimerRunning;
      break;
    case 'RESET_TIMER':
      session.remainingSeconds = session.timerPerQuestion;
      session.isTimerRunning = false;
      break;
    case 'SET_TIMER_SECONDS':
      if (typeof payload?.seconds === 'number') {
        session.remainingSeconds = payload.seconds;
        if (payload.seconds <= 0) {
          session.isTimerRunning = false;
        }
      }
      break;
    case 'SET_DEFAULT_TIMER':
      if (typeof payload?.seconds === 'number') {
        session.timerPerQuestion = payload.seconds;
        session.remainingSeconds = payload.seconds;
      }
      break;
    case 'TOGGLE_REVEAL':
      session.showAnswerOnTV = typeof payload?.show === 'boolean' ? payload.show : !session.showAnswerOnTV;
      break;
    case 'SET_FONT_SIZE':
      if (['normal', 'large', 'huge'].includes(payload?.fontSize)) {
        session.fontSize = payload.fontSize;
      }
      break;
    case 'VOTE':
      if (payload?.key && ['ก', 'ข', 'ค', 'ง'].includes(payload.key)) {
        session.studentVotes[payload.key] = (session.studentVotes[payload.key] || 0) + (payload.delta || 1);
        if (session.studentVotes[payload.key] < 0) session.studentVotes[payload.key] = 0;
      }
      break;
    case 'RESET_VOTES':
      session.studentVotes = { ก: 0, ข: 0, ค: 0, ง: 0 };
      break;
    case 'UPDATE_EXAM':
      if (payload?.examData) {
        session.examData = payload.examData;
        session.totalQuestions = payload.examData.questions?.length || 0;
        session.currentQuestionIndex = 0;
        session.showAnswerOnTV = false;
      }
      break;
  }

  session.lastUpdated = Date.now();
  res.json({ success: true, session });
});

// Setup Vite in Dev or Static in Production
async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port} [${isDev ? 'development' : 'production'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
