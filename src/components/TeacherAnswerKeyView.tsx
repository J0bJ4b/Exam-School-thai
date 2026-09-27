import React, { useState } from 'react';
import { ExamSet, Question } from '../types/exam';
import {
  CheckCircle2,
  Printer,
  Search,
  BookOpen,
  Lightbulb,
  Tv,
  FileText,
  Filter,
  ArrowUpDown,
  Download,
} from 'lucide-react';

interface TeacherAnswerKeyViewProps {
  exam: ExamSet;
  onJumpToQuestionOnTV?: (index: number) => void;
  onOpenPrintModal: (mode: 'answer_key' | 'student_sheet' | 'exam_paper') => void;
}

export const TeacherAnswerKeyView: React.FC<TeacherAnswerKeyViewProps> = ({
  exam,
  onJumpToQuestionOnTV,
  onOpenPrintModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ก' | 'ข' | 'ค' | 'ง'>('all');

  const filteredQuestions = exam.questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(q.number).includes(searchQuery);

    const matchesFilter = selectedFilter === 'all' || q.correctAnswer === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              คู่มือเฉลยและเทคนิคการสอนสำหรับครูผู้สอน
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>{exam.title}</span>
            <span className="text-sm px-2.5 py-0.5 bg-indigo-600/30 text-indigo-300 rounded-lg">
              {exam.grade}
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            จำนวนทั้งหมด {exam.questions.length} ข้อ • วิชา {exam.subject} • ระดับ {exam.difficulty}
          </p>
        </div>

        {/* Print Buttons Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onOpenPrintModal('student_sheet')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-sm font-semibold transition-all hover:scale-[1.02]"
            title="พิมพ์กระดาษคำตอบฝน 20-40 ข้อ สำหรับแจกนักเรียน"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>พิมพ์กระดาษคำตอบนักเรียน</span>
          </button>

          <button
            onClick={() => onOpenPrintModal('exam_paper')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-sm font-semibold transition-all hover:scale-[1.02]"
            title="พิมพ์ชุดข้อสอบพร้อมโจทย์สำหรับแจกนักเรียน"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>พิมพ์ชุดข้อสอบ (ใบงาน)</span>
          </button>

          <button
            onClick={() => onOpenPrintModal('answer_key')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
            title="พิมพ์ใบเฉลยคำตอบพร้อมคำอธิบายสำหรับครู"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ใบเฉลยสำหรับครู</span>
          </button>
        </div>
      </div>

      {/* Quick Answer Key Matrix Grid (ตารางสรุปเฉลยด่วนทุกข้อ 1 - 40) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-base font-bold text-white mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ตารางสรุปเฉลยด่วน (Quick Grading Key)
          </span>
          <span className="text-xs text-slate-400 font-normal">
            คลิกที่เลขข้อเพื่อข้ามไปดูคำอธิบายหรือฉายขึ้นทีวี
          </span>
        </h3>

        <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-20 gap-2">
          {exam.questions.map((q, idx) => (
            <a
              key={q.id || idx}
              href={`#question-${idx + 1}`}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex flex-col items-center justify-center transition-all group"
            >
              <span className="text-xs text-slate-400 group-hover:text-white">ข้อ {idx + 1}</span>
              <span className="text-lg font-black text-emerald-400">{q.correctAnswer}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="ค้นหาโจทย์ หรือ คำอธิบายเฉลย..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>กรองตามคำตอบ:</span>
          {(['all', 'ก', 'ข', 'ค', 'ง'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                selectedFilter === filter
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter === 'all' ? 'ทั้งหมด' : `ข้อ ${filter}`}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Questions List */}
      <div className="space-y-5">
        {filteredQuestions.map((q, idx) => {
          const originalIndex = exam.questions.findIndex((item) => item.number === q.number);

          return (
            <div
              key={q.id || idx}
              id={`question-${q.number}`}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 shadow-md transition-all scroll-mt-24"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-md">
                    {q.number}
                  </span>
                  <h4 className="text-lg md:text-xl font-semibold text-white leading-relaxed">
                    {q.question}
                  </h4>
                </div>

                {onJumpToQuestionOnTV && originalIndex >= 0 && (
                  <button
                    onClick={() => onJumpToQuestionOnTV(originalIndex)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
                    title="ฉายข้อนี้ขึ้นจอทีวีทันที"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>ฉายข้อนี้</span>
                  </button>
                )}
              </div>

              {/* 4 Choices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {q.choices.map((choice) => {
                  const isCorrect = choice.key === q.correctAnswer;
                  return (
                    <div
                      key={choice.key}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                        isCorrect
                          ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-100 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {choice.key}
                      </span>
                      <span className="flex-1 text-sm font-medium">{choice.text}</span>
                      {isCorrect && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                          คำตอบที่ถูกต้อง ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation & Teaching Tip Box */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-bold text-emerald-400">คำอธิบายเฉลย: </span>
                    <span className="text-slate-300 leading-relaxed">{q.explanation}</span>
                  </div>
                </div>

                {q.teachingTip && (
                  <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800/80">
                    <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-200/90 leading-relaxed">
                      <span className="font-bold text-amber-400">คำแนะนำการสอนสำหรับคุณครู: </span>
                      <span>{q.teachingTip}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            ไม่พบข้อสอบที่ตรงกับการค้นหา &quot;{searchQuery}&quot;
          </div>
        )}
      </div>
    </div>
  );
};
