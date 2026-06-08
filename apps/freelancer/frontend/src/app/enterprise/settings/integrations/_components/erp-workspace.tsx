"use client";

import * as React from "react";
import { getIntegrationById } from "@/lib/settings/settings-mock";
import { toast } from "@/lib/stores/toast-store";
import {
  CheckRow,
  ConfigPanel,
  ConfigSection,
  DetailFooter,
  FieldLabel,
  IntegrationDetailShell,
  MappingList,
  PhaseNote,
  SegmentedControl,
  SelectInput,
  TextInput,
} from "./integration-detail-ui";

export function ErpWorkspace() {
  const integration = React.useMemo(() => getIntegrationById("erp")!, []);

  const [mode, setMode] = React.useState<"file" | "api" | "manual">("file");
  const [destination, setDestination] = React.useState("sftp://erp.glimmora.ai/glimmora/billing");
  const [auth, setAuth] = React.useState("ssh");
  const [frequency, setFrequency] = React.useState<"weekly" | "monthly">("weekly");
  const [invoices, setInvoices] = React.useState(true);
  const [payouts, setPayouts] = React.useState(true);
  const [audit, setAudit] = React.useState(false);
  const [poRequired, setPoRequired] = React.useState(true);

  const glMappings = [
    { left: "Engineering", right: "5100" },
    { left: "Design", right: "5200" },
    { left: "Data", right: "5300" },
  ];

  return (
    <IntegrationDetailShell
      integration={integration}
      title="ERP & procurement"
      description="Export invoices and payouts to your finance system. Phase 1 supports file drop and GL mapping."
      footer={
        <DetailFooter
          onSave={() => toast.success("ERP export enabled", "Weekly file drop scheduled for Mon 06:00 IST.")}
          saveLabel="Save & enable"
        />
      }
    >
      <ConfigPanel>
        <ConfigSection title="Export mode">
          <SegmentedControl
            value={mode}
            onChange={setMode}
            options={[
              { value: "file", label: "File drop (SFTP / S3)" },
              { value: "api", label: "API push", disabled: true, hint: "Phase 2" },
              { value: "manual", label: "Manual export" },
            ]}
          />
        </ConfigSection>

        {mode === "file" && (
          <ConfigSection title="File drop destination">
            <div className="space-y-4 max-w-xl">
              <div>
                <FieldLabel required>Path</FieldLabel>
                <TextInput
                  value={destination}
                  onChange={setDestination}
                  placeholder="sftp://erp.example.com/glimmora/billing"
                  mono
                />
              </div>
              <div>
                <FieldLabel>Authentication</FieldLabel>
                <SelectInput
                  value={auth}
                  onChange={setAuth}
                  options={[
                    { value: "ssh", label: "SSH key" },
                    { value: "password", label: "Password" },
                  ]}
                />
              </div>
            </div>
          </ConfigSection>
        )}

        <ConfigSection title="Frequency">
          <SegmentedControl
            value={frequency}
            onChange={setFrequency}
            options={[
              { value: "weekly", label: "Weekly · Mon 06:00 IST" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
        </ConfigSection>

        <ConfigSection title="Include in export">
          <div className="space-y-1">
            <CheckRow checked={invoices} onChange={setInvoices} label="Invoices" />
            <CheckRow checked={payouts} onChange={setPayouts} label="Payouts" />
            <CheckRow checked={audit} onChange={setAudit} label="Audit trail (CSV bundle)" />
          </div>
        </ConfigSection>

        <ConfigSection title="GL code mapping" hint="Skill bucket → general ledger code">
          <MappingList rows={glMappings} />
        </ConfigSection>

        <ConfigSection title="Procurement">
          <CheckRow
            checked={poRequired}
            onChange={setPoRequired}
            label="Require PO before task pricing"
            description="Each project must have a purchase order mapped before contributors can be staffed at billable rates."
          />
        </ConfigSection>

        <PhaseNote>ERP connector persistence ships with the finance integrations API.</PhaseNote>
      </ConfigPanel>
    </IntegrationDetailShell>
  );
}
