"use client";

import * as React from "react";
import { Plus, Play } from "lucide-react";
import { getIntegrationById } from "@/lib/settings/settings-mock";
import { toast } from "@/lib/stores/toast-store";
import { secondaryBtnClass } from "@/app/admin/_shell/aurora-ui";
import {
  ConfigPanel,
  ConfigSection,
  DetailFooter,
  FieldLabel,
  IntegrationDetailShell,
  MappingList,
  PhaseNote,
  SegmentedControl,
  TextInput,
  CheckRow,
} from "./integration-detail-ui";

export function SsoWorkspace() {
  const integration = React.useMemo(() => getIntegrationById("sso")!, []);

  const [protocol, setProtocol] = React.useState<"saml" | "oidc">("saml");
  const [metadataMode, setMetadataMode] = React.useState<"upload" | "url" | "manual">("upload");
  const [metadataUrl, setMetadataUrl] = React.useState("");
  const [emailClaim, setEmailClaim] = React.useState("NameID");
  const [nameClaim, setNameClaim] = React.useState(
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
  );
  const [enforceSso, setEnforceSso] = React.useState(false);

  const roleMappings = [
    { left: "glm-sponsors", right: "sponsor" },
    { left: "glm-pmo", right: "pmo" },
    { left: "glm-finance", right: "finance" },
    { left: "glm-admin", right: "admin" },
  ];

  const onSave = () => {
    toast.success("SSO configuration saved", "Settings will apply on the next sign-in.");
  };

  const onTestLogin = () => {
    toast.info("Test login started", "Opening IdP flow in a new window (mock).");
  };

  return (
    <IntegrationDetailShell
      integration={integration}
      title="SSO (SAML / OIDC)"
      description="Configure single sign-on through your enterprise identity provider."
      footer={
        <DetailFooter onSave={onSave} saveLabel="Save & activate" />
      }
    >
      <ConfigPanel>
        <ConfigSection title="Provider" hint="Protocol your IdP supports">
          <SegmentedControl
            value={protocol}
            onChange={setProtocol}
            options={[
              { value: "saml", label: "SAML 2.0" },
              { value: "oidc", label: "OIDC" },
            ]}
          />
        </ConfigSection>

        <ConfigSection title="IdP metadata" hint="How Glimmora discovers your IdP endpoints">
          <div className="space-y-3">
            <SegmentedControl
              value={metadataMode}
              onChange={setMetadataMode}
              options={[
                { value: "upload", label: "Upload XML" },
                { value: "url", label: "Metadata URL" },
                { value: "manual", label: "Manual entry" },
              ]}
            />
            {metadataMode === "upload" && (
              <input
                type="file"
                accept=".xml"
                className="block font-body text-[12.5px] text-text-secondary"
              />
            )}
            {metadataMode === "url" && (
              <TextInput
                value={metadataUrl}
                onChange={setMetadataUrl}
                placeholder="https://login.example.com/sso/metadata"
                mono
              />
            )}
            {metadataMode === "manual" && (
              <p className="font-body text-[12px] text-text-tertiary">
                Entity ID, SSO URL, and certificate fields appear after you choose manual entry in production.
              </p>
            )}
          </div>
        </ConfigSection>

        <ConfigSection title="Claim mapping" hint="Map IdP attributes to Glimmora user fields">
          <div className="space-y-4 max-w-xl">
            <div>
              <FieldLabel>Email</FieldLabel>
              <TextInput value={emailClaim} onChange={setEmailClaim} mono />
            </div>
            <div>
              <FieldLabel>Display name</FieldLabel>
              <TextInput value={nameClaim} onChange={setNameClaim} mono />
            </div>
            <div>
              <FieldLabel>Roles · IdP group → Glimmora role</FieldLabel>
              <MappingList rows={roleMappings} />
              <button
                type="button"
                onClick={() => toast.info("Add mapping", "Role mapping editor ships with the SSO API.")}
                className="mt-2 inline-flex items-center gap-1 font-body text-[12px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Add mapping
              </button>
            </div>
          </div>
        </ConfigSection>

        <ConfigSection title="Testing" hint="Verify claims before enforcing SSO">
          <button
            type="button"
            onClick={onTestLogin}
            className={secondaryBtnClass}
          >
            <Play className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Test login as Sandeep
          </button>
        </ConfigSection>

        <ConfigSection title="Enforcement">
          <CheckRow
            checked={enforceSso}
            onChange={setEnforceSso}
            label="Require SSO for all members"
            description="Blocks password login once activated. Ensure at least one admin can sign in via SSO first."
          />
        </ConfigSection>

        <PhaseNote>Configuration is mock-backed until the tenant SSO API ships.</PhaseNote>
      </ConfigPanel>
    </IntegrationDetailShell>
  );
}
