import { errorMessage } from "@/utils/errors";
import React from "react";
import { toast } from "react-toastify";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
}

const BUTTON = "font-bold px-4 py-1.5 rounded-full text-[10px] transition-colors cursor-pointer";

/** Asks the user to confirm a destructive action in a toast that stays until answered. */
export function confirmToast({ title, message, confirmLabel, onConfirm }: ConfirmOptions) {
  toast(
    ({ closeToast }) => (
      <div className="flex flex-col gap-2.5 text-left p-1">
        <p className="font-bold text-gray-900 text-sm font-heading">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed font-medium">{message}</p>
        <div className="flex gap-2 justify-end mt-2">
          <button type="button" onClick={closeToast} className={`bg-gray-100 hover:bg-gray-200 text-gray-700 ${BUTTON}`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              closeToast();
              onConfirm();
            }}
            className={`bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm ${BUTTON}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    ),
    { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, closeButton: false }
  );
}

/** Runs an action and reports the outcome with success and error toasts. */
export async function runWithToast(action: () => Promise<unknown>, success: string, failure: string) {
  try {
    await action();
    toast.success(success);
  } catch (err) {
    toast.error(`${failure}: ${errorMessage(err)}`);
  }
}
