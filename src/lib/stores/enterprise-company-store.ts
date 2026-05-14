import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface EnterpriseCompanyData {
  companyName: string;
  industryType: string;
  companySize: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  addrState: string;
  postalCode: string;
  country: string;
  website: string;
  primaryEmail: string;
  taxId: string;
  logoDataUrl: string;
}

const EMPTY_COMPANY: EnterpriseCompanyData = {
  companyName: "",
  industryType: "Technology",
  companySize: "51-200",
  addressLine1: "",
  addressLine2: "",
  city: "",
  addrState: "",
  postalCode: "",
  country: "",
  website: "",
  primaryEmail: "",
  taxId: "",
  logoDataUrl: "",
};

interface EnterpriseCompanyStoreState {
  company: EnterpriseCompanyData;
  setCompany: (patch: Partial<EnterpriseCompanyData>) => void;
  resetCompany: () => void;
}

export const useEnterpriseCompanyStore = create<EnterpriseCompanyStoreState>()(
  persist(
    (set) => ({
      company: EMPTY_COMPANY,
      setCompany: (patch) =>
        set((s) => ({ company: { ...s.company, ...patch } })),
      resetCompany: () => set({ company: EMPTY_COMPANY }),
    }),
    { name: "gt-enterprise-company", version: 1 },
  ),
);
