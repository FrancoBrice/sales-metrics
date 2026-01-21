import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface ProgressData {
  total: number;
  completed: number;
  success: number;
  failed: number;
  pending: number;
  retried: number;
}

interface UseExtractionProgressReturn {
  progress: { current: number; total: number } | null;
  extracting: boolean;
  startExtraction: () => Promise<void>;
  startExtractionWithCallback: (onComplete: (data: ProgressData) => void, expectedTotal?: number) => Promise<void>;
  checkInitialProgress: () => Promise<void>;
}

export function useExtractionProgress(): UseExtractionProgressReturn {
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [extracting, setExtracting] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialCompletedRef = useRef<number>(0);
  const expectedTotalRef = useRef<number>(0);
  const initialSuccessRef = useRef<number>(0);
  const initialFailedRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const resetProgressRefs = useCallback(() => {
    initialCompletedRef.current = 0;
    expectedTotalRef.current = 0;
    initialSuccessRef.current = 0;
    initialFailedRef.current = 0;
  }, []);

  const startPolling = useCallback(
    (onComplete?: (data: ProgressData) => void) => {
      stopPolling();

      const checkProgress = async () => {
        try {
          const progressData = await api.extract.getProgress();

          if (progressData.total === 0) {
            stopPolling();
            setExtracting(false);
            setProgress(null);
            resetProgressRefs();
            return;
          }

          const initialCompleted = initialCompletedRef.current;
          const expectedTotal = expectedTotalRef.current;

          if (expectedTotal > 0) {
            const relativeCompleted = Math.max(0, progressData.completed - initialCompleted);
            const relativeTotal = expectedTotal;

            setProgress({
              current: Math.min(relativeCompleted, relativeTotal),
              total: relativeTotal
            });

            if (relativeCompleted >= relativeTotal) {
              stopPolling();

              setTimeout(() => {
                setProgress(null);
                if (onComplete) {
                  const relativeSuccess = Math.max(0, progressData.success - initialSuccessRef.current);
                  const relativeFailed = Math.max(0, progressData.failed - initialFailedRef.current);
                  onComplete({
                    ...progressData,
                    total: relativeTotal,
                    completed: relativeCompleted,
                    success: relativeSuccess,
                    failed: relativeFailed,
                  });
                }
                resetProgressRefs();
              }, 500);

              setExtracting(false);
            }
          } else {
            setProgress({ current: progressData.completed, total: progressData.total });

            if (progressData.completed >= progressData.total) {
              stopPolling();

              setTimeout(() => {
                setProgress(null);
                if (onComplete) {
                  onComplete(progressData);
                }
                resetProgressRefs();
              }, 500);

              setExtracting(false);
            }
          }
      } catch {
        stopPolling();
        resetProgressRefs();
      }
      };

      checkProgress();
      progressIntervalRef.current = setInterval(checkProgress, 1000);
    },
    [stopPolling, resetProgressRefs]
  );

  const startExtraction = useCallback(async () => {
    setExtracting(true);
    setProgress({ current: 0, total: 1 });

    try {
      let initialProgress: ProgressData | null = null;
      try {
        initialProgress = await api.extract.getProgress();
        initialCompletedRef.current = initialProgress.completed;
        initialSuccessRef.current = initialProgress.success;
        initialFailedRef.current = initialProgress.failed;
      } catch {
        initialCompletedRef.current = 0;
        initialSuccessRef.current = 0;
        initialFailedRef.current = 0;
      }

      const result = await api.extract.extractPendingAndFailed();
      const total = result.total || 0;

      if (total === 0) {
        setExtracting(false);
        setProgress(null);
        return;
      }

      expectedTotalRef.current = total;
      setProgress({ current: 0, total });

      startPolling();
    } catch {
      stopPolling();
      setProgress(null);
      setExtracting(false);
    }
  }, [startPolling, stopPolling]);

  const startExtractionWithCallback = useCallback(
    async (onComplete: (data: ProgressData) => void, expectedTotalParam?: number) => {
      setExtracting(true);

      try {
        let initialProgress: ProgressData | null = null;
        try {
          initialProgress = await api.extract.getProgress();
          initialCompletedRef.current = initialProgress.completed;
          initialSuccessRef.current = initialProgress.success;
          initialFailedRef.current = initialProgress.failed;
        } catch {
          initialCompletedRef.current = 0;
          initialSuccessRef.current = 0;
          initialFailedRef.current = 0;
        }

        const result = await api.extract.extractPendingAndFailed();
        const total = expectedTotalParam || result.total || 0;

        if (total === 0) {
          setExtracting(false);
          setProgress(null);
          return;
        }

        expectedTotalRef.current = total;
        setProgress({ current: 0, total });

        startPolling(onComplete);
      } catch {
        stopPolling();
        setProgress(null);
        setExtracting(false);
      }
    },
    [startPolling, stopPolling]
  );

  const checkInitialProgress = useCallback(async () => {
    if (extracting) {
      return;
    }

    try {
      const progressData = await api.extract.getProgress();

      if (progressData.total > 0 && progressData.completed < progressData.total) {
        const expectedTotal = expectedTotalRef.current;

        if (expectedTotal > 0) {
          const initialCompleted = initialCompletedRef.current;
          const relativeCompleted = Math.max(0, progressData.completed - initialCompleted);

          setExtracting(true);
          setProgress({
            current: Math.min(relativeCompleted, expectedTotal),
            total: expectedTotal
          });
        } else {
          setExtracting(true);
          setProgress({ current: progressData.completed, total: progressData.total });
        }

        startPolling();
      }
    } catch {
    }
  }, [startPolling, extracting]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    progress,
    extracting,
    startExtraction,
    startExtractionWithCallback,
    checkInitialProgress,
  };
}
