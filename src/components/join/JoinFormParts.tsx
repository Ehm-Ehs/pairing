"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErrorMessage, useFormikContext } from "formik";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import PhoneInputWithCountry from "@/components/ui/PhoneInputWithCountry";
import { JOIN_THEMES, JoinAccent } from "./JoinCard";

interface TextFieldProps {
  name: string;
  label: string;
  accent: JoinAccent;
  type?: "text" | "email";
  placeholder?: string;
  /** Small note under the field. */
  hint?: string;
  required?: boolean;
}

/** A labelled text input for join forms, wired to Formik. Must be rendered inside a Formik form. */
export const JoinTextField: React.FC<TextFieldProps> = ({
  name,
  label,
  accent,
  type = "text",
  placeholder,
  hint,
  required = true,
}) => {
  const { values, errors, touched, handleChange, handleBlur } = useFormikContext<Record<string, string>>();
  const invalid = Boolean(errors[name] && touched[name]);

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={values[name] ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={invalid}
        className={`px-4 py-3 w-full bg-white border rounded-xl focus:ring-2 ${JOIN_THEMES[accent].ring} focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium ${
          invalid ? "border-red-500" : "border-gray-200"
        }`}
      />
      <ErrorMessage name={name} component="div" className="text-red-500 text-xs mt-1 font-semibold" />
      {hint && <p className="text-gray-400 text-[11px] mt-1.5 pl-1">{hint}</p>}
    </div>
  );
};

/** Optional WhatsApp number field for join forms. Must be rendered inside a Formik form. */
export const WhatsAppPhoneField: React.FC = () => {
  const { values, setFieldValue } = useFormikContext<{ phone?: string }>();
  return (
    <div>
      <label htmlFor="phone" className="block text-sm font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
        <FaWhatsapp className="text-emerald-600 w-4 h-4" />
        <span>WhatsApp Phone Number (Optional)</span>
      </label>
      <PhoneInputWithCountry
        id="phone"
        name="phone"
        value={values.phone || ""}
        onChange={(val) => setFieldValue("phone", val)}
      />
      <ErrorMessage name="phone" component="div" className="text-red-500 text-xs mt-1 font-semibold" />
      <p className="text-gray-400 text-[11px] mt-1.5 pl-1">
        Select your country code and enter your WhatsApp phone number
      </p>
    </div>
  );
};

interface FooterProps {
  accent: JoinAccent;
  submitting: boolean;
  /** Text of the submit button, e.g. "Join event >". */
  label: string;
}

/** Cancel and submit buttons at the bottom of a join form. */
export const JoinFormFooter: React.FC<FooterProps> = ({ accent, submitting, label }) => {
  const router = useRouter();
  const size = "font-bold px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-xs sm:text-sm transition-all flex-1 cursor-pointer whitespace-nowrap";

  return (
    <div className="bg-[#F5F6F8] p-6 flex flex-col gap-4 border-t border-gray-200 w-full rounded-b-[2rem]">
      <div className="flex items-center justify-center gap-4 w-full">
        <button
          type="button"
          onClick={() => router.push("/")}
          className={`bg-[#E5E7EB] hover:bg-[#D1D5DB] text-gray-700 shadow-sm text-center ${size}`}
        >
          Cancel
        </button>
        <Button
          type="submit"
          disabled={submitting}
          isLoading={submitting}
          className={`bg-gradient-to-b ${JOIN_THEMES[accent].button} hover:opacity-95 text-white shadow-md flex items-center justify-center gap-1.5 h-auto ${size}`}
        >
          {submitting ? "Joining..." : label}
        </Button>
      </div>
      <p className="text-center text-[11px] text-gray-500">
        Your details are shared with the organizer and used only to run this event.{" "}
        <Link href="/privacy" target="_blank" className="underline hover:text-gray-700">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
};
