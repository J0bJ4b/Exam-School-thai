import React, { useState } from 'react';
import { GradeLevel, SubjectId, ExamSet } from '../types/exam';
import { SUBJECTS, GRADE_LEVELS } from '../data/subjects';
import { generateCurriculumExam } from '../data/curriculumGenerator';
import {
  Sparkles,
  X,
  BookOpen,
  GraduationCap,
  Clock,
  ListOrdered,
  Sliders,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Flame,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface ExamGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamGenerated: (exam: ExamSet) => void;
}

export const ExamGeneratorModal: React.FC<ExamGeneratorModalProps> = ({
  isOpen,
  onClose,
  onExamGenerated,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('ป.3');
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>('science');
  const [topic, setTopic] = useState('ปัจจัยในการดำรงชีวิตของพืชและสัตว์ และวัฏจักรชีวิต');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<'ง่าย' | 'ปานกลาง' | 'ท้าทาย' | 'คละระดับ'>('ปานกลาง');
  const [termType, setTermType] = useState<'ทั่วไป' | 'กลางภาค' | 'ปลายภาค' | 'เตรียมสอบแข่งขัน/O-NET'>('กลางภาค');
  const [timerPerQuestion, setTimerPerQuestion] = useState<number>(60);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [is503Error, setIs503Error] = useState(false);

  if (!isOpen) return null;

  const currentSubject = SUBJECTS.find((s) => s.id === selectedSubjectId) || SUBJECTS[0];

  const handleSubjectChange = (subId: SubjectId) => {
    setSelectedSubjectId(subId);
    const sub = SUBJECTS.find((s) => s.id === subId);
    if (sub && sub.defaultTopics.length > 0) {
      setTopic(sub.defaultTopics[0]);
    }
  };

  // Instant fallback to curriculum bank if AI service is busy or user wants instant generation
  const handleInstantGenerate = () => {
    const instantExam = generateCurriculumExam({
      grade: selectedGrade,
      subject: currentSubject.name,
      subjectId: selectedSubjectId,
      topic: topic.trim() || currentSubject.defaultTopics[0] || 'บทเรียนทั่วไป',
      questionCount,
      difficulty,
      termType,
    });
    instantExam.timerPerQuestion = timerPerQuestion;
    onExamGenerated(instantExam);
    onClose();
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMessage('กรุณาระบุหัวข้อหรือเนื้อหาข้อสอบที่ต้องการ');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setIs503Error(false);

    try {
      const response = await fetch('/api/gemini/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: selectedGrade,
          subject: currentSubject.name,
          topic: topic.trim(),
          questionCount,
          difficulty,
          termType,
          additionalPrompt: additionalPrompt.trim(),
        }),
      });

      let data: any = null;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        // If Vercel returned HTML or text error (e.g. 504 Gateway Timeout or 500 Server Error)
        console.error('Non-JSON response from server:', responseText);
        throw new Error(
          response.status === 504 || response.status === 408
            ? 'การสร้างข้อสอบใช้เวลานานเกินกว่ากำหนด (Timeout) แนะนำให้ลดจำนวนข้อเหลือ 20 ข้อ หรือใช้ปุ่มสร้างด่วนจากคลัง สพฐ.'
            : `เซิร์ฟเวอร์ตอบกลับผิดพลาด (${response.status}): ${responseText.slice(0, 120)}... แนะนำให้ตรวจสอบ API Key ใน Vercel หรือกดใช้คลัง สพฐ.`
        );
      }

      if (!response.ok || !data?.success) {
        if (response.status === 503 || data?.is503) {
          setIs503Error(true);
        }
        throw new Error(data?.error || 'เกิดข้อผิดพลาดในการสร้างข้อสอบ');
      }

      const generatedExam: ExamSet = {
        ...data.exam,
        subjectId: selectedSubjectId,
        timerPerQuestion,
      };

      onExamGenerated(generatedExam);
      onClose();
    } catch (err: any) {
      console.error(err);
      const is503 =
        err?.message?.includes('503') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('หนาแน่น') ||
        is503Error;
      if (is503) {
        setIs503Error(true);
      }
      setErrorMessage(
        err.message || 'ไม่สามารถติดต่อ AI เพื่อสร้างข้อสอบได้ กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 md:px-8 py-5 bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>สร้างชุดข้อสอบประถมด้วย AI</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  สพฐ. ป.1-6
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ระบบ AI ช่วยคิดคำถาม ตัวเลือก ก ข ค ง เฉลย และเทคนิคการสอนตามหลักสูตร
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Error Banner with 503 / High Demand Fallback */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 text-sm space-y-3 shadow-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-300 text-base mb-1">
                    {is503Error
                      ? 'เซิร์ฟเวอร์ AI กำลังมีผู้ใช้งานหนาแน่นชั่วคราว (Google Gemini 503: High Demand)'
                      : 'พบข้อผิดพลาดในการเชื่อมต่อกับ AI'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
                </div>
              </div>

              {/* Action Buttons for Error */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-600 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>ลองใหม่อีกครั้ง (Retry)</span>
                </button>

                <button
                  type="button"
                  onClick={handleInstantGenerate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.02]"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>สร้างทันทีจากคลังมาตรฐาน สพฐ. (ไม่ต้องรอ AI)</span>
                </button>
              </div>
            </div>
          )}

          {/* 1. Grade Level Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>1. เลือกระดับชั้นประถมศึกษา:</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {GRADE_LEVELS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGrade(g.id)}
                  className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                    selectedGrade === g.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30 scale-105 font-bold'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <div className="text-base font-extrabold">{g.id}</div>
                  <div className="text-[10px] opacity-75">{g.ageRange}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Subject Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>2. เลือกกลุ่มสาระการเรียนรู้ / รายวิชา:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SUBJECTS.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSubjectChange(sub.id)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    selectedSubjectId === sub.id
                      ? 'bg-indigo-950/60 border-indigo-500 text-white ring-2 ring-indigo-500/40'
                      : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${sub.color}`} />
                  <span className="text-sm font-medium truncate">{sub.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Topic & Quick Suggestion Chips */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>3. หัวข้อ / บทเรียน / เนื้อหาที่ต้องการออกสอบ:</span>
              <span className="text-xs text-indigo-400">เลือกจากตัวอย่างด้านล่างได้</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="เช่น การบวกลบเลขระคน, มาตราแม่กบ, ระบบสุริยะ..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 text-sm mb-2"
            />
            {/* Quick Topic Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentSubject.defaultTopics.map((top, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopic(top)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    topic === top
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                  }`}
                >
                  + {top}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Question Count & Difficulty & Term (as requested: 20 - 40 questions) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Question count (20 - 40) */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>จำนวนข้อสอบ (20 - 40 ข้อ):</span>
                <strong className="text-indigo-400 font-mono text-sm">{questionCount} ข้อ</strong>
              </label>
              <div className="flex items-center gap-1.5">
                {[20, 25, 30, 35, 40].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                      questionCount === num
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                ระดับความยาก:
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="ง่าย">ง่าย (พื้นฐานความรู้ความจำ)</option>
                <option value="ปานกลาง">ปานกลาง (ประยุกต์ใช้ความรู้)</option>
                <option value="ท้าทาย">ท้าทาย (วิเคราะห์โจทย์ปัญหา)</option>
                <option value="คละระดับ">คละระดับ (ง่าย 30% กลาง 50% ยาก 20%)</option>
              </select>
            </div>

            {/* Term / Exam Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                ประเภทการสอบ:
              </label>
              <select
                value={termType}
                onChange={(e) => setTermType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="ทั่วไป">แบบทดสอบท้ายบท / เก็บสะสม</option>
                <option value="กลางภาค">สอบกลางภาค</option>
                <option value="ปลายภาค">สอบปลายภาค</option>
                <option value="เตรียมสอบแข่งขัน/O-NET">เตรียมสอบแข่งขัน / O-NET</option>
              </select>
            </div>
          </div>

          {/* 5. Additional Teacher Instructions (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              คำสั่งเพิ่มเติมสำหรับ AI (ระบุหรือไม่ก็ได้):
            </label>
            <input
              type="text"
              value={additionalPrompt}
              onChange={(e) => setAdditionalPrompt(e.target.value)}
              placeholder="เช่น เน้นโจทย์ปัญหาชีวิตประจำวัน, ไม่เอาคำศัพท์ยากเกินไป, เน้นภาพเปรียบเทียบ..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 md:px-8 py-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            ระบบใช้ Gemini AI สร้างข้อสอบ 4 ตัวเลือกพร้อมเฉลยละเอียด
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleInstantGenerate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-xs md:text-sm font-semibold transition-all hover:scale-[1.01]"
              title="สร้างข้อสอบตามมาตรฐาน สพฐ. ทันทีโดยไม่ต้องรอ AI"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">สร้างด่วนจาก</span>คลัง สพฐ.
            </button>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors"
            >
              ยกเลิก
            </button>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 md:px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI กำลังออกข้อสอบ {questionCount} ข้อ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>สั่ง AI ออกข้อสอบ ({questionCount} ข้อ)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
