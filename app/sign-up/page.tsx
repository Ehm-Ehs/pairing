import { Suspense } from "react";
import Logo from "../../src/assets/logo";
import SignupForm from "./_components/SignupForm";

const Signup = () => {
  return (
    <div className="flex flex-col justify-center items-center px-4 w-full min-h-screen bg-[#f3f4f6] text-black py-12 font-sora">
      <Logo className="h-9 w-auto mb-6" />
      <Suspense fallback={<div className="p-8 text-center text-gray-500 font-semibold">Loading form...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
};

export default Signup;
