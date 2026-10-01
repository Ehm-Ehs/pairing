import type { Metadata } from "next";
import ForgotPasswordForm from "./_components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | PairForm",
  description: "Recover your PairForm account password.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "https://pair-form.com/forgot-password",
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
