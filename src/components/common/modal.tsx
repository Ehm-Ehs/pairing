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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-4">
        <Card className="bg-white shadow-xl">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>
            {children}
            <div className="flex justify-end gap-4 mt-6">
              <div
                className="p-2 border border-gray-300 rounded bg-red-400 cursor-pointer "
                onClick={onClose}
              >
                {cancelText}
              </div>
              <div
                className="p-2 border border-gray-300 rounded bg-green-400 cursor-pointer"
                onClick={onConfirm}
              >
                {confirmText}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
