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
  startExtractionWithCallback: (onComplete: (data: ProgressData) => void) => Promise<void>;
  checkInitialProgress: () => Promise<void>;
}

export function useExtractionProgress(): UseExtractionProgressReturn {
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [extracting, setExtracting] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
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
            return;
          }

          setProgress({ current: progressData.completed, total: progressData.total });

          if (progressData.completed >= progressData.total) {
            stopPolling();

            setTimeout(() => {
              setProgress(null);
              if (onComplete) {
                onComplete(progressData);
              }
            }, 500);

            setExtracting(false);
          }
        } catch {
          stopPolling();
        }
      };

      checkProgress();
      progressIntervalRef.current = setInterval(checkProgress, 1000);
    },
    [stopPolling]
  );

  const startExtraction = useCallback(async () => {
    setExtracting(true);
    setProgress({ current: 0, total: 1 });

    try {
      const result = await api.extract.extractPendingAndFailed();
      const total = result.total || 0;

      if (total === 0) {
        setExtracting(false);
        setProgress(null);
        return;
      }

      try {
        const initialProgress = await api.extract.getProgress();
        setProgress({ current: initialProgress.completed, total: initialProgress.total || total });
      } catch {
        setProgress({ current: 0, total });
      }

      startPolling();
    } catch {
      stopPolling();
      setProgress(null);
      setExtracting(false);
    }
  }, [startPolling, stopPolling]);

  const startExtractionWithCallback = useCallback(
    async (onComplete: (data: ProgressData) => void) => {
      setExtracting(true);
      setProgress({ current: 0, total: 1 });

      try {
        const result = await api.extract.extractPendingAndFailed();
        const total = result.total || 0;

        if (total === 0) {
          setExtracting(false);
          setProgress(null);
          return;
        }

        try {
          const initialProgress = await api.extract.getProgress();
          setProgress({ current: initialProgress.completed, total: initialProgress.total || total });
        } catch {
          setProgress({ current: 0, total });
        }

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
    try {
      const progressData = await api.extract.getProgress();

      if (progressData.total > 0 && progressData.completed < progressData.total) {
        setExtracting(true);
        setProgress({ current: progressData.completed, total: progressData.total });
        startPolling();
      }
    } catch {
    }
  }, [startPolling]);

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
