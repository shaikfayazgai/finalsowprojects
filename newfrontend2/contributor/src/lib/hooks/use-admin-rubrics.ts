"use client";

import * as React from "react";
import {
  adminRubricOverlays,
  getAdminRubric,
  getRubricFeedback,
  listAdminRubrics,
} from "@/lib/admin/mocks/rubrics-service";

export function useAdminRubricsVersion(): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    const unsubs = Object.values(adminRubricOverlays).map((store) =>
      store.subscribe(() => setV((n) => n + 1)),
    );
    return () => unsubs.forEach((u) => u());
  }, []);
  return v;
}

export function useAdminRubricsList() {
  const v = useAdminRubricsVersion();
  return React.useMemo(() => listAdminRubrics(), [v]);
}

export function useAdminRubric(templateId: string | undefined) {
  const v = useAdminRubricsVersion();
  return React.useMemo(
    () => (templateId ? getAdminRubric(templateId) : undefined),
    [templateId, v],
  );
}

export function useRubricFeedback(templateId: string | undefined) {
  const v = useAdminRubricsVersion();
  return React.useMemo(
    () => (templateId ? getRubricFeedback(templateId) : []),
    [templateId, v],
  );
}
