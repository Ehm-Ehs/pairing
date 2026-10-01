import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = {
  title: "Login | PairForm",
  description: "Sign in to your PairForm account to manage your Secret Santa groups and team pairings.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://pair-form.com/login",
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500 text-sm font-semibold">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
