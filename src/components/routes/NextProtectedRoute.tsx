"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthListener } from "../../hooks/useAuthListener";
import { Loading } from "../ui/loading";
import Layout from "../layout/layout";
import { FaSpinner } from "react-icons/fa";
import { GroupingsPageProps } from "../../types";

interface NextProtectedRouteProps {
  children: (user: GroupingsPageProps) => React.ReactNode;
}

const NextProtectedRoute = ({ children }: NextProtectedRouteProps) => {
  const { user, loading } = useAuthListener();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Loading
        message="Loading..."
        icon={<FaSpinner className="w-12 h-12 animate-spin" />}
      />
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <Layout user={user}>{children(user)}</Layout>;
};

export default NextProtectedRoute;
