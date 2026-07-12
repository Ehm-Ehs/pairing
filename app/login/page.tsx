import type { Metadata } from "next";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = {
  title: "Login | PairForm",
  description: "Sign in to your PairForm account to manage your Secret Santa groups and team pairings.",
  alternates: {
    canonical: "https://pair-form.com/login",
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
