import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as backgroundJobsApi from "../api/backgroundJobs";
import type { WorkspaceJob } from "../api/backgroundJobs";

type JobWatcher = (job: WorkspaceJob) => void;

type BackgroundJobsContextValue = {
  jobs: WorkspaceJob[];
  activeJobs: WorkspaceJob[];
  recentJobs: WorkspaceJob[];
  loading: boolean;
  refreshJobs: () => Promise<void>;
  watchJob: (jobId: string, onSettled: JobWatcher) => () => void;
  markJobsRead: (ids?: string[]) => Promise<void>;
};

const BackgroundJobsContext = createContext<BackgroundJobsContextValue | null>(null);

const POLL_ACTIVE_MS = 2500;
const POLL_IDLE_MS = 20000;

export function BackgroundJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<WorkspaceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const watchersRef = useRef<Map<string, Set<JobWatcher>>>(new Map());
  const prevStatusRef = useRef<Map<string, WorkspaceJob["status"]>>(new Map());

  const refreshJobs = useCallback(async () => {
    try {
      const items = await backgroundJobsApi.fetchWorkspaceJobs({ limit: 30 });
      setJobs(items);

      for (const job of items) {
        const prev = prevStatusRef.current.get(job.id);
        const settled = job.status === "completed" || job.status === "failed";
        const wasActive = prev === "pending" || prev === "running";
        if (settled && (wasActive || prev === undefined)) {
          const watchers = watchersRef.current.get(job.id);
          if (watchers) {
            for (const fn of watchers) fn(job);
            watchersRef.current.delete(job.id);
          }
        }
        prevStatusRef.current.set(job.id, job.status);
      }
    } catch {
      /* polling is best-effort */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshJobs();
  }, [refreshJobs]);

  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status === "pending" || j.status === "running"),
    [jobs]
  );

  const recentJobs = useMemo(() => jobs.slice(0, 12), [jobs]);

  useEffect(() => {
    const interval = activeJobs.length > 0 ? POLL_ACTIVE_MS : POLL_IDLE_MS;
    const timer = window.setInterval(() => void refreshJobs(), interval);
    return () => window.clearInterval(timer);
  }, [activeJobs.length, refreshJobs]);

  const watchJob = useCallback(
    (jobId: string, onSettled: JobWatcher) => {
      const existing = jobs.find((j) => j.id === jobId);
      if (existing && (existing.status === "completed" || existing.status === "failed")) {
        onSettled(existing);
        return () => {};
      }

      if (!watchersRef.current.has(jobId)) {
        watchersRef.current.set(jobId, new Set());
      }
      watchersRef.current.get(jobId)!.add(onSettled);
      return () => {
        watchersRef.current.get(jobId)?.delete(onSettled);
      };
    },
    [jobs]
  );

  const markJobsRead = useCallback(
    async (ids?: string[]) => {
      await backgroundJobsApi.markWorkspaceJobsRead(ids);
      await refreshJobs();
    },
    [refreshJobs]
  );

  const value = useMemo(
    () => ({
      jobs,
      activeJobs,
      recentJobs,
      loading,
      refreshJobs,
      watchJob,
      markJobsRead,
    }),
    [jobs, activeJobs, recentJobs, loading, refreshJobs, watchJob, markJobsRead]
  );

  return <BackgroundJobsContext.Provider value={value}>{children}</BackgroundJobsContext.Provider>;
}

export function useBackgroundJobs() {
  const ctx = useContext(BackgroundJobsContext);
  if (!ctx) {
    throw new Error("useBackgroundJobs must be used within BackgroundJobsProvider");
  }
  return ctx;
}

export function useBackgroundJobsOptional() {
  return useContext(BackgroundJobsContext);
}
