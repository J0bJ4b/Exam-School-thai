import React from 'react';
import { ExamSet } from '../types/exam';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

interface PrintExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamSet;
  mode: 'answer_key' | 'student_sheet' | 'exam_paper';
}

export const PrintExamModal: React.FC<PrintExamModalProps> = ({
  isOpen,
  onClose,
  exam,
  mode,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header (Hidden on actual print) */}
        <div className="no-print px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-lg">
              {mode === 'student_sheet' && 'พิมพ์กระดาษคำตอบสำหรับนักเรียน'}
              {mode === 'exam_paper' && 'พิมพ์ชุดข้อสอบ (ใบงาน)'}
              {mode === 'answer_key' && 'พิมพ์คู่มือเฉลยสำหรับครูผู้สอน'}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ทันที (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area (Styled like clean white paper for print) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950">
          <div
            id="printable-content"
            className="bg-white text-slate-900 p-8 md:p-12 rounded-xl shadow-2xl max-w-3xl mx-auto font-['Sarabun',sans-serif] leading-normal"
          >
            {/* Header of Thai Exam Paper */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
              <h2 className="text-xl md:text-2xl font-bold">{exam.title}</h2>
              <div className="flex justify-between items-center text-sm mt-2 text-slate-700 font-medium">
                <span>กลุ่มสาระการเรียนรู้: {exam.subject}</span>
                <span>ระดับชั้น: {exam.grade}</span>
                <span>จำนวน: {exam.questions.length} ข้อ</span>
              </div>
              <div className="mt-4 pt-3 border-t border-dashed border-slate-400 flex flex-wrap justify-between text-sm text-slate-800">
                <span className="min-w-[200px]">ชื่อ-นามสกุล: ..............................................................</span>
                <span>ชั้น: .......... / ..........</span>
                <span>เลขที่: ............</span>
              </div>
            </div>

            {/* Mode 1: Student Bubble Answer Sheet (กระดาษคำตอบฝน ก ข ค ง) */}
            {mode === 'student_sheet' && (
              <div>
                <p className="text-xs text-center text-slate-600 mb-6 italic">
                  คำชี้แจง: ให้นักเรียนทำเครื่องหมายกากบาท (X) หรือระบายทับตัวอักษรที่เป็นคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                  {exam.questions.map((q) => (
                    <div
                      key={q.number}
                      className="flex items-center justify-between border-b border-slate-200 py-1.5 px-2"
                    >
                      <span className="font-bold text-slate-800 w-8">{q.number}.</span>
                      <div className="flex items-center gap-2">
                        {(['ก', 'ข', 'ค', 'ง'] as const).map((key) => (
                          <span
                            key={key}
                            className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center font-bold text-xs"
                          >
                            {key}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 2: Full Exam Paper (ชุดข้อสอบแจกนักเรียน) */}
            {mode === 'exam_paper' && (
              <div className="space-y-6">
                <p className="text-xs text-slate-600 mb-4 italic">
                  คำชี้แจง: จงเลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว แล้วทำเครื่องหมายลงในกระดาษคำตอบ
                </p>

                {exam.questions.map((q) => (
                  <div key={q.number} className="text-sm border-b border-slate-100 pb-3">
                    <p className="font-bold text-slate-900 mb-2">
                      ข้อที่ {q.number}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4 text-slate-800">
                      {q.choices.map((c) => (
                        <div key={c.key} className="flex items-start gap-2">
                          <span className="font-bold">{c.key}.</span>
                          <span>{c.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mode 3: Teacher Master Answer Key (ใบเฉลยสำหรับครู) */}
            {mode === 'answer_key' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-lg mb-4 text-xs">
                  <strong>ตารางเฉลยด่วน: </strong>
                  {exam.questions.map((q) => `${q.number}.${q.correctAnswer} `).join(' | ')}
                </div>

                {exam.questions.map((q) => (
                  <div key={q.number} className="text-xs border-b border-slate-200 pb-3">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900">
                        ข้อที่ {q.number}. {q.question}
                      </span>
                      <span className="font-extrabold text-sm px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                        ตอบข้อ {q.correctAnswer}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 pl-3 text-slate-700 my-1">
                      {q.choices.map((c) => (
                        <span
                          key={c.key}
                          className={c.key === q.correctAnswer ? 'font-bold text-emerald-700' : ''}
                        >
                          {c.key}. {c.text} {c.key === q.correctAnswer && '✓'}
                        </span>
                      ))}
                    </div>

                    <div className="mt-1 text-slate-600 bg-slate-50 p-2 rounded">
                      <p>
                        <strong>คำอธิบาย:</strong> {q.explanation}
                      </p>
                      {q.teachingTip && (
                        <p className="mt-1 text-amber-800">
                          <strong>จุดที่เด็กมักตอบผิด:</strong> {q.teachingTip}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
