import { Suspense } from "react";
import type { Metadata } from "next";
import Logo from "../../src/assets/logo";
import SignupForm from "./_components/SignupForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign Up | PairForm",
  description: "Create an account on PairForm to easily coordinate Secret Santa gift exchanges and group matching.",
  alternates: {
    canonical: "https://pair-form.com/sign-up",
  },
};

const Signup = () => {
  return (
    <div className="flex flex-col justify-center items-center px-4 w-full min-h-screen bg-[#f3f4f6] text-black py-12 font-sora">
      <Link href="/">   <Logo className="h-9 w-auto mb-6" /></Link>
      <Suspense fallback={<div className="p-8 text-center text-gray-500 font-semibold">Loading form...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
};

export default Signup;
