"use client";

import { apiFetch } from "@/services/api";
import { errorMessage } from "@/utils/errors";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { logger } from "@/utils/logger";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/assets/logo";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";

type StepType = "email" | "code" | "change-password" | "success";

const RESEND_WAIT_SECONDS = 60;
const CODE_LENGTH = 6;

const ForgotPasswordForm = () => {
  const router = useRouter();
  const [step, setStep] = useState<StepType>("email");
  const [email, setEmail] = useState("");
  const [codeValues, setCodeValues] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Timer state for Code verification screen
  // Countdown before another code can be requested.
  const [timer, setTimer] = useState(RESEND_WAIT_SECONDS);
  useEffect(() => {
    if (step !== "code") return;
    setTimer(RESEND_WAIT_SECONDS);
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Input refs for verification code
  const codeRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleCodeChange = (index: number, val: string) => {
    const digits = val.replace(/\D/g, "");
    const next = [...codeValues];

    if (digits.length > 1) {
      // A pasted code fills the boxes from this one onwards.
      digits.split("").forEach((digit, offset) => {
        if (index + offset < CODE_LENGTH) next[index + offset] = digit;
      });
      setCodeValues(next);
      codeRefs[Math.min(index + digits.length, CODE_LENGTH - 1)].current?.focus();
      return;
    }

    next[index] = digits;
    setCodeValues(next);
    if (digits && index < CODE_LENGTH - 1) codeRefs[index + 1].current?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeValues[index] && index > 0) {
      codeRefs[index - 1].current?.focus();
    }
  };

  const code = codeValues.join("");

  /** Calls the reset API and shows its message if it fails. Returns whether it worked. */
  const callReset = async (body: Record<string, string>, fallback: string) => {
    setLoading(true);
    try {
      await apiFetch("/api/auth/password-reset", { body: { email: email.trim(), ...body } });
      return true;
    } catch (error) {
      logger.error("Password reset error:", error);
      toast.error(errorMessage(error) || fallback);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestCode = () => callReset({ action: "request" }, "We could not send the code. Please try again.");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    if (await requestCode()) {
      toast.success(`We sent a 6-digit code to ${email.trim()}.`);
      setStep("code");
    }
  };

  const handleResend = async () => {
    if (await requestCode()) {
      setCodeValues(Array(CODE_LENGTH).fill(""));
      setTimer(RESEND_WAIT_SECONDS);
      toast.success("We sent a new code. Earlier codes no longer work.");
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < CODE_LENGTH) {
      toast.error("Please enter all 6 digits");
      return;
    }
    if (await callReset({ action: "verify", code }, "That code is not correct.")) {
      setStep("change-password");
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (await callReset({ action: "confirm", code, password }, "We could not update your password.")) {
      toast.success("Password updated successfully!");
      setStep("success");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 w-full min-h-screen bg-gray-800/80 text-black py-12 font-sora">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 flex flex-col items-center relative overflow-hidden">
        {/* Top-Right close button */}
        <button
          onClick={() => router.push("/login")}
          className="absolute top-6 right-6 w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-colors"
        >
          <span className="text-lg">×</span>
        </button>

        {/* Pair Form Header logo */}
        <Logo className="h-9 w-auto mb-8 mt-2" />

        {/* STEP 1: RESET PASSWORD BY EMAIL */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Reset Password</h1>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                Enter the email address linked to your account and we'll send you a 6-digit code to reset your password.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="e.g John@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white text-black border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1449b2] placeholder-gray-300 transition-colors"
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full bg-[#1449b2] hover:bg-[#0f3d99] text-white rounded-full py-4 text-base font-semibold shadow-md transition-colors"
            >
              Send Code
            </Button>

          </form>
        )}

        {/* STEP 3: CODE VERIFICATION */}
        {step === "code" && (
          <form onSubmit={handleCodeSubmit} className="w-full flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Enter Verification Code</h1>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below to continue. Check your spam folder if you cannot find it.
              </p>
            </div>

            {/* 6 Digit Squares */}
            <div className="flex gap-2.5 justify-center my-4">
              {codeValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={codeRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  autoComplete={idx === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${idx + 1} of the code`}
                  value={val}
                  onChange={(e) => handleCodeChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-12 text-center bg-gray-100 text-black border border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#1449b2] transition-colors"
                />
              ))}
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full bg-[#1449b2] hover:bg-[#0f3d99] text-white rounded-full py-4 text-base font-semibold shadow-md transition-colors"
            >
              Verify
            </Button>

            <div className="text-center mt-2">
              {timer > 0 ? (
                <span className="text-sm text-gray-400 font-semibold">
                  Resend code in {formatTimer(timer)}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-sm text-[#1449b2] font-semibold hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 4: CHANGE PASSWORD */}
        {step === "change-password" && (
          <form onSubmit={handleChangePasswordSubmit} className="w-full flex flex-col gap-5">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Change Password</h1>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                Choose a strong password you haven't used before.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                Password
              </label>
              <PasswordInput
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                Confirm Password
              </label>
              <PasswordInput
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full bg-[#1449b2] hover:bg-[#0f3d99] text-white rounded-full py-4 text-base font-semibold shadow-md transition-colors mt-2"
            >
              Save New Password
            </Button>
          </form>
        )}

        {/* STEP 5: SUCCESS PAGE */}
        {step === "success" && (
          <div className="w-full flex flex-col gap-6 text-center items-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-2 text-green-500">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Password Changed!</h1>
              <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                Your password has been successfully updated. You can now use your new password to log back in.
              </p>
            </div>

            <button
              onClick={() => router.push("/login")}
              className="bg-[#e5e7eb] hover:bg-gray-300 text-gray-700 font-semibold px-12 py-3 rounded-full text-sm transition-colors shadow-sm w-full max-w-xs cursor-pointer mt-4"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Gray capsule footer link to Back to Login (Only show on Step 4 and 5) */}
        {(step === "change-password") && (
          <div className="w-full flex justify-center mt-8">
            <button
              onClick={() => router.push("/login")}
              className="bg-[#e5e7eb] hover:bg-gray-300 text-gray-700 font-semibold px-10 py-2.5 rounded-full text-sm transition-colors shadow-sm cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
