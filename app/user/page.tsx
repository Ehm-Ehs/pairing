"use client";
import { Formik, Form, ErrorMessage } from "formik";
import Logo from "../../src/assets/logo";
import * as Yup from "yup";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { editPairingValue } from "../../src/services/endpoints";
import { toast } from "react-toastify";
import { Button } from "../../src/components/ui/button";
import { FaUsers } from "react-icons/fa";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../src/services/firebase";
import { capitalizeWords } from "../../src/utils/stringUtils";

// Function to decrypt userId (Base64 decoding example)
const decryptData = (data: string): string => {
  return atob(data); // Base64 decode
};

interface PairingEntry {
  id: string;
  role: string;
  name?: string;
  email?: string;
}

interface FormData {
  groupingPurpose: string | null;
  numGroups: string | null;
  numParticipants: string | null;
  pairings: Record<string, PairingEntry[]>;
  characteristicsLabel?: string;
}

const initialValues = {
  fullName: "",
  track: "",
  email: "",
};



const ParticipantFormContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isEventFull, setIsEventFull] = useState(false);
  const [closedMessage, setClosedMessage] = useState("");
  const [fullMessage, setFullMessage] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    const groupingPurpose = searchParams.get("groupingPurpose");
    const pairings = searchParams.get("pairings");
    const encryptedUserId = searchParams.get("userId");

    if (encryptedUserId) {
      try {
        const decryptedUserId = decryptData(encryptedUserId);
        setUserId(decryptedUserId);
      } catch (error) {
        console.error("Failed to decrypt user ID:", error);
        toast.error("Invalid link. Please ask the organizer for a new link.");
      }
    } else {
      toast.error("Missing user ID in the link.");
    }

    try {
      if (pairings) {
        const parsedPairings = JSON.parse(decodeURIComponent(pairings));
        if (typeof parsedPairings === "object" && parsedPairings !== null) {
          let label = searchParams.get("characteristicsLabel") || "";

          const hasRoles = Object.values(parsedPairings).some((group: any) =>
            group.some(
              (member: any) => member.role && member.role.trim() !== ""
            )
          );

          if (!hasRoles) {
            label = "";
          } else if (!label) {
            label = "Role";
          }

          setFormData({
            groupingPurpose,
            numGroups: searchParams.get("numGroups"),
            numParticipants: searchParams.get("numParticipants"),
            pairings: parsedPairings,
            characteristicsLabel: label,
          });
        }
      } else {
        toast.error("Missing pairing data in the link.");
      }
    } catch (error) {
      console.error("Failed to parse pairings:", error);
      toast.error(
        "Invalid pairing data. Please ask the organizer for a new link."
      );
    }

    const checkEventStatus = async () => {
      if (encryptedUserId && groupingPurpose) {
        try {
          const decryptedUserId = decryptData(encryptedUserId);
          const userRef = doc(db, "Users", decryptedUserId);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setClosedMessage(userData.settings?.defaults?.closedEventMessage || "");
            setFullMessage(userData.settings?.defaults?.fullEventMessage || "");
            const userPairings = userData.pairings || [];
            const pairing = userPairings.find(
              (p: any) => p.groupingPurpose === groupingPurpose
            );
            if (pairing) {
              if (pairing.status === "locked") {
                setIsClosed(true);
                setIsEventFull(false);
              } else {
                // Check if all slots are filled
                if (pairing.groups) {
                  let totalSlots = 0;
                  let filledSlots = 0;
                  Object.values(pairing.groups).forEach((group: any) => {
                    group.forEach((member: any) => {
                      totalSlots += 1;
                      if (member.name && member.name.trim() !== "") {
                        filledSlots += 1;
                      }
                    });
                  });
                  if (totalSlots > 0 && filledSlots >= totalSlots) {
                    setIsClosed(true);
                    setIsEventFull(true);
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error("Error checking event status:", err);
        }
      }
      setCheckingStatus(false);
    };

    checkEventStatus();
  }, [searchParams]);

  const validationSchema = Yup.object({
    fullName: Yup.string()
      .required("Full name is required")
      .test("is-fullname", "Please enter both first and last name", (value) => {
        return value ? value.trim().split(/\s+/).length >= 2 : false;
      }),
    track: Yup.string().when([], {
      is: () => !!formData?.characteristicsLabel,
      then: (schema) => schema.required("Please select a role"),
      otherwise: (schema) => schema.optional(),
    }),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

  const handleSubmit = async (values: typeof initialValues) => {
    if (!formData || !userId) {
      toast.error("Missing form data or user ID. Cannot submit.");
      return;
    }

    setLoading(true);
    const { pairings, groupingPurpose } = formData;
    const track = values.track;

    try {
      // Find a group that has an empty slot for the requested track
      let selectedGroupKey: string | null = null;
      let index = -1;
      let id: string | null = null;

      const groupKeys = Object.keys(pairings);
      // Shuffle keys to distribute randomly if multiple slots exist
      groupKeys.sort(() => Math.random() - 0.5);

      for (const key of groupKeys) {
        const group = pairings[key];
        const foundIndex = group.findIndex((entry: PairingEntry) => {
          if (track) {
            return (
              entry.role.trim().toLowerCase() === track.trim().toLowerCase() &&
              !entry.name
            );
          } else {
            return !entry.name; // Just looking for an empty slot
          }
        });

        if (foundIndex !== -1) {
          selectedGroupKey = key;
          index = foundIndex;
          id = group[foundIndex].id;
          break; // Found a slot, stop searching
        }
      }

      if (selectedGroupKey && index !== -1 && id && groupingPurpose) {
        const nameParts = values.fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const newValue = {
          name: `${firstName} ${lastName}`.trim(),
          track: values.track,
          email: values.email,
        };

        const result = await editPairingValue(
          userId,
          groupingPurpose,
          selectedGroupKey,
          index,
          id,
          newValue
        );

        if (result && result.isFull) {
          const allEmails = result.participants
            .map((p: any) => p.email)
            .filter((email: any) => email && typeof email === "string");

          if (allEmails.length > 0) {
            import("../../src/services/email").then(({ sendEmail }) => {
              import("../../src/services/emailTemplates").then(
                ({ getGroupCompleteEmail }) => {
                  const shareLink = window.location.origin;
                  const emailContent = getGroupCompleteEmail(
                    shareLink,
                    selectedGroupKey,
                    result.participants
                  );

                  sendEmail({
                    to: allEmails,
                    subject: emailContent.subject,
                    html: emailContent.html,
                  });
                }
              );
            });
          }
        }

        toast.success("Successfully registered!");
        setTimeout(() => {
          const params = new URLSearchParams({
            groupName: selectedGroupKey || "",
            role: values.track || "",
            eventName: groupingPurpose || "",
            email: values.email || "",
          }).toString();
          router.push(`/user/success?${params}`);
        }, 2000);
      } else {
        console.error("No matching entry found for the track:", track);
        toast.error(
          track
            ? `No available slot found for the role: ${track}. Please check with the organizer.`
            : "No available slot found. Event may be full."
        );
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(error.message || "An error occurred while submitting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleStats = (pairings: Record<string, PairingEntry[]>) => {
    const stats: Record<string, { roleName: string; totalSlots: number; filledSlots: number; slotsPerGroup: number }> = {};
    const groupKeys = Object.keys(pairings);
    const numGroups = groupKeys.length;

    Object.values(pairings).forEach((group) => {
      group.forEach((member) => {
        const roleName = member.role || "Participant";
        if (!stats[roleName]) {
          stats[roleName] = {
            roleName,
            totalSlots: 0,
            filledSlots: 0,
            slotsPerGroup: 0,
          };
        }
        stats[roleName].totalSlots += 1;
        if (member.name && member.name.trim() !== "") {
          stats[roleName].filledSlots += 1;
        }
      });
    });

    Object.keys(stats).forEach((roleName) => {
      stats[roleName].slotsPerGroup = numGroups > 0 ? Math.round(stats[roleName].totalSlots / numGroups) : 0;
    });

    return Object.values(stats);
  };

  if (checkingStatus) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 text-black">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1449b2]"></div>
        <p className="text-gray-500 text-sm font-semibold mt-4">Checking event status...</p>
      </div>
    );
  }

  if (isClosed && !showReveal) {
    const isFull = isEventFull;
    const title = capitalizeWords(formData?.groupingPurpose || "Event");

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-start items-center px-4 py-12 text-left font-medium text-gray-700">
        <Logo className="h-9 w-auto mb-10" />

        <div className={`bg-white rounded-[2rem] border-t-4 ${isFull ? "border-t-amber-500" : "border-t-red-500"} border-x border-b border-gray-200/60 shadow-sm w-full max-w-xl flex flex-col overflow-hidden`}>
          <div className="bg-[#F5F6F8] p-6 md:p-8 flex flex-col items-center border-b border-gray-200/60 w-full relative">
            <div className={`w-12 h-12 ${isFull ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-650"} rounded-xl flex items-center justify-center shadow-md mb-4 flex-shrink-0`}>
              <span className="text-xl font-bold">{isFull ? "!" : "×"}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight text-center capitalize">
              {title}
            </h2>
            <span className={`text-xs font-semibold px-4 py-1.5 rounded-full mt-1.5 ${isFull ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-750"}`}>
              {isFull ? "Event Full" : "Closed"}
            </span>
          </div>

          <div className="p-8 md:p-10 flex flex-col items-center text-center gap-6 w-full">
            <p className="text-sm text-gray-500 leading-relaxed max-w-md">
              {isFull 
                ? (fullMessage || "Sorry, this event is full. All available slots have been taken.")
                : (closedMessage || "Sorry, this event is closed. No further registrations are allowed.")
              }
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
              <button
                onClick={() => setShowReveal(true)}
                className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] hover:opacity-95 text-white font-bold px-8 py-3.5 rounded-full text-xs transition-all shadow-md cursor-pointer text-center"
              >
                Already registered? Reveal assignment
              </button>

              <button
                onClick={() => router.push("/")}
                className="bg-[#e5e7eb] hover:bg-gray-300 text-gray-700 font-bold px-8 py-3.5 rounded-full text-xs transition-all cursor-pointer text-center"
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showReveal) {
    const title = capitalizeWords(formData?.groupingPurpose || "Event");
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-start items-center px-4 py-12 text-left font-medium text-gray-700">
        <Logo className="h-9 w-auto mb-10" />

        <div className="bg-white rounded-[2rem] border-t-4 border-t-[#012A7D] border-x border-b border-gray-200/60 shadow-sm w-full max-w-xl flex flex-col overflow-hidden">
          <div className="bg-[#F5F6F8] p-6 md:p-8 flex flex-col items-center border-b border-gray-200/60 w-full relative">
            <div className="w-12 h-12 bg-[#2563EB] text-white rounded-xl flex items-center justify-center shadow-md mb-4 flex-shrink-0">
              <FaUsers className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight text-center capitalize">
              {title}
            </h2>
            <span className="bg-[#E0EBFF] text-[#012A7D] text-xs font-semibold px-4 py-1.5 rounded-full mt-1.5">
              Retrieve Assignment
            </span>
          </div>

          <Formik
            initialValues={{ email: "" }}
            validationSchema={Yup.object({
              email: Yup.string()
                .email("Invalid email")
                .required("Email is required"),
            })}
            onSubmit={(values, { setSubmitting, setStatus }) => {
              if (!formData) {
                toast.error("Form data not loaded");
                setSubmitting(false);
                return;
              }

              let assignedGroupKey: string | null = null;
              let assignedRole: string | null = null;

              Object.entries(formData.pairings).forEach(([groupKey, group]) => {
                const member = group.find(
                  (m) => m.email?.toLowerCase() === values.email.toLowerCase()
                );
                if (member) {
                  assignedGroupKey = groupKey;
                  assignedRole = member.role;
                }
              });

              if (assignedGroupKey !== null) {
                setStatus({
                  revealed: true,
                  groupIndex: parseInt(assignedGroupKey) + 1,
                  roleName: assignedRole || "Participant",
                });
              } else {
                toast.error("Email not found in participant list");
              }
              setSubmitting(false);
            }}
          >
            {({ isSubmitting, status, values, handleChange, handleBlur }) => (
              <Form className="flex flex-col w-full">
                <div className="p-6 md:p-8 flex flex-col gap-6 w-full">
                  {!status?.revealed ? (
                    <>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        Enter your email to retrieve your assigned group details!
                      </p>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">
                          Email Address
                        </label>
                        <input
                          name="email"
                          type="email"
                          value={values.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="px-4 py-3 w-full bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium"
                          placeholder="Your registered email"
                        />
                        <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1 font-semibold" />
                      </div>
                    </>
                  ) : (
                    <div className="bg-[#E0EBFF] border border-blue-100 rounded-3xl p-6 text-center animate-in fade-in zoom-in duration-300 w-full flex flex-col items-center">
                      <p className="text-xs text-blue-800 font-bold uppercase tracking-wider mb-2">
                        Your Assignment
                      </p>
                      <h3 className="text-2xl font-extrabold text-[#012A7D] font-heading tracking-tight mb-2">
                        Group {status.groupIndex}
                      </h3>
                      <p className="text-xs font-semibold text-gray-505">
                        Role: <span className="text-gray-800 font-bold">{status.roleName}</span>
                      </p>
                    </div>
                  )}
                </div>

                {!status?.revealed ? (
                  <div className="bg-[#F5F6F8] p-6 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-gray-200 w-full rounded-b-[2rem]">
                    <button
                      type="button"
                      onClick={() => setShowReveal(false)}
                      className="bg-[#e5e7eb] hover:bg-gray-300 text-gray-700 font-bold px-8 py-3.5 rounded-full text-xs transition-all cursor-pointer w-full h-auto text-center"
                    >
                      Back
                    </button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                      className="bg-gradient-to-b from-[#2563EB] to-[#012A7D] hover:opacity-95 text-white font-bold px-8 py-3.5 rounded-full text-xs shadow-md transition-all cursor-pointer w-full h-auto"
                    >
                      Retrieve Assignment
                    </Button>
                  </div>
                ) : (
                  <div className="bg-[#F5F6F8] p-6 flex items-center justify-center border-t border-gray-200 w-full rounded-b-[2rem]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReveal(false);
                      }}
                      className="bg-[#e5e7eb] hover:bg-gray-300 text-gray-700 font-bold px-8 py-3.5 rounded-full text-xs transition-all cursor-pointer w-full h-auto text-center"
                    >
                      Done
                    </button>
                  </div>
                )}
              </Form>
            )}
          </Formik>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-start items-center px-4 py-12 min-h-screen bg-gray-50 text-left">
      <Logo className="h-9 w-auto mb-10" />

      <div className="bg-white rounded-[2rem] border-t-4 border-t-[#012A7D] border-x border-b border-gray-200/60 shadow-sm w-full max-w-xl flex flex-col overflow-hidden">
        <div className="bg-[#F5F6F8] p-6 md:p-8 flex flex-col items-center border-b border-gray-200 w-full relative">
          <div className="w-12 h-12 bg-[#2563EB] text-white rounded-xl flex items-center justify-center shadow-md mb-4 flex-shrink-0">
            <FaUsers className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight text-center capitalize">
            {capitalizeWords(formData?.groupingPurpose || "Participant Registration")}
          </h2>
          <span className="bg-[#E0EBFF] text-[#012A7D] text-xs font-semibold px-4 py-1.5 rounded-full mt-1.5">
            {formData?.characteristicsLabel ? "Group Event • With Roles" : "Group Event • No Roles"}
          </span>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, handleBlur, setFieldValue }) => (
            <Form className="flex flex-col w-full">
              <div className="p-6 md:p-8 flex flex-col gap-6 w-full">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Details</h3>
                  <div className="bg-[#E8EFFF] border-l-4 border-l-[#012A7D] text-[#012A7D] text-xs rounded-r-xl rounded-l-none p-4 leading-relaxed">
                    <p className="font-bold mb-1">How it works:</p>
                    Just enter your details and submit. You'll be automatically assigned to a group. Simple as that!
                  </div>
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="e.g John Sam"
                    className="px-4 py-3 w-full bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium"
                    value={values.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <ErrorMessage name="fullName" component="div" className="text-red-500 text-xs mt-1 font-semibold" />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="e.g John@example.com"
                    className="px-4 py-3 w-full bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1 font-semibold" />
                  <p className="text-gray-450 text-[11px] mt-1.5 pl-1">
                    We'll send your group assignment here
                  </p>
                </div>

                {formData?.characteristicsLabel && (
                  <div className="flex flex-col gap-3">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Choose Your Role <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col gap-3">
                      {getRoleStats(formData.pairings).map((stat) => {
                        const slotsLeft = stat.totalSlots - stat.filledSlots;
                        const isFull = slotsLeft <= 0;
                        const isSelected = values.track === stat.roleName;

                        return (
                          <label
                            key={stat.roleName}
                            className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                              isFull
                                ? "bg-gray-50/50 border-gray-200 opacity-60 cursor-not-allowed"
                                : isSelected
                                ? "border-blue-500 bg-blue-50/5"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                            style={{
                              borderLeftWidth: "4px",
                              borderLeftColor: isFull ? "#D1D5DB" : isSelected ? "#2563EB" : "#1E40AF"
                            }}
                          >
                            <input
                              type="radio"
                              name="track"
                              value={stat.roleName}
                              checked={isSelected}
                              disabled={isFull}
                              onChange={() => setFieldValue("track", stat.roleName)}
                              className="sr-only"
                            />
                            
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-bold text-gray-900 text-base capitalize">
                                {capitalizeWords(stat.roleName)}
                              </span>
                              <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                                {stat.slotsPerGroup} per group
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {isFull ? (
                                <span className="bg-red-50 text-red-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                  Full
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-gray-500">
                                  {slotsLeft} slot left
                                </span>
                              )}
                              
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                isFull
                                  ? "border-gray-250 bg-gray-50"
                                  : isSelected
                                  ? "border-[#2563EB]"
                                  : "border-gray-300 bg-white"
                              }`}>
                                {isSelected && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <ErrorMessage name="track" component="div" className="text-red-500 text-xs mt-1 font-semibold" />
                  </div>
                )}
              </div>

              <div className="bg-[#F5F6F8] p-6 flex items-center justify-center gap-4 border-t border-gray-200 w-full rounded-b-[2rem]">
                <button type="button" onClick={() => router.push("/")} className="bg-[#E5E7EB] hover:bg-[#D1D5DB] text-gray-700 font-bold px-8 py-3.5 rounded-full text-xs transition-all shadow-sm flex-1 cursor-pointer">
                  Cancel
                </button>
                <Button type="submit" disabled={loading} isLoading={loading} className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] hover:opacity-95 text-white font-bold px-8 py-3.5 rounded-full text-xs transition-all shadow-md flex-1 cursor-pointer">
                  {loading ? "Joining..." : "Join event >"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

const ParticipantFormPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500 text-sm font-semibold">Loading form...</div>}>
      <ParticipantFormContent />
    </Suspense>
  );
};

export default ParticipantFormPage;
