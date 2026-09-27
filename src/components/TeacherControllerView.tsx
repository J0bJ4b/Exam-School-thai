import React, { useEffect } from 'react';
import {
  TVSessionState,
  ExamSet,
  ChoiceKey,
  Question,
} from '../types/exam';
import { playSound } from '../utils/audio';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Radio,
  BookOpen,
} from 'lucide-react';

interface TeacherControllerViewProps {
  exam: ExamSet;
  session: TVSessionState;
  onNext: () => void;
  onPrev: () => void;
  onJump: (index: number) => void;
  onToggleTimer: (running?: boolean) => void;
  onResetTimer: () => void;
  onSetTimerSeconds: (seconds: number) => void;
  onSetDefaultTimer: (seconds: number) => void;
  onToggleReveal: (show?: boolean) => void;
  onVote: (key: ChoiceKey, delta?: number) => void;
  onResetVotes: () => void;
  onOpenTVWindow: () => void;
  onSwitchToAnswerKey: () => void;
}

export const TeacherControllerView: React.FC<TeacherControllerViewProps> = ({
  exam,
  session,
  onNext,
  onPrev,
  onJump,
  onToggleTimer,
  onResetTimer,
  onSetDefaultTimer,
  onToggleReveal,
  onVote,
  onResetVotes,
  onOpenTVWindow,
  onSwitchToAnswerKey,
}) => {
  const currentIdx = Math.min(
    Math.max(session.currentQuestionIndex, 0),
    (exam.questions.length || 1) - 1
  );
  const currentQ: Question | undefined = exam.questions[currentIdx];

  // Keyboard shortcut listener for teacher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        onNext();
        playSound.nextQuestion();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        onPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        onToggleTimer();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onToggleReveal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onToggleTimer, onToggleReveal]);

  if (!currentQ) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
        ยังไม่มีข้อสอบในชุดนี้
      </div>
    );
  }

  const timerPresets = [0, 30, 45, 60, 90, 120];

  return (
    <div className="space-y-6">
      {/* Top Remote Control Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              หน้ารีโมทควบคุมการสอบสำหรับครู (Live Controller)
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <span>{exam.title}</span>
            <span className="text-xs px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-normal">
              {exam.grade}
            </span>
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenTVWindow}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="เปิดหน้าจอข้อสอบทีวีในหน้าต่างใหม่ เพื่อลากไปจอทีวี/โปรเจกเตอร์"
          >
            <ExternalLink className="w-4 h-4" />
            <span>เปิดจอทีวีแยกหน้าต่าง (TV Cast)</span>
          </button>

          <button
            onClick={onSwitchToAnswerKey}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 transition-all"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>เปิดหน้าดูเฉลยทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* Main Controller Grid: 2 Columns (Left: Big Controller & Current Question / Right: Question Selector & Tools) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Large Navigation, Question Preview & Answer Toggle */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Giant Navigation Box ("ครูเป็นคนกดเปลี่ยนข้อ") */}
          <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                กำลังฉายขึ้นจอทีวี: ข้อที่ {currentIdx + 1} จาก {exam.questions.length} ข้อ
              </span>
              <span className="text-xs text-slate-400">
                คีย์ลัด: ลูกศร ⬅ / ➡ หรือ Spacebar (จับเวลา)
              </span>
            </div>

            {/* Giant Next / Prev Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => {
                  onPrev();
                }}
                disabled={currentIdx <= 0}
                className={`py-5 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg md:text-xl transition-all shadow-lg ${
                  currentIdx <= 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-600 hover:border-slate-500 active:scale-[0.98]'
                }`}
              >
                <ChevronLeft className="w-7 h-7" />
                <span>ข้อย้อนหลัง</span>
              </button>

              <button
                onClick={() => {
                  onNext();
                  playSound.nextQuestion();
                }}
                disabled={currentIdx >= exam.questions.length - 1}
                className={`py-5 px-6 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg md:text-xl transition-all shadow-xl ${
                  currentIdx >= exam.questions.length - 1
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 active:scale-[0.98]'
                }`}
              >
                <span>ข้อถัดไป</span>
                <ChevronRight className="w-7 h-7" />
              </button>
            </div>

            {/* Live Preview Box of What Students See on TV */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-6">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                คำถามปัจจุบัน (ข้อที่ {currentQ.number}):
              </div>
              <p className="text-xl md:text-2xl font-semibold text-white leading-relaxed mb-4">
                {currentQ.question}
              </p>

              {/* Choices with Teacher's Secret Answer Indicator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQ.choices.map((choice) => {
                  const isCorrect = choice.key === currentQ.correctAnswer;
                  return (
                    <div
                      key={choice.key}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                        isCorrect
                          ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isCorrect
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {choice.key}
                      </span>
                      <span className="flex-1 font-medium">{choice.text}</span>
                      {isCorrect && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                          คำตอบครู ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Teacher's Quick Pedagogical Tip / Explanation on Controller */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1.5">
                <Lightbulb className="w-4 h-4" />
                <span>เฉลยและเหตุผล (มองเห็นเฉพาะคุณครู):</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-emerald-300">ตอบ {currentQ.correctAnswer}: </strong>
                {currentQ.explanation}
              </p>
              {currentQ.teachingTip && (
                <p className="text-xs text-amber-300/90 mt-2 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                  💡 <strong>ข้อสังเกตสำหรับครู:</strong> {currentQ.teachingTip}
                </p>
              )}
            </div>

            {/* TV Screen Display Toggles: Reveal Answer & Choices */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleReveal()}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                    session.showAnswerOnTV
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {session.showAnswerOnTV ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>กำลังเฉลยบนจอทีวี (กดเพื่อซ่อน)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-slate-400" />
                      <span>เปิดเฉลยบนจอทีวีให้นักเรียนดู</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-slate-400">
                สถานะจอทีวี:{' '}
                <span className={session.showAnswerOnTV ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {session.showAnswerOnTV ? 'แสดงเฉลยแล้ว' : 'ซ่อนเฉลย (นักเรียนกำลังคิด)'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Classroom Hand Tally ("สำรวจคำตอบในห้อง") */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  นับจำนวนคำตอบเด็กในห้องเรียน (Poll & Hands Tally)
                </h3>
              </div>
              <button
                onClick={onResetVotes}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
              >
                รีเซ็ตการนับ
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              คุณครูสามารถกดเพิ่มจำนวนเมื่อถามว่า &quot;ใครตอบ ก / ข / ค / ง ยกมือขึ้น&quot; ข้อมูลจะขึ้นบนจอทีวีแบบเรียลไทม์
            </p>

            <div className="grid grid-cols-4 gap-3">
              {(['ก', 'ข', 'ค', 'ง'] as ChoiceKey[]).map((key) => {
                const count = session.studentVotes?.[key] || 0;
                const isCorrect = key === currentQ.correctAnswer;
                return (
                  <div
                    key={key}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 ${
                      isCorrect
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <span className="font-bold text-lg text-white">ข้อ {key}</span>
                    <span className="text-2xl font-extrabold text-indigo-400 font-mono">
                      {count}
                    </span>
                    <div className="flex items-center gap-1.5 w-full">
                      <button
                        onClick={() => onVote(key, -1)}
                        className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => onVote(key, 1)}
                        className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Timer Controls & All Question Numbers Grid */}
        <div className="lg:col-span-4 space-y-6">
          {/* Timer Controller Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">การจับเวลาต่อข้อ</h3>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  session.isTimerRunning
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {session.isTimerRunning ? 'กำลังจับเวลา' : 'หยุดชั่วคราว'}
              </span>
            </div>

            {/* Current Remaining Display */}
            <div className="text-center py-4 bg-slate-950 rounded-xl border border-slate-800 mb-4 font-mono">
              <span className="text-4xl md:text-5xl font-extrabold text-white">
                {String(Math.floor(session.remainingSeconds / 60)).padStart(2, '0')}:
                {String(session.remainingSeconds % 60).padStart(2, '0')}
              </span>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                {session.timerPerQuestion > 0
                  ? `ตั้งเวลาไว้ ${session.timerPerQuestion} วินาทีต่อข้อ`
                  : 'ไม่จำกัดเวลา'}
              </p>
            </div>

            {/* Timer Play / Pause / Reset Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <button
                onClick={() => onToggleTimer()}
                className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  session.isTimerRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                }`}
              >
                {session.isTimerRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>หยุดเวลา</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>เริ่มจับเวลา</span>
                  </>
                )}
              </button>

              <button
                onClick={onResetTimer}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>รีเซ็ตเวลา</span>
              </button>
            </div>

            {/* Change Default Timer Presets */}
            <div>
              <span className="text-xs text-slate-400 block mb-2 font-medium">
                เปลี่ยนเวลาต่อข้อ:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {timerPresets.map((sec) => (
                  <button
                    key={sec}
                    onClick={() => onSetDefaultTimer(sec)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      session.timerPerQuestion === sec
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {sec === 0 ? 'ไม่จับเวลา' : `${sec} วินาที`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Jump to Any Question Rail (1 - 40) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-base">
                สารบัญข้อสอบทั้งหมด ({exam.questions.length} ข้อ)
              </h3>
              <span className="text-xs text-slate-400">กดเพื่อข้ามข้อได้ทันที</span>
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {exam.questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id || idx}
                    onClick={() => {
                      onJump(idx);
                      playSound.nextQuestion();
                    }}
                    className={`h-11 rounded-xl font-bold text-sm flex flex-col items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md scale-105'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    <span className="text-[10px] text-emerald-400 font-normal">
                      ({q.correctAnswer})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
