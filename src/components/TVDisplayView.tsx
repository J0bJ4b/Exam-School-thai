import React, { useState, useEffect } from 'react';
import {
  TVSessionState,
  ExamSet,
  ChoiceKey,
  Question,
} from '../types/exam';
import { playSound } from '../utils/audio';
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  CheckCircle2,
  Tv,
  Users,
  Eye,
  Type,
} from 'lucide-react';

interface TVDisplayViewProps {
  exam: ExamSet;
  session: TVSessionState;
  onNext?: () => void;
  onPrev?: () => void;
  onToggleTimer?: () => void;
}

const CHOICE_THEMES: Record<
  ChoiceKey,
  {
    bg: string;
    border: string;
    badge: string;
    text: string;
    activeGlow: string;
  }
> = {
  ก: {
    bg: 'bg-blue-950/60 hover:bg-blue-900/50',
    border: 'border-blue-500/40',
    badge: 'bg-blue-500 text-white shadow-blue-500/30',
    text: 'text-blue-100',
    activeGlow: 'ring-4 ring-emerald-400 bg-emerald-950/80 border-emerald-400 shadow-2xl shadow-emerald-500/30',
  },
  ข: {
    bg: 'bg-emerald-950/60 hover:bg-emerald-900/50',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500 text-white shadow-emerald-500/30',
    text: 'text-emerald-100',
    activeGlow: 'ring-4 ring-emerald-400 bg-emerald-950/80 border-emerald-400 shadow-2xl shadow-emerald-500/30',
  },
  ค: {
    bg: 'bg-amber-950/60 hover:bg-amber-900/50',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500 text-white shadow-amber-500/30',
    text: 'text-amber-100',
    activeGlow: 'ring-4 ring-emerald-400 bg-emerald-950/80 border-emerald-400 shadow-2xl shadow-emerald-500/30',
  },
  ง: {
    bg: 'bg-purple-950/60 hover:bg-purple-900/50',
    border: 'border-purple-500/40',
    badge: 'bg-purple-500 text-white shadow-purple-500/30',
    text: 'text-purple-100',
    activeGlow: 'ring-4 ring-emerald-400 bg-emerald-950/80 border-emerald-400 shadow-2xl shadow-emerald-500/30',
  },
};

export const TVDisplayView: React.FC<TVDisplayViewProps> = ({
  exam,
  session,
  onNext,
  onPrev,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [localSeconds, setLocalSeconds] = useState(session.remainingSeconds);

  const currentQIndex = Math.min(
    Math.max(session.currentQuestionIndex, 0),
    (exam.questions.length || 1) - 1
  );
  const question: Question | undefined = exam.questions[currentQIndex];

  // Sync timer countdown
  useEffect(() => {
    setLocalSeconds(session.remainingSeconds);
  }, [session.remainingSeconds, session.currentQuestionIndex]);

  useEffect(() => {
    let interval: any = null;
    if (session.isTimerRunning && localSeconds > 0) {
      interval = setInterval(() => {
        setLocalSeconds((prev) => {
          if (prev <= 1) {
            if (soundEnabled) playSound.timeUp();
            return 0;
          }
          if (prev <= 4 && soundEnabled) {
            playSound.warningBeep();
          } else if (soundEnabled && prev % 5 === 0) {
            playSound.tick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session.isTimerRunning, localSeconds, soundEnabled]);

  // Play sound on answer reveal
  useEffect(() => {
    if (session.showAnswerOnTV && soundEnabled) {
      playSound.revealAnswer();
    }
  }, [session.showAnswerOnTV, soundEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Text size classes based on session.fontSize
  const getQuestionFontSize = () => {
    if (session.fontSize === 'huge') return 'text-3xl md:text-5xl lg:text-6xl leading-tight';
    if (session.fontSize === 'normal') return 'text-xl md:text-2xl lg:text-3xl leading-snug';
    return 'text-2xl md:text-3xl lg:text-4xl leading-relaxed'; // large (default)
  };

  const getChoiceFontSize = () => {
    if (session.fontSize === 'huge') return 'text-2xl md:text-3xl lg:text-4xl';
    if (session.fontSize === 'normal') return 'text-base md:text-lg lg:text-xl';
    return 'text-xl md:text-2xl lg:text-3xl'; // large
  };

  const totalVotes =
    session.studentVotes
      ? Object.values(session.studentVotes).reduce((a, b) => a + b, 0)
      : 0;

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 bg-slate-950 text-white rounded-2xl border border-slate-800">
        <Tv className="w-16 h-16 text-indigo-400 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold">รอการเริ่มข้อสอบ</h2>
        <p className="text-slate-400 mt-2">เมื่อคุณครูกดเลือกข้อสอบ ข้อสอบจะปรากฏขึ้นบนจอนี้ทันที</p>
      </div>
    );
  }

  const timerRatio =
    session.timerPerQuestion > 0
      ? (localSeconds / session.timerPerQuestion) * 100
      : 100;

  const isTimeCritical = localSeconds <= 10 && session.isTimerRunning;

  return (
    <div
      className={`relative w-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/70 text-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'min-h-[85vh]'
      }`}
    >
      {/* Top Header Bar for Classroom TV */}
      <div className="px-6 md:px-12 py-5 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between gap-4">
        {/* Left: Grade & Subject & Title */}
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-sm md:text-base tracking-wide shadow-lg shadow-indigo-500/20">
            {exam.grade}
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-indigo-300 font-semibold text-sm md:text-base border border-slate-700">
            {exam.subject}
          </span>
          <span className="hidden lg:inline-block text-slate-400 text-sm truncate max-w-md">
            • {exam.title}
          </span>
        </div>

        {/* Center: Question Counter Badge */}
        <div className="flex items-center gap-2">
          <div className="px-5 py-1.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 rounded-full flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-indigo-300 font-medium">ข้อที่</span>
            <span className="text-xl md:text-2xl font-extrabold text-white">
              {currentQIndex + 1}
            </span>
            <span className="text-slate-400 font-normal">/ {exam.questions.length}</span>
          </div>
        </div>

        {/* Right: Timer & Display Controls */}
        <div className="flex items-center gap-3">
          {session.timerPerQuestion > 0 && (
            <div
              className={`flex items-center gap-2.5 px-4 py-1.5 rounded-2xl border font-mono transition-all ${
                isTimeCritical
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse scale-105'
                  : session.isTimerRunning
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/90 border-slate-700 text-slate-300'
              }`}
            >
              <Clock className={`w-5 h-5 ${session.isTimerRunning ? 'animate-spin' : ''}`} />
              <span className="text-xl md:text-2xl font-bold tracking-tight">
                {String(Math.floor(localSeconds / 60)).padStart(2, '0')}:
                {String(localSeconds % 60).padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            title={soundEnabled ? 'ปิดเสียงเตือน' : 'เปิดเสียงเตือน'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-indigo-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            title={isFullscreen ? 'ย่อหน้าจอ' : 'ขยายเต็มหน้าจอทีวี'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5 text-indigo-400" />}
          </button>
        </div>
      </div>

      {/* Progress Bar under header */}
      <div className="w-full bg-slate-800/60 h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${((currentQIndex + 1) / exam.questions.length) * 100}%` }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-14 lg:px-20 py-8 lg:py-12 max-w-7xl mx-auto w-full">
        {/* Question Text Box */}
        <div className="relative mb-8 md:mb-12 bg-slate-900/90 backdrop-blur-sm border-2 border-slate-700/60 rounded-3xl p-6 md:p-10 shadow-2xl">
          <div className="absolute -top-5 left-8 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm tracking-wider uppercase shadow-md flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            คำถามข้อที่ {question.number}
          </div>

          <h1
            className={`font-semibold text-white tracking-wide ${getQuestionFontSize()}`}
            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
          >
            {question.question}
          </h1>

          {/* Optional Topic or Hint badge if available */}
          {question.topic && (
            <div className="mt-4 text-sm text-indigo-300/80 font-medium">
              💡 เรื่อง: {question.topic}
            </div>
          )}
        </div>

        {/* 4 Choices Grid (2x2 or Stack depending on screen size) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {question.choices.map((choice) => {
            const theme = CHOICE_THEMES[choice.key] || CHOICE_THEMES['ก'];
            const isCorrect = choice.key === question.correctAnswer;
            const isRevealed = session.showAnswerOnTV;
            const voteCount = session.studentVotes?.[choice.key] || 0;
            const votePercent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

            return (
              <div
                key={choice.key}
                className={`relative flex items-center p-5 md:p-7 rounded-3xl border-2 transition-all duration-300 transform ${
                  isRevealed && isCorrect
                    ? `${theme.activeGlow} scale-[1.02]`
                    : isRevealed
                    ? 'opacity-40 bg-slate-950/40 border-slate-800'
                    : `${theme.bg} ${theme.border} hover:scale-[1.01]`
                }`}
              >
                {/* Choice Letter Badge (ก, ข, ค, ง) */}
                <div
                  className={`flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl md:text-3xl shadow-lg mr-4 md:mr-6 transition-all ${
                    isRevealed && isCorrect
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-300 animate-bounce'
                      : theme.badge
                  }`}
                >
                  {choice.key}
                </div>

                {/* Choice Text */}
                <div className="flex-1 pr-2">
                  <p className={`font-medium ${theme.text} ${getChoiceFontSize()}`}>
                    {choice.text}
                  </p>
                </div>

                {/* Answer Checkmark Icon when Revealed */}
                {isRevealed && isCorrect && (
                  <div className="flex-shrink-0 ml-3 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 text-white font-bold text-sm md:text-base shadow-lg animate-pulse">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>คำตอบที่ถูกต้อง</span>
                  </div>
                )}

                {/* Live student voting bar (if any votes tallied) */}
                {totalVotes > 0 && (
                  <div className="absolute bottom-2 left-6 right-6 flex items-center justify-between text-xs text-slate-400">
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mr-3">
                      <div
                        className={`h-full ${isRevealed && isCorrect ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                        style={{ width: `${votePercent}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-300 whitespace-nowrap">
                      {voteCount} คน ({votePercent}%)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Revealed Explanation Banner on TV if teacher activated it */}
        {session.showAnswerOnTV && question.explanation && (
          <div className="mt-8 p-6 rounded-2xl bg-emerald-950/70 border-2 border-emerald-500/60 shadow-xl backdrop-blur-md animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="px-3 py-1 bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                เฉลยข้อ {question.correctAnswer}
              </span>
              <div className="flex-1">
                <h4 className="font-semibold text-emerald-200 text-lg mb-1">คำอธิบายสำหรับนักเรียน:</h4>
                <p className="text-slate-200 text-base md:text-lg leading-relaxed font-light">
                  {question.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status & Classroom Cast Footer */}
      <div className="px-6 md:px-12 py-3 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs md:text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-medium text-slate-300">หน้าจอฉายทีวีห้องเรียน (Classroom Screen Mode)</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">คุณครูสามารถควบคุมการเปลี่ยนข้อได้จากหน้าต่างรีโมท</span>
        </div>

        <div className="flex items-center gap-4">
          {session.sessionId && (
            <div className="px-3 py-1 bg-slate-800 rounded-lg text-slate-300 font-mono text-xs flex items-center gap-1.5">
              <span>รหัสห้อง:</span>
              <strong className="text-indigo-400">{session.sessionId}</strong>
            </div>
          )}
          <span className="text-slate-500">กด F11 เพื่อเปิดเต็มจอทีวี</span>
        </div>
      </div>
    </div>
  );
};
