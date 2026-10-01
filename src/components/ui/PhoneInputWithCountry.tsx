"use client";

import React, { useState, useEffect } from "react";
import { FaWhatsapp } from "react-icons/fa";

export interface CountryCode {
  code: string; // e.g. "+234"
  country: string; // e.g. "Nigeria"
  flag: string; // e.g. "🇳🇬"
  iso: string; // e.g. "NG"
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "+234", country: "Nigeria", flag: "🇳🇬", iso: "NG" },
  { code: "+1", country: "United States / Canada", flag: "🇺🇸", iso: "US" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧", iso: "GB" },
  { code: "+233", country: "Ghana", flag: "🇬🇭", iso: "GH" },
  { code: "+254", country: "Kenya", flag: "🇰🇪", iso: "KE" },
  { code: "+27", country: "South Africa", flag: "🇿🇦", iso: "ZA" },
  { code: "+20", country: "Egypt", flag: "🇪🇬", iso: "EG" },
  { code: "+91", country: "India", flag: "🇮🇳", iso: "IN" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪", iso: "AE" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", iso: "SA" },
  { code: "+49", country: "Germany", flag: "🇩🇪", iso: "DE" },
  { code: "+33", country: "France", flag: "🇫🇷", iso: "FR" },
  { code: "+39", country: "Italy", flag: "🇮🇹", iso: "IT" },
  { code: "+34", country: "Spain", flag: "🇪🇸", iso: "ES" },
  { code: "+61", country: "Australia", flag: "🇦🇺", iso: "AU" },
  { code: "+55", country: "Brazil", flag: "🇧🇷", iso: "BR" },
  { code: "+52", country: "Mexico", flag: "🇲🇽", iso: "MX" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰", iso: "PK" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩", iso: "BD" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩", iso: "ID" },
  { code: "+63", country: "Philippines", flag: "🇵🇭", iso: "PH" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾", iso: "MY" },
  { code: "+65", country: "Singapore", flag: "🇸🇬", iso: "SG" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿", iso: "NZ" },
  { code: "+353", country: "Ireland", flag: "🇮🇪", iso: "IE" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱", iso: "NL" },
  { code: "+46", country: "Sweden", flag: "🇸🇪", iso: "SE" },
  { code: "+47", country: "Norway", flag: "🇳🇴", iso: "NO" },
  { code: "+358", country: "Finland", flag: "🇫🇮", iso: "FI" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭", iso: "CH" },
  { code: "+43", country: "Austria", flag: "🇦🇹", iso: "AT" },
  { code: "+32", country: "Belgium", flag: "🇧🇪", iso: "BE" },
  { code: "+351", country: "Portugal", flag: "🇵🇹", iso: "PT" },
  { code: "+48", country: "Poland", flag: "🇵🇱", iso: "PL" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦", iso: "UA" },
  { code: "+86", country: "China", flag: "🇨🇳", iso: "CN" },
  { code: "+81", country: "Japan", flag: "🇯🇵", iso: "JP" },
  { code: "+82", country: "South Korea", flag: "🇰🇷", iso: "KR" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳", iso: "VN" },
  { code: "+66", country: "Thailand", flag: "🇹🇭", iso: "TH" },
  { code: "+57", country: "Colombia", flag: "🇨🇴", iso: "CO" },
  { code: "+54", country: "Argentina", flag: "🇦🇷", iso: "AR" },
  { code: "+56", country: "Chile", flag: "🇨🇱", iso: "CL" },
  { code: "+51", country: "Peru", flag: "🇵🇪", iso: "PE" },
  { code: "+1876", country: "Jamaica", flag: "🇯🇲", iso: "JM" },
  { code: "+1868", country: "Trinidad & Tobago", flag: "🇹🇹", iso: "TT" },
];

interface PhoneInputWithCountryProps {
  value?: string;
  onChange: (fullFormattedValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  error?: string;
  showIcon?: boolean;
  className?: string;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value = "",
  onChange,
  placeholder = "801 234 5678",
  disabled = false,
  id = "phone",
  name = "phone",
  error,
  showIcon = true,
  className = "",
}) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("+234");
  const [nationalNumber, setNationalNumber] = useState<string>("");

  // Parse incoming full phone value
  useEffect(() => {
    if (!value) {
      setNationalNumber("");
      return;
    }

    const trimmed = value.trim();
    // Check if value starts with any known country code
    const matched = COUNTRY_CODES.find((c) => trimmed.startsWith(c.code));
    if (matched) {
      setSelectedCountryCode(matched.code);
      const rawNumber = trimmed.slice(matched.code.length).replace(/^0+/, "");
      setNationalNumber(rawNumber);
    } else {
      // If starts with +, strip + and set as national number
      const clean = trimmed.replace(/^\+/, "").replace(/^0+/, "");
      setNationalNumber(clean);
    }
  }, [value]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setSelectedCountryCode(newCode);
    const cleanNum = nationalNumber.replace(/^0+/, "");
    if (cleanNum) {
      onChange(`${newCode}${cleanNum}`);
    } else {
      onChange("");
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value.replace(/\D+/g, ""); // digits only
    // If user starts typing a leading zero, strip it
    if (inputVal.startsWith("0")) {
      inputVal = inputVal.replace(/^0+/, "");
    }
    setNationalNumber(inputVal);

    if (inputVal) {
      onChange(`${selectedCountryCode}${inputVal}`);
    } else {
      onChange("");
    }
  };

  return (
    <div className={`w-full flex flex-col gap-1 ${className}`}>
      <div className="relative flex items-center rounded-2xl border border-gray-200 bg-white focus-within:border-[#3A76F0] focus-within:ring-2 focus-within:ring-[#3A76F0]/20 transition-all overflow-hidden shadow-sm">
        {/* Left Icon */}
        {showIcon && (
          <div className="pl-3.5 pr-1 text-emerald-600 flex items-center justify-center">
            <FaWhatsapp className="w-5 h-5" />
          </div>
        )}

        {/* Country Code Select */}
        <div className="relative border-r border-gray-200 bg-gray-50/70 hover:bg-gray-100/70 transition-colors flex items-center">
          <select
            value={selectedCountryCode}
            onChange={handleCountryChange}
            disabled={disabled}
            aria-label="Country Code"
            className="appearance-none bg-transparent py-3.5 pl-3 pr-7 text-xs font-bold text-gray-800 cursor-pointer focus:outline-none z-10"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={`${c.iso}-${c.code}`} value={c.code} className="text-gray-900 font-medium">
                {c.flag} {c.code} ({c.country})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2 text-[10px] text-gray-400">
            ▼
          </div>
        </div>

        {/* Phone Number Input */}
        <input
          id={id}
          name={name}
          type="tel"
          value={nationalNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full py-3.5 px-3.5 text-xs font-medium text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none"
        />
      </div>

      {error && <span className="text-[11px] text-red-500 font-semibold pl-1">{error}</span>}
    </div>
  );
};

export default PhoneInputWithCountry;
