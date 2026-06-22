"use client";

import * as React from "react";
import {
  adminAgentsOverlays,
  getAdminAgent,
  getAdminPrompt,
  listAdminAgents,
  listAdminPrompts,
} from "@/lib/admin/mocks/agents-service";

function useAgentsOverlayVersion(): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const unsub = [
      adminAgentsOverlays.agents.subscribe(() => setV((n) => n + 1)),
      adminAgentsOverlays.prompts.subscribe(() => setV((n) => n + 1)),
    ];
    return () => unsub.forEach((u) => u());
  }, []);
  return v;
}

export function useAdminAgentsList() {
  const v = useAgentsOverlayVersion();
  return React.useMemo(() => listAdminAgents(), [v]);
}

export function useAdminAgent(agentId: string | undefined) {
  const v = useAgentsOverlayVersion();
  return React.useMemo(
    () => (agentId ? getAdminAgent(agentId) : undefined),
    [agentId, v],
  );
}

export function useAdminPromptsList() {
  const v = useAgentsOverlayVersion();
  return React.useMemo(() => listAdminPrompts(), [v]);
}

export function useAdminPrompt(promptId: string | undefined) {
  const v = useAgentsOverlayVersion();
  return React.useMemo(
    () => (promptId ? getAdminPrompt(promptId) : undefined),
    [promptId, v],
  );
}
