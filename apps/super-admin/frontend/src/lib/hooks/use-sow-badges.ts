import { useSOWPipelineStore } from "@/lib/stores/sow-pipeline-store";

export function useSowBadges(): Record<string, string | undefined> {
  return {};
}

export interface SOWAlert {
  id: string;
  title: string;
  reason?: string;
  requestedBy?: string;
}

export interface AlertState {
  hasAlert: boolean;
  items: SOWAlert[];
}

export function useSowAlerts(): Record<string, AlertState> {
  const pipelineSows = useSOWPipelineStore((s) => s.sows);
  const changed = pipelineSows.filter((s) => s.changesRequested);
  return {
    "/enterprise/sow/approval": {
      hasAlert: changed.length > 0,
      items: changed.map((s) => ({
        id: s.id,
        title: s.title,
        reason: s.changeRequestReason,
        requestedBy: s.changeRequestedBy,
      })),
    },
  };
}
