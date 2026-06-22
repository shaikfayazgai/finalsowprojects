/**
 * Meridian — SurfacePanel
 *
 * A semantic alias for `Card` used in *layout* contexts (vs the Card
 * primitive used in *content* contexts). Same shell; different name to
 * keep mental models clean: panels divide a page, cards display data.
 *
 * If a screen has a clear "scope summary panel" + "decomposition
 * readiness panel" — those are SurfacePanels. The rows inside them
 * are Cards.
 */

import * as React from "react";
import { Card, type CardProps } from "../primitives/Card";

export const SurfacePanel = React.forwardRef<HTMLDivElement, CardProps>(
  (props, ref) => <Card ref={ref} {...props} />,
);
SurfacePanel.displayName = "SurfacePanel";
