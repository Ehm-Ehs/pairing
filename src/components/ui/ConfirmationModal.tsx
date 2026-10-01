import { ReactNode, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

interface ConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  description?: string | ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "success" | "primary";
  children?: ReactNode;
}

export function ConfirmationModal({
  isOpen,
  title = "Confirm Action",
  message,
  description,
  onConfirm,
  onCancel,
  onClose,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "success",
  children,
}: ConfirmationModalProps) {
  const handleDismiss = onCancel || onClose || (() => {});
  const modalDescription = description || message;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        handleDismiss();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDismiss]);

  if (!isOpen) return null;

  const variantStyles = {
    success: "bg-[#047857] hover:bg-[#065f46]",
    danger: "bg-red-600 hover:bg-red-700",
    primary: "bg-[#3A76F0] hover:bg-[#012A7D]",
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col items-center text-center my-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-6 right-6 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <FaTimes className="w-4 h-4" />
        </button>

        <h3 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight">
          {title}
        </h3>
        {modalDescription && (
          <div className="text-sm text-gray-500 mb-6 leading-relaxed">
            {modalDescription}
          </div>
        )}

        {children}

        <div className="flex gap-4 w-full mt-4">
          <button
            type="button"
            onClick={handleDismiss}
            className="bg-gray-100 hover:bg-gray-250 text-gray-700 px-6 py-3 rounded-full text-xs font-bold transition-all flex-1 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${variantStyles[confirmVariant]} text-white px-6 py-3 rounded-full text-xs font-bold transition-all flex-1 shadow-md cursor-pointer`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
