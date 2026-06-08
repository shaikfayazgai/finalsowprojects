"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  actOnSession,
  deleteNoteApi,
  getSession,
  listContributorNotes,
  listSessions,
  scheduleSessionApi,
  updateNoteApi,
  writeNoteApi,
} from "@/lib/api/mentor-mentorship";

const keys = {
  sessions: (params: Parameters<typeof listSessions>[0]) =>
    ["mentor", "sessions", params] as const,
  notes: (contributorId: string) =>
    ["mentor", "notes", contributorId] as const,
};

export function useMentorSessions(params: Parameters<typeof listSessions>[0] = {}) {
  return useQuery({
    queryKey: keys.sessions(params),
    queryFn: () => listSessions(params),
  });
}

export function useMentorSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["mentor", "session", sessionId] as const,
    queryFn: () => {
      if (!sessionId) throw new Error("sessionId required");
      return getSession(sessionId);
    },
    enabled: !!sessionId,
  });
}

export function useScheduleSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: scheduleSessionApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentor", "sessions"] });
      qc.invalidateQueries({ queryKey: ["mentor", "session"] });
    },
  });
}

export function useSessionAction(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action, reason }: { action: "held" | "no_show" | "cancel"; reason?: string }) =>
      actOnSession(sessionId, action, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentor", "sessions"] });
      qc.invalidateQueries({ queryKey: ["mentor", "session"] });
    },
  });
}

export function useContributorNotes(contributorId: string | undefined) {
  return useQuery({
    queryKey: contributorId ? keys.notes(contributorId) : ["mentor", "notes", "—"],
    queryFn: () => {
      if (!contributorId) throw new Error("contributorId required");
      return listContributorNotes(contributorId);
    },
    enabled: !!contributorId,
  });
}

export function useWriteNote(contributorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: writeNoteApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notes(contributorId) }),
  });
}

export function useUpdateNote(contributorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, input }: { noteId: string; input: Parameters<typeof updateNoteApi>[1] }) =>
      updateNoteApi(noteId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notes(contributorId) }),
  });
}

export function useDeleteNote(contributorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteNoteApi(noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notes(contributorId) }),
  });
}
