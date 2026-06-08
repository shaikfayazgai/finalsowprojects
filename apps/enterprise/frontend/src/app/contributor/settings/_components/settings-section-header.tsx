import type { SettingsSectionId } from "../lib/settings-sections";
import { sectionMeta } from "../lib/settings-sections";

export function SettingsSectionHeader({
  sectionId,
  description,
}: {
  sectionId: SettingsSectionId;
  description?: string;
}) {
  const section = sectionMeta(sectionId);

  return (
    <header>
      <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
        {section.label}
      </h1>
      {description && (
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">{description}</p>
      )}
    </header>
  );
}
