"use client";

import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className">;

/** Password field with a show/hide toggle. Accepts the usual input props (name, value, onChange...). */
export const PasswordInput: React.FC<Props> = (props) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className="w-full bg-white text-black border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1449b2] placeholder-gray-300 transition-colors pr-10"
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
      </button>
    </div>
  );
};
