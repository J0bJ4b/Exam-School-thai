import { ExamSet } from '../types/exam';
import { AIProviderId, AISettings } from './aiSettings';

interface GenerateOptions {
  grade: string;
  subject: string;
  subjectId: string;
  topic: string;
  questionCount: number;
  difficulty: string;
  termType: string;
  additionalPrompt?: string;
  provider: AIProviderId;
  apiKey: string;
}

const SYSTEM_INSTRUCTION = `คุณเป็นผู้เชี่ยวชาญการออกข้อสอบระดับประถมศึกษา (ป.1 - ป.6) ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐานของกระทรวงศึกษาธิการไทย (สพฐ.)
หน้าที่ของคุณคือการคิดข้อสอบปรนัย 4 ตัวเลือก (ก, ข, ค, ง) ที่มีคุณภาพสูง ชัดเจน ไม่กำกวม เหมาะกับวัยและระดับชั้นของเด็กประถมอย่างแท้จริง
เกณฑ์สำคัญ:
1. ภาษาและคำศัพท์: ป.1-2 ใช้คำง่าย ประโยคสั้น กระชับ / ป.3-4 เริ่มใช้การคิดเชื่อมโยง / ป.5-6 มีการวิเคราะห์และโจทย์ปัญหาแบบ O-NET
2. มี 4 ตัวเลือกเสมอ คือ ก, ข, ค, ง
3. มีคำตอบที่ถูกต้องชัดเจนเพียง 1 ตัวเลือก
4. มีคำอธิบายเฉลยที่เข้าใจง่าย อธิบายเหตุผลว่าทำไมถึงถูก และทำไมตัวเลือกอื่นจึงผิด
5. มี "คำแนะนำสำหรับครู" (teachingTip) แนะนำจุดสังเกตหรือข้อผิดพลาดทั่วไปที่เด็กประถมชอบตอบผิด
6. ห้ามมีคำถามที่สร้างความสับสนหรือมีคำตอบถูกหลายข้อ`;

function buildPrompt(opts: GenerateOptions): string {
  return `กรุณาออกข้อสอบจำนวน ${opts.questionCount} ข้อ สำหรับ:
- ระดับชั้น: ${opts.grade}
- รายวิชา: ${opts.subject}
- หัวข้อ/เนื้อหา: ${opts.topic}
- ระดับความยาก: ${opts.difficulty}
- ประเภทแบบทดสอบ: ${opts.termType}
${opts.additionalPrompt ? `- คำขอเพิ่มเติมจากครูผู้สอน: ${opts.additionalPrompt}` : ''}

สำคัญมาก: ต้องตอบกลับเป็น JSON Object เท่านั้น โดยมีโครงสร้างดังนี้:
{
  "title": "ชื่อชุดข้อสอบ เช่น แบบทดสอบ${opts.subject} ${opts.grade} เรื่อง${opts.topic}",
  "questions": [
    {
      "number": 1,
      "question": "โจทย์คำถามภาษาไทย",
      "choices": [
        {"key": "ก", "text": "ตัวเลือก ก"},
        {"key": "ข", "text": "ตัวเลือก ข"},
        {"key": "ค", "text": "ตัวเลือก ค"},
        {"key": "ง", "text": "ตัวเลือก ง"}
      ],
      "correctAnswer": "ก",
      "explanation": "คำอธิบายเฉลยละเอียด",
      "teachingTip": "คำแนะนำการสอนสำหรับครู"
    }
  ]
}`;
}

function parseAndFormatExam(rawText: string, opts: GenerateOptions): ExamSet {
  // Strip markdown fences
  let clean = rawText.trim();
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(clean);
  } catch (e: any) {
    // Attempt extracting json substring
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error(`ไม่สามารถแปลงข้อมูลที่ได้จาก AI เป็นรูปแบบข้อสอบได้: ${e?.message}`);
    }
  }

  const formattedQuestions = (parsed.questions || []).map((q: any, idx: number) => ({
    id: `q-${Date.now()}-${idx + 1}`,
    number: q.number || idx + 1,
    question: q.question || '',
    choices: Array.isArray(q.choices)
      ? q.choices.map((c: any) => ({
          key: ['ก', 'ข', 'ค', 'ง'].includes(c.key)
            ? c.key
            : ['A', 'B', 'C', 'D'].includes(c.key)
            ? ['ก', 'ข', 'ค', 'ง'][['A', 'B', 'C', 'D'].indexOf(c.key)]
            : 'ก',
          text: String(c.text || ''),
        }))
      : [],
    correctAnswer: ['ก', 'ข', 'ค', 'ง'].includes(q.correctAnswer) ? q.correctAnswer : 'ก',
    explanation: q.explanation || '',
    teachingTip: q.teachingTip || '',
  }));

  return {
    id: `exam-${Date.now()}`,
    title: parsed.title || `ชุดข้อสอบ ${opts.subject} ${opts.grade}: ${opts.topic}`,
    grade: opts.grade as any,
    subject: opts.subject,
    subjectId: opts.subjectId as any,
    topic: opts.topic,
    difficulty: opts.difficulty as any,
    termType: opts.termType as any,
    totalQuestions: formattedQuestions.length,
    questions: formattedQuestions,
    createdAt: new Date().toISOString().split('T')[0],
    timerPerQuestion: 60,
  };
}

export async function generateExamDirectFromBrowser(opts: GenerateOptions): Promise<ExamSet> {
  const { provider, apiKey } = opts;
  const prompt = buildPrompt(opts);

  if (provider === 'gemini') {
    // Direct Google Gemini API call from browser
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Gemini API (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Google Gemini ไม่ได้ส่งเนื้อหาข้อสอบกลับมา');
    return parseAndFormatExam(text, opts);
  }

  // OpenAI Compatible providers
  let endpoint = '';
  let model = '';

  if (provider === 'groq') {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    model = 'llama-3.3-70b-versatile';
  } else if (provider === 'openai') {
    endpoint = 'https://api.openai.com/v1/chat/completions';
    model = 'gpt-4o-mini';
  } else if (provider === 'openrouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    model = 'meta-llama/llama-3.3-70b-instruct';
  } else if (provider === 'deepseek') {
    endpoint = 'https://api.deepseek.com/chat/completions';
    model = 'deepseek-chat';
  } else {
    throw new Error(`ไม่รองรับ provider: ${provider}`);
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${provider.toUpperCase()} API (${res.status}): ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`ไม่ได้รับเนื้อหาข้อสอบจาก ${provider.toUpperCase()}`);
  return parseAndFormatExam(content, opts);
}
