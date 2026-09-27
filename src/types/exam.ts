export type GradeLevel = 'ป.1' | 'ป.2' | 'ป.3' | 'ป.4' | 'ป.5' | 'ป.6';

export type SubjectId =
  | 'math'
  | 'thai'
  | 'science'
  | 'english'
  | 'social'
  | 'history'
  | 'health'
  | 'art'
  | 'computing';

export interface SubjectInfo {
  id: SubjectId;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  defaultTopics: string[];
}

export type ChoiceKey = 'ก' | 'ข' | 'ค' | 'ง';

export interface QuestionChoice {
  key: ChoiceKey;
  text: string;
}

export interface Question {
  id: string;
  number: number;
  question: string;
  choices: QuestionChoice[];
  correctAnswer: ChoiceKey;
  explanation: string;
  teachingTip?: string;
  hint?: string;
  topic?: string;
}

export interface ExamSet {
  id: string;
  title: string;
  grade: GradeLevel;
  subject: string;
  subjectId: SubjectId;
  topic: string;
  difficulty: 'ง่าย' | 'ปานกลาง' | 'ท้าทาย' | 'คละระดับ';
  termType: 'ทั่วไป' | 'กลางภาค' | 'ปลายภาค' | 'เตรียมสอบแข่งขัน/O-NET';
  totalQuestions: number;
  questions: Question[];
  createdAt: string;
  timerPerQuestion: number; // seconds, 0 = no limit
}

export interface TVSessionState {
  sessionId: string;
  examId: string;
  examTitle: string;
  grade: string;
  subject: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  isTimerRunning: boolean;
  remainingSeconds: number;
  timerPerQuestion: number;
  showAnswerOnTV: boolean;
  showChoicesOnTV: boolean;
  fontSize: 'normal' | 'large' | 'huge';
  studentVotes?: Record<ChoiceKey, number>;
  lastUpdated: number;
}
