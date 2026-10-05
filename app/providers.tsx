"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ReactNode } from "react";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { PWARegister } from "@/components/pwa/PWARegister";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      {children}
      <ToastContainer hideProgressBar />
      <PWARegister />
      <PWAInstallPrompt />
    </WorkspaceProvider>
  );
}


