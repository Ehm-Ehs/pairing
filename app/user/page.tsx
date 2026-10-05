"use client";
import { ASSIGNMENT_NOT_READY } from "@/utils/messages";
import { errorMessage } from "@/utils/errors";
import { JoinFormFooter, JoinTextField } from "@/components/join/JoinFormParts";
import { JoinCard } from "@/components/join/JoinCard";
import { decodeOrganizerId } from "@/utils/eventLinks";
import { EventUnavailable } from "@/components/join/EventUnavailable";
import { RevealByEmail } from "@/components/join/RevealByEmail";
import { logger } from "@/utils/logger";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchPublicEvent, joinEvent, lookupAssignment } from "@/services/endpoints";
import { rememberPrivateLink } from "@/components/events/PrivateLinkCard";
import { toast } from "react-toastify";
import { FaUsers } from "react-icons/fa";
import { capitalizeWords, formatGroupName } from "@/utils/stringUtils";

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
  const eventId = searchParams.get("eventId") || undefined;
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
        const decryptedUserId = decodeOrganizerId(encryptedUserId);
        setUserId(decryptedUserId);
      } catch (error) {
        logger.error("Failed to decrypt user ID:", error);
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

          const hasRoles = Object.values(parsedPairings as Record<string, PairingEntry[]>).some((group) =>
            group.some((member) => member.role && member.role.trim() !== "")
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
      logger.error("Failed to parse pairings:", error);
      toast.error(
        "Invalid pairing data. Please ask the organizer for a new link."
      );
    }

    const checkEventStatus = async () => {
      if (encryptedUserId && groupingPurpose) {
        try {
          const decryptedUserId = decodeOrganizerId(encryptedUserId);
          const { event: pairing, messages } = await fetchPublicEvent({
            ownerId: decryptedUserId,
            eventId: searchParams.get("eventId") || undefined,
            purpose: groupingPurpose,
          });
          setClosedMessage(messages.closed);
          setFullMessage(messages.full);

          const groups =
            pairing.type === "role-based" ? (pairing.groups as Record<string, PairingEntry[]> | undefined) : undefined;
          // The link carries a snapshot of the slots; replace it with the live state.
          if (groups) setFormData((prev) => (prev ? { ...prev, pairings: groups } : prev));

          const slots = Object.values(groups || {}).flat();
          if (pairing.status === "locked") {
            setIsClosed(true);
            setIsEventFull(false);
          } else if (slots.length > 0 && slots.every((slot) => slot.name && slot.name.trim() !== "")) {
            setIsClosed(true);
            setIsEventFull(true);
          }
        } catch (err) {
          logger.error("Error checking event status:", err);
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
    const { groupingPurpose } = formData;

    try {
      if (!groupingPurpose) throw new Error("Invalid link. Please ask the organizer for a new link.");
      const name = values.fullName.trim().split(/\s+/).join(" ");

      // The server picks a free slot for the chosen role, so two people can never take the same one.
      const result = await joinEvent({
        ownerId: userId,
        eventId,
        groupingPurpose,
        participant: { name, email: values.email, track: values.track },
      });
      rememberPrivateLink(result.revealUrl);

      toast.success("Successfully registered!");
      setTimeout(() => {
        const params = new URLSearchParams({
          groupName: result.groupKey || "",
          role: values.track || "",
          eventName: groupingPurpose,
          email: values.email || "",
        }).toString();
        router.push(`/user/success?${params}`);
      }, 2000);
    } catch (error) {
      logger.error("Error submitting form:", error);
      toast.error(errorMessage(error) || "An error occurred while submitting. Please try again.");
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

  const title = capitalizeWords(formData?.groupingPurpose || "Event");

  if (showReveal) {
    return (
      <RevealByEmail
        accent="blue"
        icon={<FaUsers className="w-6 h-6" />}
        title={title}
        badge="Retrieve Assignment"
        prompt="Enter your email to retrieve your assigned group details!"
        submitLabel="Retrieve Assignment"
        notFoundMessage={ASSIGNMENT_NOT_READY}
        onClose={() => setShowReveal(false)}
        lookup={async (email) => {
          if (!formData?.groupingPurpose || !userId) return null;
          const res = await lookupAssignment({
            ownerId: userId,
            eventId,
            groupingPurpose: formData.groupingPurpose,
            email,
          });
          if (res.assignment?.kind !== "group") return null;
          return (
            <div className="bg-[#E0EBFF] border border-blue-100 rounded-3xl p-6 text-center w-full flex flex-col items-center">
              <p className="text-xs text-blue-800 font-bold uppercase tracking-wider mb-2">Your Assignment</p>
              <h3 className="text-2xl font-extrabold text-[#012A7D] font-heading tracking-tight mb-2">
                {formatGroupName(res.assignment.groupKey)}
              </h3>
              <p className="text-xs font-semibold text-gray-500">
                Role: <span className="text-gray-800 font-bold">{res.assignment.role || "Participant"}</span>
              </p>
            </div>
          );
        }}
      />
    );
  }

  if (isClosed) {
    return (
      <EventUnavailable
        reason={isEventFull ? "full" : "closed"}
        title={title}
        message={isEventFull ? fullMessage : closedMessage}
        onReveal={() => setShowReveal(true)}
      />
    );
  }

  return (
    <JoinCard
      accent="blue"
      icon={<FaUsers className="w-6 h-6" />}
      title={capitalizeWords(formData?.groupingPurpose || "Participant Registration")}
      badge={formData?.characteristicsLabel ? "Group Event • With Roles" : "Group Event • No Roles"}
    >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="flex flex-col w-full">
              <div className="p-6 md:p-8 flex flex-col gap-6 w-full">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Details</h3>
                  <div className="bg-[#E8EFFF] border-l-4 border-l-[#012A7D] text-[#012A7D] text-xs rounded-r-xl rounded-l-none p-4 leading-relaxed">
                    <p className="font-bold mb-1">How it works:</p>
                    Just enter your details and submit. You'll be automatically assigned to a group. Simple as that!
                  </div>
                </div>

                <JoinTextField name="fullName" label="Full Name" accent="blue" placeholder="e.g John Sam" />
                <JoinTextField
                  name="email"
                  label="Email Address"
                  type="email"
                  accent="blue"
                  placeholder="e.g John@example.com"
                  hint="We'll send your group assignment here"
                />

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

              <JoinFormFooter accent="blue" submitting={loading} label="Join event >" />
            </Form>
          )}
        </Formik>
    </JoinCard>
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
