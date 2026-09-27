import { useState, useEffect, useCallback, useRef } from 'react';
import { TVSessionState, ExamSet, ChoiceKey } from '../types/exam';

const CHANNEL_NAME = 'primary_exam_tv_sync_channel';
const STORAGE_KEY = 'primary_exam_active_session';

export function useClassroomSync(initialExam: ExamSet | null, initialRole: 'teacher' | 'tv' | 'preview') {
  const [session, setSession] = useState<TVSessionState>(() => {
    // Check if there is an existing session in localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed;
        }
      } catch (e) {}
    }

    return {
      sessionId: 'ROOM-' + Math.floor(1000 + Math.random() * 9000),
      examId: initialExam?.id || '',
      examTitle: initialExam?.title || '',
      grade: initialExam?.grade || 'ป.3',
      subject: initialExam?.subject || 'วิทยาศาสตร์',
      currentQuestionIndex: 0,
      totalQuestions: initialExam?.questions?.length || 0,
      isTimerRunning: false,
      remainingSeconds: initialExam?.timerPerQuestion || 60,
      timerPerQuestion: initialExam?.timerPerQuestion || 60,
      showAnswerOnTV: false,
      showChoicesOnTV: true,
      fontSize: 'large',
      studentVotes: { ก: 0, ข: 0, ค: 0, ง: 0 },
      lastUpdated: Date.now(),
    };
  });

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'SESSION_UPDATE') {
          setSession((prev) => {
            // Apply only if newer or equal
            if (event.data.session.lastUpdated >= prev.lastUpdated) {
              return event.data.session;
            }
            return prev;
          });
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported, falling back to storage events');
    }

    // Storage event fallback for cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          setSession(updated);
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      broadcastChannelRef.current?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Broadcast helper
  const broadcastUpdate = useCallback((newSession: TVSessionState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } catch (e) {}

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({
          type: 'SESSION_UPDATE',
          session: newSession,
        });
      } catch (e) {}
    }

    // Optional server sync in background if room PIN exists
    if (newSession.sessionId) {
      fetch(`/api/session/${newSession.sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SYNC',
          payload: newSession,
        }),
      }).catch(() => {});
    }
  }, []);

  // Actions
  const nextQuestion = useCallback(() => {
    setSession((prev) => {
      if (prev.currentQuestionIndex >= prev.totalQuestions - 1) return prev;
      const updated: TVSessionState = {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        showAnswerOnTV: false,
        remainingSeconds: prev.timerPerQuestion,
        isTimerRunning: false,
        studentVotes: { ก: 0, ข: 0, ค: 0, ง: 0 },
        lastUpdated: Date.now(),
      };
      broadcastUpdate(updated);
      return updated;
    });
  }, [broadcastUpdate]);

  const prevQuestion = useCallback(() => {
    setSession((prev) => {
      if (prev.currentQuestionIndex <= 0) return prev;
      const updated: TVSessionState = {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        showAnswerOnTV: false,
        remainingSeconds: prev.timerPerQuestion,
        isTimerRunning: false,
        studentVotes: { ก: 0, ข: 0, ค: 0, ง: 0 },
        lastUpdated: Date.now(),
      };
      broadcastUpdate(updated);
      return updated;
    });
  }, [broadcastUpdate]);

  const jumpToQuestion = useCallback((index: number) => {
    setSession((prev) => {
      if (index < 0 || index >= prev.totalQuestions) return prev;
      const updated: TVSessionState = {
        ...prev,
        currentQuestionIndex: index,
        showAnswerOnTV: false,
        remainingSeconds: prev.timerPerQuestion,
        isTimerRunning: false,
        studentVotes: { ก: 0, ข: 0, ค: 0, ง: 0 },
        lastUpdated: Date.now(),
      };
      broadcastUpdate(updated);
      return updated;
    });
  }, [broadcastUpdate]);

  const toggleTimer = useCallback((running?: boolean) => {
    setSession((prev) => {
      const isRunning = typeof running === 'boolean' ? running : !prev.isTimerRunning;
      const updated: TVSessionState = {
        ...prev,
        isTimerRunning: isRunning,
        lastUpdated: Date.now(),
      };
      broadcastUpdate(updated);
      return updated;
    });
  }, [broadcastUpdate]);

  const resetTimer = useCallback(() => {
    setSession((prev) => {
      const updated: TVSessionState = {
        ...prev,
        remainingSeconds: prev.timerPerQuestion,
        isTimerRunning: false,
        lastUpdated: Date.now(),
      };
      broadcastUpdate(updated);
      return updated;
    });
  }, [broadcastUpdate]);

  const setTimerSeconds = useCallback((seconds: number) => {
    setSession((prev) => {
      const updated: TVSessionState = {
        ...prev,
        remainingSeconds: seconds,
        isTimerRunning: seconds > 0 ? prev.isTimerRunning : false,
        lastUpdated: Date.now(),
      };
      broadcastUpdate(updated);
      return updated;
    });
  }, [broadcastUpdate]);

  const setDefaultTimer = useCallback((seconds: number) => {
    setSession((prev) => {
      const updated: TVSessionState = {
        ...prev,
        timerPerQuestion: seconds,
        remainingSeconds: seconds,
        lastUpdated: Date.now(),
      };
      broadcastUpdate(updated);
      return updated;
    });
  }, [broadcastUpdate]);

  const toggleRevealAnswer = useCallback((show?: boolean) => {
    setSession((prev) => {
      const showAnswer = typeof show === 'boolean' ? show : !prev.showAnswerOnTV;
      const updated: TVSessionState = {
        ...prev,
        showAnswerOnTV: showAnswer,
        lastUpdated: Date.now(),
      };
      broadcastUpdate(updated);
      return updated;
    });
  }, [broadcastUpdate]);

  const setFontSize = useCallback((fontSize: 'normal' | 'large' | 'huge') => {
    setSession((prev) => {
      const updated: TVSessionState = {
        ...prev,
        fontSize,
        lastUpdated: Date.now(),
      };
      broadcastUpdate(updated);
      return updated;
    });
  }, [broadcastUpdate]);

  const voteChoice = useCallback((key: ChoiceKey, delta: number = 1) => {
    setSession((prev) => {
      const current = prev.studentVotes || { ก: 0, ข: 0, ค: 0, ง: 0 };
      const nextCount = Math.max(0, (current[key] || 0) + delta);
      const updated: TVSessionState = {
        ...prev,
        studentVotes: {
          ...current,
          [key]: nextCount,
        },
        lastUpdated: Date.now(),
      };
      broadcastUpdate(updated);
      return updated;
    });
  }, [broadcastUpdate]);

  const resetVotes = useCallback(() => {
    setSession((prev) => {
      const updated: TVSessionState = {
        ...prev,
        studentVotes: { ก: 0, ข: 0, ค: 0, ง: 0 },
        lastUpdated: Date.now(),
      };
      broadcastUpdate(updated);
      return updated;
    });
  }, [broadcastUpdate]);

  const updateActiveExam = useCallback((exam: ExamSet) => {
    setSession((prev) => {
      const updated: TVSessionState = {
        ...prev,
        examId: exam.id,
        examTitle: exam.title,
        grade: exam.grade,
        subject: exam.subject,
        currentQuestionIndex: 0,
        totalQuestions: exam.questions.length,
        isTimerRunning: false,
        remainingSeconds: exam.timerPerQuestion || 60,
        timerPerQuestion: exam.timerPerQuestion || 60,
        showAnswerOnTV: false,
        studentVotes: { ก: 0, ข: 0, ค: 0, ง: 0 },
        lastUpdated: Date.now(),
      };
      broadcastUpdate(updated);
      return updated;
    });
  }, [broadcastUpdate]);

  return {
    session,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    toggleTimer,
    resetTimer,
    setTimerSeconds,
    setDefaultTimer,
    toggleRevealAnswer,
    setFontSize,
    voteChoice,
    resetVotes,
    updateActiveExam,
  };
}
