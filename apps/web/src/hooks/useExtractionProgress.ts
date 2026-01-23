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

  const captureInitialState = async () => {
    try {
      const initialProgress = await api.extract.getProgress();
      initialCompletedRef.current = initialProgress.completed;
      initialSuccessRef.current = initialProgress.success;
      initialFailedRef.current = initialProgress.failed;
    } catch {
      initialCompletedRef.current = 0;
      initialSuccessRef.current = 0;
      initialFailedRef.current = 0;
    }
  };

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

          let currentProgress = 0;
          let totalProgress = progressData.total;

          if (expectedTotal > 0) {
            const relativeCompleted = Math.max(0, progressData.completed - initialCompleted);
            currentProgress = Math.min(relativeCompleted, expectedTotal);
            totalProgress = expectedTotal;
          } else {
            currentProgress = progressData.completed;
          }

          setProgress({
            current: currentProgress,
            total: totalProgress
          });

          const isComplete = expectedTotal > 0
            ? (progressData.completed - initialCompleted) >= expectedTotal
            : progressData.completed >= progressData.total;

          if (isComplete) {
            stopPolling();

            setTimeout(() => {
              setProgress(null);
              setExtracting(false);

              if (onComplete) {
                const relativeSuccess = Math.max(0, progressData.success - initialSuccessRef.current);
                const relativeFailed = Math.max(0, progressData.failed - initialFailedRef.current);
                const relativeCompleted = Math.max(0, progressData.completed - initialCompleted); // Re-calc just in case

                onComplete({
                  ...progressData,
                  total: totalProgress,
                  completed: relativeCompleted,
                  success: relativeSuccess,
                  failed: relativeFailed,
                });
              }
              resetProgressRefs();
            }, 500);
          }
        } catch (error) {
          console.error("Error polling progress:", error);
          stopPolling();
          resetProgressRefs();
          setExtracting(false);
          setProgress(null);
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
      await captureInitialState();

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
    } catch (error) {
      console.error("Error starting extraction:", error);
      stopPolling();
      setProgress(null);
      setExtracting(false);
    }
  }, [startPolling, stopPolling]);

  const startExtractionWithCallback = useCallback(
    async (onComplete: (data: ProgressData) => void, expectedTotalParam?: number) => {
      setExtracting(true);

      try {
        await captureInitialState();

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
      } catch (error) {
        console.error("Error starting extraction with callback:", error);
        stopPolling();
        setProgress(null);
        setExtracting(false);
      }
    },
    [startPolling, stopPolling]
  );

  const checkInitialProgress = useCallback(async () => {
  }, []);

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
