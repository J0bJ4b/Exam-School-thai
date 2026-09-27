import React from 'react';
import { ExamSet } from '../types/exam';
import { SAMPLE_EXAMS } from '../data/sampleExams';
import {
  FolderOpen,
  X,
  BookOpen,
  Calendar,
  CheckCircle2,
  Trash2,
  Download,
  Upload,
  Plus,
} from 'lucide-react';

interface ExamBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedExams: ExamSet[];
  currentExamId: string;
  onSelectExam: (exam: ExamSet) => void;
  onDeleteExam: (id: string) => void;
  onOpenGenerator: () => void;
  onImportExam: (exam: ExamSet) => void;
}

export const ExamBankModal: React.FC<ExamBankModalProps> = ({
  isOpen,
  onClose,
  savedExams,
  currentExamId,
  onSelectExam,
  onDeleteExam,
  onOpenGenerator,
  onImportExam,
}) => {
  if (!isOpen) return null;

  const handleExport = (exam: ExamSet) => {
    const jsonStr = JSON.stringify(exam, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-${exam.grade}-${exam.subject}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.questions)) {
          onImportExam(parsed);
          alert('นำเข้าชุดข้อสอบเรียบร้อยแล้ว');
        } else {
          alert('ไฟล์ไม่ถูกต้อง รูปแบบข้อสอบไม่สมบูรณ์');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">คลังชุดข้อสอบประถม (ป.1 - ป.6)</h3>
              <p className="text-xs text-slate-400">เลือกชุดข้อสอบที่มีอยู่ หรือนำเข้าไฟล์ JSON</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>นำเข้าไฟล์ JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                onClose();
                onOpenGenerator();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สร้างใหม่ด้วย AI</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Custom & Generated Exams */}
          {savedExams.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                ชุดข้อสอบที่คุณครูสร้างไว้ ({savedExams.length} ชุด):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedExams.map((exam) => {
                  const isCurrent = exam.id === currentExamId;
                  return (
                    <div
                      key={exam.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/30'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">
                            {exam.grade}
                          </span>
                          <span className="text-xs text-slate-400">{exam.subject}</span>
                        </div>
                        <h5 className="font-bold text-white text-sm line-clamp-2 mb-1">
                          {exam.title}
                        </h5>
                        <p className="text-xs text-slate-400 line-clamp-1 mb-3">
                          หัวข้อ: {exam.topic || '-'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                        <span className="text-slate-400 font-mono">
                          {exam.questions.length} ข้อ
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleExport(exam)}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                            title="ส่งออกเป็นไฟล์ JSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteExam(exam.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                            title="ลบชุดข้อสอบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectExam(exam);
                              onClose();
                            }}
                            className={`px-3 py-1 rounded-lg font-bold text-xs ${
                              isCurrent
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 hover:bg-indigo-600 text-slate-200'
                            }`}
                          >
                            {isCurrent ? 'กำลังใช้งาน' : 'เลือกชุดนี้'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Built-in Sample Exams */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              ชุดข้อสอบตัวอย่างมาตรฐานตามหลักสูตร สพฐ. (พร้อมใช้งานทันที):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SAMPLE_EXAMS.map((sample) => {
                const isCurrent = sample.id === currentExamId;
                return (
                  <div
                    key={sample.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                          {sample.grade}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {sample.subject}
                        </span>
                      </div>
                      <h5 className="font-bold text-white text-sm line-clamp-2 mb-1">
                        {sample.title}
                      </h5>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {sample.topic}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                      <span className="text-slate-400 font-mono">
                        {sample.questions.length} ข้อ
                      </span>
                      <button
                        onClick={() => {
                          onSelectExam(sample);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                          isCurrent
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 hover:bg-indigo-600 text-slate-200'
                        }`}
                      >
                        {isCurrent ? 'กำลังใช้งาน ✓' : 'เปิดชุดนี้'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
