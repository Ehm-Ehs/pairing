import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";

interface ModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  description,
  children,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto my-auto animate-in fade-in zoom-in-95 duration-200">
        <Card className="bg-white rounded-[2rem] p-6 shadow-2xl border border-gray-100">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-xl font-bold text-gray-900 font-heading">{title}</CardTitle>
            {description && <CardDescription className="text-xs text-gray-500 mt-1">{description}</CardDescription>}
          </CardHeader>
          <CardContent className="p-0">
            {children}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                onClick={onClose}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className="bg-[#3A76F0] hover:bg-blue-600 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
