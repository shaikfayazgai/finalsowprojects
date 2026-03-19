"use client";

import {
  AlertCircle, ArrowRight, Building2, Upload, MapPin, FileText,
  CheckCircle, RefreshCw, Clock,
} from "lucide-react";
import {
  GlassCard, GlassCardContent, Button, Input, Label,
} from "@/components/ui";

interface TaxIdConfig {
  label: string;
  placeholder: string;
  validate: (v: string) => boolean;
  format: string;
}

interface Props {
  companyName: string;
  countryOfIncorporation: string;
  incorporationFile: File | null;
  setIncorporationFile: (v: File | null) => void;
  incorporationDrag: boolean;
  setIncorporationDrag: (v: boolean) => void;
  taxId: string;
  setTaxId: (v: string) => void;
  taxIdConfig: TaxIdConfig;
  addressLine1: string;
  setAddressLine1: (v: string) => void;
  addressLine2: string;
  setAddressLine2: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  stateProvince: string;
  setStateProvince: (v: string) => void;
  postalCode: string;
  setPostalCode: (v: string) => void;
  verificationStatus: "idle" | "verifying" | "verified" | "pending-review";
  error: string;
  onContinue: () => void;
}

export function Step1CompanyVerification({
  companyName, countryOfIncorporation,
  incorporationFile, setIncorporationFile,
  incorporationDrag, setIncorporationDrag,
  taxId, setTaxId, taxIdConfig,
  addressLine1, setAddressLine1,
  addressLine2, setAddressLine2,
  city, setCity,
  stateProvince, setStateProvince,
  postalCode, setPostalCode,
  verificationStatus, error, onContinue,
}: Props) {
  const acceptedTypes = ["application/pdf", "image/jpeg", "image/png"];

  return (
    <GlassCard variant="heavy" padding="lg">
      <GlassCardContent>
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-beige-400 uppercase tracking-widest">Step 1 of 4</p>
          <p className="font-heading font-semibold text-brown-950 text-lg mt-0.5">Company Verification</p>
          <p className="text-xs text-beige-500 mt-0.5">Verify your legal entity identity for compliance and billing</p>
        </div>

        <div className="space-y-5">

          {/* Company Identity (read-only) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-brown-100 flex items-center justify-center shrink-0">
                <Building2 className="w-3 h-3 text-brown-500" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">Company Identity</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Company Name</Label>
                <Input value={companyName} disabled className="opacity-70" />
              </div>
              <div className="space-y-1.5">
                <Label>Country of Incorporation</Label>
                <Input value={countryOfIncorporation} disabled className="opacity-70" />
              </div>
            </div>
          </div>

          {/* Incorporation Document */}
          <div className="pt-2 border-t border-beige-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-beige-100 flex items-center justify-center shrink-0">
                <Upload className="w-3 h-3 text-beige-500" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">Certificate of Incorporation</p>
              <span className="text-red-400 text-xs">*</span>
              <span className="text-[10px] text-beige-400 font-medium ml-auto">PDF, JPG, PNG · max 10 MB</span>
            </div>

            <label
              onDragOver={e => { e.preventDefault(); setIncorporationDrag(true); }}
              onDragLeave={() => setIncorporationDrag(false)}
              onDrop={e => {
                e.preventDefault();
                setIncorporationDrag(false);
                const file = e.dataTransfer.files[0];
                if (file && acceptedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024) setIncorporationFile(file);
              }}
              className={`flex items-center gap-3 w-full rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-all ${
                incorporationDrag
                  ? "border-brown-400 bg-brown-50"
                  : incorporationFile
                  ? "border-teal-400 bg-teal-50"
                  : "border-beige-300 hover:border-beige-400 bg-white"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file && file.size <= 10 * 1024 * 1024) setIncorporationFile(file);
                }}
              />
              {incorporationFile ? (
                <>
                  <FileText className="w-5 h-5 text-teal-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-teal-800 truncate">{incorporationFile.name}</p>
                    <p className="text-[10px] text-teal-600">{(incorporationFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-beige-400 shrink-0" />
                  <div>
                    <p className="text-sm text-brown-700 font-medium">Drop file here or click to browse</p>
                    <p className="text-[10px] text-beige-400 mt-0.5">PDF, JPG, or PNG — max 10 MB</p>
                  </div>
                </>
              )}
            </label>
          </div>

          {/* Tax ID */}
          <div className="pt-2 border-t border-beige-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-teal-100 flex items-center justify-center shrink-0">
                <FileText className="w-3 h-3 text-teal-500" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">Tax Identification</p>
              <span className="text-red-400 text-xs">*</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tax-id">{taxIdConfig.label}</Label>
              <Input
                id="tax-id"
                placeholder={taxIdConfig.placeholder}
                value={taxId}
                onChange={e => setTaxId(e.target.value)}
              />
              <p className="text-[10px] text-beige-400">Format: {taxIdConfig.format}</p>
            </div>
          </div>

          {/* Registered Address */}
          <div className="pt-2 border-t border-beige-100 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
                <MapPin className="w-3 h-3 text-amber-600" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">Registered Company Address</p>
              <span className="text-red-400 text-xs">*</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label>Address Line 1 <span className="text-red-400">*</span></Label>
                <Input placeholder="Street address, building name" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Address Line 2</Label>
                <Input placeholder="Floor, suite, unit (optional)" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>City <span className="text-red-400">*</span></Label>
                  <Input placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>State / Province <span className="text-red-400">*</span></Label>
                  <Input placeholder="State or province" value={stateProvince} onChange={e => setStateProvince(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Postal / ZIP Code <span className="text-red-400">*</span></Label>
                  <Input placeholder="Postal code" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input value={countryOfIncorporation} disabled className="opacity-70" />
                </div>
              </div>
            </div>
          </div>

          {/* Verification status */}
          {verificationStatus !== "idle" && (
            <div className={`flex items-center gap-2.5 p-3 rounded-xl border ${
              verificationStatus === "verified"
                ? "bg-teal-50 border-teal-200"
                : verificationStatus === "verifying"
                ? "bg-beige-50 border-beige-200"
                : "bg-amber-50 border-amber-200"
            }`}>
              {verificationStatus === "verifying" && <RefreshCw className="w-4 h-4 text-brown-500 animate-spin shrink-0" />}
              {verificationStatus === "verified" && <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />}
              {verificationStatus === "pending-review" && <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
              <p className="text-xs font-medium">
                {verificationStatus === "verifying" && "Verifying your company details..."}
                {verificationStatus === "verified" && "Company verified successfully."}
                {verificationStatus === "pending-review" && "Your details are under review. We'll notify you within 1 business day. You can continue with the remaining steps."}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onContinue}
            disabled={verificationStatus === "verifying"}
          >
            {verificationStatus === "verifying" ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying...</>
            ) : (
              <>Continue <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
