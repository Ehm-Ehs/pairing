"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../src/services/firebase";
import Link from "next/link";
import Logo from "../../../src/assets/logo";
import { toast } from "react-toastify";
import { Button } from "../../../src/components/ui/button";
import { getFriendlyFirebaseErrorMessage } from "../../../src/utils/firebaseErrorUtils";
import { FaEye, FaEyeSlash } from "react-icons/fa";

type StepType = "email" | "phone" | "code" | "change-password" | "success";

const ForgotPasswordForm = () => {
  const router = useRouter();
  const [step, setStep] = useState<StepType>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [codeValues, setCodeValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Timer state for Code verification screen
  const [timer, setTimer] = useState(119); // 1:59
  useEffect(() => {
    if (step !== "code") return;
    setTimer(119);
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
    // Only accept numbers/alphabetic
    const cleaned = val.replace(/[^0-9a-zA-Z]/g, "").slice(-1);
    const newCode = [...codeValues];
    newCode[index] = cleaned;
    setCodeValues(newCode);

    if (cleaned.length > 0 && index < 5) {
      codeRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codeValues[index] && index > 0) {
      codeRefs[index - 1].current?.focus();
    }
  };

  // Submit handlers
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
      // Move to success screen or code verification screen
      setStep("code");
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast.error(getFriendlyFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }
    toast.success("Verification code sent to your phone!");
    setStep("code");
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const joinedCode = codeValues.join("");
    if (joinedCode.length < 6) {
      toast.error("Please enter all 6 digits");
      return;
    }
    // Simulate verification
    toast.success("Code verified successfully!");
    setStep("change-password");
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    // Simulate updating password success
    toast.success("Password updated successfully!");
    setStep("success");
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
                Enter the email address linked to your account and we'll send you a link to reset your password.
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
              Send Reset Link
            </Button>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-sm text-[#1449b2] font-semibold hover:underline"
              >
                Reset via Phone Number instead
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: RESET PASSWORD BY PHONE */}
        {step === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="w-full flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Reset Password</h1>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                Enter the Phone number linked to your account and we'll send you a link to reset your password.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                required
                placeholder="Phone Number (234 *** *** **15)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white text-black border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1449b2] placeholder-gray-300 transition-colors"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1449b2] hover:bg-[#0f3d99] text-white rounded-full py-4 text-base font-semibold shadow-md transition-colors"
            >
              Send Verification Code
            </Button>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => setStep("email")}
                className="text-sm text-[#1449b2] font-semibold hover:underline"
              >
                Reset via Email address instead
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: CODE VERIFICATION */}
        {step === "code" && (
          <form onSubmit={handleCodeSubmit} className="w-full flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Enter Verification Code</h1>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                We sent a 6-digit code to your {email ? "email" : "phone"}. Enter it below to continue.
              </p>
            </div>

            {/* 6 Digit Squares */}
            <div className="flex gap-2.5 justify-center my-4">
              {codeValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={codeRefs[idx]}
                  type="text"
                  pattern="[0-9a-zA-Z]*"
                  value={val}
                  onChange={(e) => handleCodeChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-12 text-center bg-gray-100 text-black border border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#1449b2] transition-colors"
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#1449b2] hover:bg-[#0f3d99] text-white rounded-full py-4 text-base font-semibold shadow-md transition-colors"
            >
              Verify
            </Button>

            <div className="text-center mt-2">
              {timer > 0 ? (
                <span className="text-sm text-gray-400 font-semibold">
                  Resend Link ({formatTimer(timer)})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setTimer(119)}
                  className="text-sm text-[#1449b2] font-semibold hover:underline"
                >
                  Resend Link
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white text-black border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1449b2] placeholder-gray-300 transition-colors pr-10"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder=""
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white text-black border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1449b2] placeholder-gray-300 transition-colors pr-10"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
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
