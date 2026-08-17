import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { toast } from 'sonner';
import type {
  Campaign,
  Contact,
  DashboardStats,
  ImportJob,
  Personalization,
  Profile,
  ReplyRow,
  OutreachRow,
} from './api';
import {
  getCampaigns,
  getContacts,
  getOutreach,
  getReplies,
  getStats,
  getProfiles,
  getImportJobs,
  getReviewQueue,
  getBulkProgress,
  uploadImport,
  processImport,
  submitReview,
  generatePersonalization,
  triggerOutreach,
  triggerFollowups,
  triggerReplies,
  addLead,
  approveAndSendBulk,
} from './api';

interface AppContextType {
  loading: boolean;
  error: string | null;
  // data
  stats: DashboardStats | null;
  campaigns: Campaign[];
  contacts: Contact[];
  outreach: OutreachRow[];
  replies: ReplyRow[];
  profiles: Profile[];
  importJobs: ImportJob[];
  reviewQueue: Personalization[];
  bulkProgress: Record<string, number> | null;
  selectedCampaign: string;
  setSelectedCampaign: (id: string) => void;
  // refresh
  refresh: () => Promise<void>;
  refreshReviewQueue: () => Promise<void>;
  // actions
  uploadAndQueueImport: (file: File, fileType?: string) => Promise<string>;
  processImportJob: (jobId: string) => Promise<void>;
  approve: (id: string, opts?: { comments?: string; editedSubject?: string; editedBody?: string }) => Promise<void>;
  reject: (id: string, comments?: string) => Promise<void>;
  generateForProfile: (profileId: string) => Promise<void>;
  runOutreach: () => Promise<{ claimed: number; sent: number; failed: number } | null>;
  runFollowups: () => Promise<unknown>;
  runReplies: () => Promise<{ fetched: number; processed: number; skipped: number }>;
  createLead: (data: { name: string; email: string; organization?: string; role?: string }) => Promise<void>;
  bulkApproveAndSend: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [outreach, setOutreach] = useState<OutreachRow[]>([]);
  const [replies, setReplies] = useState<ReplyRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Personalization[]>([]);
  const [bulkProgress, setBulkProgress] = useState<Record<string, number> | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');

  const refresh = useCallback(async () => {
    try {
      const [s, c, co, o, r, p, j, q, bp] = await Promise.all([
        getStats(),
        getCampaigns(),
        getContacts({ limit: 200 }),
        getOutreach({ limit: 200 }),
        getReplies(100),
        getProfiles(200),
        getImportJobs(20),
        getReviewQueue(undefined, 50),
        getBulkProgress(),
      ]);
      setStats(s);
      setCampaigns(c);
      setContacts(co);
      setOutreach(o);
      setReplies(r);
      setProfiles(p);
      setImportJobs(j);
      setReviewQueue(q);
      setBulkProgress(bp);
      setSelectedCampaign(prev => prev || (c[0]?.id ?? ''));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshReviewQueue = useCallback(async () => {
    try {
      const q = await getReviewQueue(undefined, 50);
      setReviewQueue(q);
    } catch (err) {
      toast.error(`Failed to load review queue: ${(err as Error).message}`);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uploadAndQueueImport = async (file: File, fileType?: string) => {
    const jobId = await uploadImport(file, fileType);
    toast.success(`File "${file.name}" queued for import (${jobId.slice(0, 8)}…)`);
    setImportJobs(await getImportJobs(20));
    return jobId;
  };

  const processImportJob = async (jobId: string) => {
    toast.info('Processing import job…');
    await processImport(jobId);
    toast.success('Import job processed');
    await refresh();
  };

  const approve = async (id: string, opts?: { comments?: string; editedSubject?: string; editedBody?: string }) => {
    await submitReview(id, 'approved', opts || {});
    toast.success('Personalization approved');
    await refreshReviewQueue();
    await refresh();
  };

  const reject = async (id: string, comments?: string) => {
    await submitReview(id, 'rejected', { comments });
    toast.success('Personalization rejected');
    await refreshReviewQueue();
  };

  const generateForProfile = async (profileId: string) => {
    toast.info('Generating AI personalization…');
    await generatePersonalization(profileId);
    toast.success('Personalization generated — awaiting review');
    await refresh();
    await refreshReviewQueue();
  };

  const runOutreach = async () => {
    toast.info('Triggering outreach batch…');
    const result = await triggerOutreach();
    toast.success(`Outreach done — claimed ${result.claimed}, sent ${result.sent}, failed ${result.failed}`);
    await refresh();
    return result;
  };

  const runFollowups = async () => {
    toast.info('Triggering follow-up batch…');
    const result = await triggerFollowups();
    toast.success('Follow-ups processed');
    await refresh();
    return result;
  };

  const runReplies = async () => {
    toast.info('Checking inbox for replies…');
    const result = await triggerReplies();
    toast.success(`Reply check done — fetched ${result.fetched}, processed ${result.processed}`);
    await refresh();
    return result;
  };

  const createLead = async (data: { name: string; email: string; organization?: string; role?: string }) => {
    await addLead(data);
    toast.success(`Lead created for ${data.name}`);
    await refresh();
  };

  const bulkApproveAndSend = async () => {
    toast.info('Approving pending personalizations & triggering send…');
    await approveAndSendBulk(selectedCampaign || undefined);
    toast.success('Bulk approve-and-send complete');
    await refresh();
    await refreshReviewQueue();
  };

  return (
    <AppContext.Provider
      value={{
        loading,
        error,
        stats,
        campaigns,
        contacts,
        outreach,
        replies,
        profiles,
        importJobs,
        reviewQueue,
        bulkProgress,
        selectedCampaign,
        setSelectedCampaign,
        refresh,
        refreshReviewQueue,
        uploadAndQueueImport,
        processImportJob,
        approve,
        reject,
        generateForProfile,
        runOutreach,
        runFollowups,
        runReplies,
        createLead,
        bulkApproveAndSend,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
