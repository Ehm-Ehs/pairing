"use client";
import React, { Suspense, useState, useEffect } from "react";
import NextProtectedRoute from "../../src/components/routes/NextProtectedRoute";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../src/services/firebase";
import { toast } from "react-toastify";
import { Button } from "../../src/components/ui/button";
import { useRouter } from "next/navigation";

const Toggle = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description: string;
}) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0">
    <div className="flex flex-col text-left pr-4">
      <span className="text-sm font-bold text-gray-900">{label}</span>
      <span className="text-xs text-gray-400 font-medium mt-0.5">{description}</span>
    </div>
    <label className="relative inline-flex items-center cursor-pointer select-none flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>
);

const SettingsContent = ({ user }: { user: any }) => {
  const userId = user?.uid || user?.userId || "";
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState({
    eventAssignment: true,
    eventUpdates: true,
    eventReminders: true,
    productUpdates: false,
    whatsappNotifications: false,
  });
  const [defaults, setDefaults] = useState({
    autoClose: true,
    emailConfirmations: true,
    closedEventMessage: "",
    fullEventMessage: "",
  });
  const [saving, setSaving] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!userId) return;
      try {
        const docRef = doc(db, "Users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFullName(`${data.firstName || ""} ${data.lastName || ""}`.trim());
          setEmail(data.email || "");
          if (data.settings?.notifications) {
            setNotifications((prev) => ({
              ...prev,
              ...data.settings.notifications,
            }));
          }
          if (data.settings?.defaults) {
            setDefaults((prev) => ({
              ...prev,
              ...data.settings.defaults,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load user settings:", err);
      }
    };
    loadSettings();
  }, [userId]);



  const saveSettingsData = async () => {
    if (!userId) return false;
    setSaving(true);
    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const docRef = doc(db, "Users", userId);
      await updateDoc(docRef, {
        firstName,
        lastName,
        email: email.trim(),
        settings: {
          notifications,
          defaults,
        },
      });
      toast.success("Settings updated successfully!");
      return true;
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update settings: " + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSignUp = async () => {
    const success = await saveSettingsData();
    if (success) {
      router.push(`/sign-up?email=${encodeURIComponent(email.trim())}&name=${encodeURIComponent(fullName.trim())}`);
    }
  };

  const handleDeclineSignUp = async () => {
    await saveSettingsData();
  };

  const handleSave = async () => {
    const isGuest = user?.isAnonymous || false;
    const hasEmail = email.trim() !== "";

    if (isGuest && hasEmail) {
      setIsSignUpModalOpen(true);
      return;
    }

    await saveSettingsData();
  };

  const handleExportData = async () => {
    if (!userId) return;
    try {
      const docRef = doc(db, "Users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const exportBlob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(exportBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `pair_form_data_${userId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Data exported successfully!");
      }
    } catch {
      toast.error("Failed to export data.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    if (
      confirm(
        "WARNING: This will permanently delete your account, pairings, and all associated data. This action cannot be undone. Do you wish to continue?"
      )
    ) {
      try {
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "Users", userId));

        const { signOut } = await import("firebase/auth");
        const { auth } = await import("../../src/services/firebase");
        await signOut(auth);

        toast.success("Account successfully deleted.");
        window.location.href = "/";
      } catch (err: any) {
        toast.error("Failed to delete account: " + err.message);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 text-center py-6">
      {/* Title Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-heading">
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account preferences and notifications
        </p>
      </div>

      <div className="flex flex-col gap-6 mt-4">
        {/* Card 1: Account Settings */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-sm text-left flex flex-col gap-5">
          <div>
            <h3 className="text-base font-bold text-gray-900 font-heading">
              Account Settings
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Update your profile information
            </p>
          </div>
          <hr className="border-gray-100" />

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-550 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="px-4 py-3 w-full bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium"
              placeholder="Full Name"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-gray-550 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 w-full bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium"
              placeholder="Email Address"
            />
            <p className="text-[10px] text-gray-400 mt-1 font-medium">
              This is where we'll send event notifications
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 mt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              isLoading={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-sm cursor-pointer h-auto"
            >
              Save changes
            </Button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-6 py-2.5 rounded-full transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Card 2: Notification Preferences */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-sm text-left flex flex-col gap-5">
          <div>
            <h3 className="text-base font-bold text-gray-900 font-heading">
              Notification Preferences
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Choose what updates you want to receive
            </p>
          </div>
          <hr className="border-gray-100" />

          <div className="flex flex-col">
            <Toggle
              checked={notifications.eventAssignment}
              onChange={(val) =>
                setNotifications((prev) => ({ ...prev, eventAssignment: val }))
              }
              label="Event Assignment Notifications"
              description="Get notified when you're assigned to a group, pair, or position"
            />
            <Toggle
              checked={notifications.whatsappNotifications}
              onChange={(val) =>
                setNotifications((prev) => ({ ...prev, whatsappNotifications: val }))
              }
              label="WhatsApp Notifications"
              description="Receive notifications and event updates directly on WhatsApp"
            />
            <Toggle
              checked={notifications.eventUpdates}
              onChange={(val) =>
                setNotifications((prev) => ({ ...prev, eventUpdates: val }))
              }
              label="Event Updates"
              description="Receive updates when event details change or new participants join"
            />
            <Toggle
              checked={notifications.eventReminders}
              onChange={(val) =>
                setNotifications((prev) => ({ ...prev, eventReminders: val }))
              }
              label="Event Reminders"
              description="Get reminded before your events start"
            />
            <Toggle
              checked={notifications.productUpdates}
              onChange={(val) =>
                setNotifications((prev) => ({ ...prev, productUpdates: val }))
              }
              label="Product Updates"
              description="Hear about new features and improvements"
            />
          </div>
        </div>

        {/* Card 3: Event Defaults */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-sm text-left flex flex-col gap-5">
          <div>
            <h3 className="text-base font-bold text-gray-900 font-heading">
              Event Defaults
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Set default preferences for creating events
            </p>
          </div>
          <hr className="border-gray-100" />

          <div className="flex flex-col">
            <Toggle
              checked={defaults.autoClose}
              onChange={(val) => setDefaults((prev) => ({ ...prev, autoClose: val }))}
              label="Auto-close Events"
              description="Automatically close events when all slots are filled"
            />
            <Toggle
              checked={defaults.emailConfirmations}
              onChange={(val) =>
                setDefaults((prev) => ({ ...prev, emailConfirmations: val }))
              }
              label="Email Confirmations"
              description="Send email confirmations to participants when they join"
            />
            
            <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-gray-100 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-550 uppercase tracking-wider mb-1.5">
                  Default Closed Event Message (Optional)
                </label>
                <input
                  type="text"
                  value={defaults.closedEventMessage || ""}
                  onChange={(e) => setDefaults((prev) => ({ ...prev, closedEventMessage: e.target.value }))}
                  className="px-4 py-3 w-full bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium"
                  placeholder="e.g. Sorry, this event is closed. Stay tuned for our next session!"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-550 uppercase tracking-wider mb-1.5">
                  Default Full Event Message (Optional)
                </label>
                <input
                  type="text"
                  value={defaults.fullEventMessage || ""}
                  onChange={(e) => setDefaults((prev) => ({ ...prev, fullEventMessage: e.target.value }))}
                  className="px-4 py-3 w-full bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium"
                  placeholder="e.g. Sorry, this event is full. Registration is now closed!"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Account Management */}
        <div className="bg-white rounded-3xl border border-gray-150 p-6 md:p-8 shadow-sm text-left flex flex-col gap-5">
          <div>
            <h3 className="text-base font-bold text-gray-900 font-heading">
              Account Management
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Manage your account data
            </p>
          </div>
          <hr className="border-gray-100" />

          <div className="flex flex-col gap-4">
            {/* Export data row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-50 last:border-b-0 gap-3">
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-gray-900">Export Data</span>
                <span className="text-xs text-gray-400 font-medium mt-0.5">
                  Download all your event data and participant information
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className="bg-blue-600 hover:bg-blue-755 hover:bg-blue-700 text-white text-xs font-bold rounded-full px-5 py-2.5 shadow-sm active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                Export All Data
              </button>
            </div>

            {/* Delete Account row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-50 last:border-b-0 gap-3">
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-gray-900">Delete Account</span>
                <span className="text-xs text-gray-400 font-medium mt-0.5">
                  Permanently delete your account and all associated data
                </span>
              </div>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-755 hover:bg-red-700 text-white text-xs font-bold rounded-full px-5 py-2.5 shadow-sm active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {isSignUpModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 max-w-md w-full shadow-2xl relative flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsSignUpModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight">
              Would you like to create an account?
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Creating an account lets you save your preferences and access them across devices.
            </p>

            {/* Actions Row */}
            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={async () => {
                  setIsSignUpModalOpen(false);
                  await handleDeclineSignUp();
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-full text-xs font-bold transition-all flex-1 cursor-pointer"
              >
                Not Now
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsSignUpModalOpen(false);
                  await handleConfirmSignUp();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-xs font-bold transition-all flex-1 shadow-sm cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-505 font-semibold text-gray-500">Loading settings...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
};

const SettingsPageContent = () => {
  return (
    <NextProtectedRoute>
      {(user) => <SettingsContent user={user} />}
    </NextProtectedRoute>
  );
};

export default SettingsPage;
