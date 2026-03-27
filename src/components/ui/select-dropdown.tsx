"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import { cn } from "@/lib/utils/cn";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ══════════════════════════════════════════
   Types
   ══════════════════════════════════════════ */
export interface SelectOption {
  label: string;
  value: string;
  countryCode?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectDropdownProps {
  /** Array of options to display */
  options: SelectOption[];
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Error state */
  error?: boolean;
  /** Disable the dropdown */
  disabled?: boolean;
  /** Custom className for the trigger */
  className?: string;
  /** Custom className for the popover content */
  contentClassName?: string;
  /** Height of the dropdown list */
  dropdownHeight?: number;
  /** Whether to enable search functionality */
  searchable?: boolean;
  /** Custom filter function for search */
  filterFn?: (option: SelectOption, searchTerm: string) => boolean;
  /** Custom render function for option */
  renderOption?: (option: SelectOption, isSelected: boolean) => React.ReactNode;
  /** Custom render function for selected value */
  renderSelected?: (option: SelectOption | undefined) => React.ReactNode;
  /** ID for accessibility */
  id?: string;
  /** Name for form submission */
  name?: string;
}

/* ══════════════════════════════════════════
   Default filter function
   ══════════════════════════════════════════ */
const defaultFilterFn = (option: SelectOption, searchTerm: string): boolean => {
  return option.label.toLowerCase().includes(searchTerm.toLowerCase());
};

/* ══════════════════════════════════════════
   Default render functions
   ══════════════════════════════════════════ */
const defaultRenderOption = (
  option: SelectOption,
  isSelected: boolean
): React.ReactNode => (
  <>
    <span className="flex items-center gap-3 flex-1">
      {option.countryCode && (
        <span className="shrink-0 w-6 h-4 relative flex items-center justify-center overflow-hidden rounded-sm">
          <ReactCountryFlag
            countryCode={option.countryCode}
            svg
            style={{
              width: "24px",
              height: "18px",
              objectFit: "cover",
            }}
            title={option.countryCode}
          />
        </span>
      )}
      {option.icon && (
        <span className="shrink-0">{option.icon}</span>
      )}
      <span className="font-body">{option.label}</span>
    </span>
    {isSelected && (
      <Check className="w-4 h-4 shrink-0" style={{ color: "#A67763" }} />
    )}
  </>
);

const defaultRenderSelected = (
  option: SelectOption | undefined,
  placeholder: string
): React.ReactNode => {
  if (!option) {
    return (
      <span style={{ color: "var(--ink-faint)" }}>{placeholder}</span>
    );
  }
  return (
    <span className="flex items-center gap-2">
      {option.countryCode && (
        <span className="shrink-0 w-5 h-4 relative flex items-center justify-center overflow-hidden rounded-sm">
          <ReactCountryFlag
            countryCode={option.countryCode}
            svg
            style={{
              width: "20px",
              height: "15px",
              objectFit: "cover",
            }}
            title={option.countryCode}
          />
        </span>
      )}
      {option.icon && <span>{option.icon}</span>}
      <span>{option.label}</span>
    </span>
  );
};

/* ══════════════════════════════════════════
   Select Dropdown Component
   ══════════════════════════════════════════ */
export function SelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  error = false,
  disabled = false,
  className,
  contentClassName,
  dropdownHeight = 240,
  searchable = true,
  filterFn = defaultFilterFn,
  renderOption = defaultRenderOption,
  renderSelected,
  id,
  name,
}: SelectDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search term
  const filteredOptions = searchable && search
    ? options.filter((opt) => filterFn(opt, search))
    : options;

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (open && searchable) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, searchable]);

  // Clear search when dropdown closes
  React.useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setSearch("");
    setOpen(false);
  };

  const renderSelectedFn = renderSelected || ((opt) => defaultRenderSelected(opt, placeholder));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          name={name}
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border bg-white px-4 py-2 font-body text-sm transition-all duration-200 cursor-pointer text-left",
            error && "border-red-400",
            disabled && "opacity-50 cursor-not-allowed bg-gray-50",
            className
          )}
          style={{
            color: value ? "var(--ink)" : "var(--ink-faint)",
            borderColor: error
              ? undefined
              : open
              ? "rgba(166,119,99,0.35)"
              : "var(--border-soft)",
            boxShadow: open ? "0 0 0 2px rgba(166,119,99,0.08)" : "none",
          }}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-disabled={disabled}
        >
          {renderSelectedFn(selectedOption)}
          <ChevronDown
            className={cn(
              "w-4 h-4 shrink-0 opacity-50 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className={cn(
          "p-0 bg-white rounded-xl overflow-hidden",
          contentClassName
        )}
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={8}
        style={{
          width: "var(--radix-popover-trigger-width)",
          zIndex: 9999,
          border: "1px solid var(--border-soft)",
          boxShadow: "0 8px 24px rgba(77,55,46,0.15)",
        }}
      >
        {/* Search Input */}
        {searchable && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 border-b"
            style={{ borderColor: "var(--border-soft)" }}
          >
            <Search
              className="w-4 h-4 shrink-0"
              style={{ color: "var(--ink-faint)" }}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-sm font-body bg-transparent outline-none placeholder:text-beige-400"
              style={{ color: "var(--ink)" }}
              aria-label="Search options"
            />
          </div>
        )}

        {/* Options List */}
        <ScrollArea style={{ height: dropdownHeight }}>
          <div className="py-1" role="listbox">
            {filteredOptions.length === 0 ? (
              <p
                className="px-3 py-4 text-center text-sm"
                style={{ color: "var(--ink-faint)" }}
              >
                No results found
              </p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 text-sm font-body transition-colors text-left",
                      isSelected
                        ? "bg-brown-50/60"
                        : "hover:bg-beige-50/80",
                      option.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                    )}
                    style={{ color: "var(--ink)" }}
                  >
                    {renderOption(option, isSelected)}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/* ══════════════════════════════════════════
   Country-Specific Helper Functions
   ══════════════════════════════════════════ */

/**
 * Convert country data array to SelectOption format with country codes for flags
 * @param countries - Array of country objects with code and name
 * @returns Array of SelectOption with country codes for flag display
 */
export function countriesToOptions(
  countries: Array<{ code: string; name: string }>
): SelectOption[] {
  return countries.map((country) => ({
    value: country.code,
    label: country.name,
    countryCode: country.code,
  }));
}

/* ══════════════════════════════════════════
   Pre-defined Country Select Component
   ══════════════════════════════════════════ */

// Comprehensive list of countries
export const COUNTRIES_LIST = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BS", name: "Bahamas" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CF", name: "Central African Republic" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoros" },
  { code: "CG", name: "Congo" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "DJ", name: "Djibouti" },
  { code: "DM", name: "Dominica" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "GQ", name: "Equatorial Guinea" },
  { code: "ER", name: "Eritrea" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Eswatini" },
  { code: "ET", name: "Ethiopia" },
  { code: "FJ", name: "Fiji" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GA", name: "Gabon" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GD", name: "Grenada" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GW", name: "Guinea-Bissau" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haiti" },
  { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KI", name: "Kiribati" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LS", name: "Lesotho" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libya" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MG", name: "Madagascar" },
  { code: "MW", name: "Malawi" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "ML", name: "Mali" },
  { code: "MT", name: "Malta" },
  { code: "MH", name: "Marshall Islands" },
  { code: "MR", name: "Mauritania" },
  { code: "MU", name: "Mauritius" },
  { code: "MX", name: "Mexico" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Myanmar" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Niger" },
  { code: "NG", name: "Nigeria" },
  { code: "KP", name: "North Korea" },
  { code: "MK", name: "North Macedonia" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PW", name: "Palau" },
  { code: "PS", name: "Palestine" },
  { code: "PA", name: "Panama" },
  { code: "PG", name: "Papua New Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "RW", name: "Rwanda" },
  { code: "KN", name: "Saint Kitts and Nevis" },
  { code: "LC", name: "Saint Lucia" },
  { code: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "ST", name: "Sao Tome and Principe" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leone" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "SB", name: "Solomon Islands" },
  { code: "SO", name: "Somalia" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "SS", name: "South Sudan" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SR", name: "Suriname" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TL", name: "Timor-Leste" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad and Tobago" },
  { code: "TN", name: "Tunisia" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "TV", name: "Tuvalu" },
  { code: "UG", name: "Uganda" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VU", name: "Vanuatu" },
  { code: "VA", name: "Vatican City" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

// Pre-computed country options with country codes
export const COUNTRY_OPTIONS: SelectOption[] = countriesToOptions(COUNTRIES_LIST);

/**
 * Pre-built Country Select component with flags
 */
export interface CountrySelectProps
  extends Omit<SelectDropdownProps, "options" | "searchPlaceholder"> {
  /** Use country name as value instead of country code */
  useNameAsValue?: boolean;
}

export function CountrySelect({
  useNameAsValue = false,
  placeholder = "Select your country",
  ...props
}: CountrySelectProps) {
  // Transform options based on useNameAsValue
  const options = React.useMemo(() => {
    if (useNameAsValue) {
      return COUNTRIES_LIST.map((country) => ({
        value: country.name,
        label: country.name,
        countryCode: country.code,
      }));
    }
    return COUNTRY_OPTIONS;
  }, [useNameAsValue]);

  return (
    <SelectDropdown
      {...props}
      options={options}
      placeholder={placeholder}
      searchPlaceholder="Search for a country"
    />
  );
}
