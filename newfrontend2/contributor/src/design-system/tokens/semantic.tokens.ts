/**
 * Meridian semantic tokens — barrel.
 *
 * The actual theme objects live in `themes/{light,dark}.theme.ts` and
 * the contract type lives in `themes/meridian.theme.ts`. This barrel
 * re-exports them under their canonical names so consumers can write:
 *
 *   import { daybook, nocturne, semanticThemes } from "@/design-system";
 *
 * The TS theme objects mirror the CSS variables defined in
 * `styles/themes.css` — components should prefer CSS-var consumption
 * via Tailwind utilities; the TS objects are for runtime contexts
 * (chart libraries, canvas, animation keyframes).
 */

import { lightTheme } from "../themes/light.theme";
import { darkTheme } from "../themes/dark.theme";
import type { SemanticTokens } from "../themes/meridian.theme";

export const daybook: SemanticTokens = lightTheme;
export const nocturne: SemanticTokens = darkTheme;

export const semanticThemes = { daybook, nocturne } as const;
export type ThemeName = keyof typeof semanticThemes;
export type { SemanticTokens } from "../themes/meridian.theme";
