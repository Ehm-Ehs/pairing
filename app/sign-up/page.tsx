import Logo from "../../src/assets/logo";
import SignupForm from "./_components/SignupForm";

const Signup = () => {
  return (
    <div className="flex flex-col justify-center items-center px-4 w-full min-h-screen bg-white text-black">
      <div className="flex items-center gap-2 py-5">
        <div className="w-10 h-10">
          <Logo />
        </div>
        <p className="pt-3 font-semibold">Pair Form </p>
      </div>
      <SignupForm />
    </div>
  );
};

export default Signup;
