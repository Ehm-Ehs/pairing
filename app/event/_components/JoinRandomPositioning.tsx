"use client";
import { ASSIGNMENT_NOT_READY } from "@/utils/messages";
import { errorMessage } from "@/utils/errors";
import { JoinFormFooter, JoinTextField, WhatsAppPhoneField } from "@/components/join/JoinFormParts";
import { logger } from "@/utils/logger";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { RandomPositioningPairing } from "@/types";
import { joinEvent, lookupAssignment } from "@/services/endpoints";
import { usePublicEvent } from "@/hooks/usePublicEvent";
import { EventNotFound, JoinCard } from "@/components/join/JoinCard";
import { EventUnavailable } from "@/components/join/EventUnavailable";
import { RevealByEmail } from "@/components/join/RevealByEmail";
import { rememberPrivateLink } from "@/components/events/PrivateLinkCard";
import { toast } from "react-toastify";
import { Loading } from "@/components/ui/loading";
import { FaRandom, FaCalendarAlt, FaInfoCircle } from "react-icons/fa";

interface JoinFormValues {
  fullName: string;
  email: string;
  phone?: string;
  assignedNumber: number;
}



const JoinRandomPositioning: React.FC = () => {
  const router = useRouter();
  const { event, messages, loading, ownerId: validUserId } =
    usePublicEvent<RandomPositioningPairing>("random-positioning");
  const [showReveal, setShowReveal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: JoinFormValues) => {
    if (!validUserId || !event) return;

    setSubmitting(true);
    try {
      const mode = event.assignmentMode || "participants-pick";

      // The server assigns the position (or validates the chosen one) so two people can never take the same spot.
      const result = await joinEvent({
        ownerId: validUserId,
        eventId: event.id,
        participant: {
          name: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone?.trim() || "",
          ...(mode === "participants-pick" ? { assignedNumber: values.assignedNumber } : {}),
        },
      });
      rememberPrivateLink(result.revealUrl);
      const finalAssignedNumber = result.participant.assignedNumber ?? values.assignedNumber;

      const queryParams = new URLSearchParams({
        eventName: event.title,
        isRandomPositioning: "true",
        nextStepsDate: event.deadline || "",
        assignedNumber: finalAssignedNumber.toString(),
      }).toString();

      router.push(`/event/success?${queryParams}`);
    } catch (error) {
      logger.error("Error joining:", error);
      toast.error(errorMessage(error) || "Failed to join event");
    } finally {
      setSubmitting(false);
    }
  };

  const getFriendlyDeadline = (isoString?: string) => {
    if (!isoString) return "No deadline set";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  if (loading) return <Loading message="Loading event details..." />;

  if (!event) return <EventNotFound />;

  const assignmentMode = event.assignmentMode || "participants-pick";
  const totalPositions = event.expectedParticipants || 25;
  const takenNumbers = event.participants.map((p) => p.assignedNumber).filter(Boolean) as number[];

  const isClosed = event.status === "locked";
  const isFull = totalPositions > 0 && event.participants.length >= totalPositions;

  if (showReveal) {
    return (
      <RevealByEmail
        accent="purple"
        icon={<FaRandom className="w-5 h-5" />}
        title={event.title}
        badge="Random Position • Revealed"
        prompt="Enter your email to find your position!"
        submitLabel="Check Position"
        notFoundMessage={ASSIGNMENT_NOT_READY}
        onClose={() => setShowReveal(false)}
        lookup={async (email) => {
          const res = await lookupAssignment({ ownerId: validUserId, eventId: event.id, email });
          if (res.assignment?.kind !== "position" || !res.assignment.assignedNumber) return null;
          return (
            <div className="text-center w-full flex flex-col items-center p-4">
              <p className="text-sm font-bold text-gray-500">You are assigned position:</p>
              <div className="w-24 h-24 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-5xl font-extrabold text-[#8338EC] font-heading my-4 shadow-md">
                {res.assignment.assignedNumber}
              </div>
              <p className="text-gray-400 text-xs font-medium">
                Out of {event.participants.length} total participants
              </p>
            </div>
          );
        }}
      />
    );
  }

  if (isClosed || isFull) {
    return (
      <EventUnavailable
        reason={isClosed ? "closed" : "full"}
        title={event.title}
        message={isClosed ? messages.closed : messages.full}
        onReveal={() => setShowReveal(true)}
      />
    );
  }

  return (
    <JoinCard
      accent="purple"
      icon={<FaRandom className="w-5 h-5" />}
      title={event.title}
      badge="Random Position"
      badgeExtra={
        event.deadline && (
          <span className="bg-gray-200/60 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
            <FaCalendarAlt className="w-2.5 h-2.5" />
            Until {getFriendlyDeadline(event.deadline)}
          </span>
        )
      }
      headerExtra={
        event.description && (
          <p className="text-gray-500 text-xs text-center max-w-md mt-3 leading-relaxed">{event.description}</p>
        )
      }
    >
        <Formik
          initialValues={{ fullName: "", email: "", assignedNumber: -1 }}
          validationSchema={Yup.object({
            fullName: Yup.string().required("Full name is required"),
            email: Yup.string()
              .email("Invalid email address")
              .required("Email is required"),
            assignedNumber:
              assignmentMode === "participants-pick"
                ? Yup.number()
                    .min(1, "Please choose a position number from the grid below")
                    .required("Please choose a position number")
                : Yup.number().notRequired(),
          })}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="flex flex-col w-full">
              <div className="p-6 md:p-8 flex flex-col gap-6 w-full">
                {/* Assignment Mode Blue Banner */}
                <div className="bg-[#EBF3FF] border-l-4 border-l-[#3A76F0] text-[#012A7D] text-xs rounded-r-xl rounded-l-none p-4 flex items-start gap-2.5 leading-relaxed">
                  <FaInfoCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">
                    {assignmentMode === "participants-pick" && (
                      <>
                        <span className="font-bold">Choose your spot:</span> Greyed out positions are already taken. Pick any available one and it's yours instantly.
                      </>
                    )}
                    {assignmentMode === "fcfs" && (
                      <>
                        <span className="font-bold">First come, first served:</span> Submit your details and you'll be assigned the next available position in sequence. No selection needed!
                      </>
                    )}
                    {assignmentMode === "random" && (
                      <>
                        <span className="font-bold">Random Assignment:</span> The system will randomly assign you to an available position when you submit. It's fair for everyone!
                      </>
                    )}
                  </span>
                </div>

                {/* Details & Info Block */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-805 mb-3">
                    Your Details
                  </h3>
                  <div className="bg-[#F3E8FF] border-l-4 border-l-[#8338EC] text-[#6B21A8] text-xs rounded-r-xl rounded-l-none p-4 leading-relaxed">
                    <p className="font-bold mb-1">How it works:</p>
                    Pick any available position number. Your selection is final once submitted, so choose carefully!
                  </div>
                </div>

                <JoinTextField name="fullName" label="Full Name" accent="purple" placeholder="e.g John Sam" />
                <JoinTextField
                  name="email"
                  label="Email Address"
                  type="email"
                  accent="purple"
                  placeholder="e.g John@example.com"
                  hint="We'll send your position assignment here"
                />

                <WhatsAppPhoneField />

                {/* Choose Your Position Grid Selector - ONLY for Participants Pick mode */}
                {assignmentMode === "participants-pick" && (
                  <div className="flex flex-col gap-3">
                    <label className="block text-sm font-semibold text-[#4B5563]">
                      Choose Your Position <span className="text-red-500">*</span>
                      <span className="block text-[11px] font-normal text-gray-400 mt-0.5">
                        Select any available position. Greyed out positions are already taken.
                      </span>
                    </label>

                    <div className="grid grid-cols-5 gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {Array.from({ length: totalPositions }).map((_, idx) => {
                        const positionNumber = idx + 1;
                        const isTaken = takenNumbers.includes(positionNumber);
                        const isSelected = values.assignedNumber === positionNumber;

                        return (
                          <button
                            key={positionNumber}
                            type="button"
                            disabled={isTaken}
                            onClick={() => setFieldValue("assignedNumber", positionNumber)}
                            className={`rounded-xl p-3 border flex flex-col items-center justify-center gap-1.5 transition-all text-center focus:outline-none h-20 ${
                              isTaken
                                ? "bg-gray-100 border-transparent text-gray-400 opacity-60 cursor-not-allowed"
                                : isSelected
                                ? "border-purple-500 bg-purple-50/10 shadow-sm ring-1 ring-purple-500"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <span className={`text-base font-extrabold font-heading ${
                              isTaken ? "text-gray-400" : isSelected ? "text-purple-650 text-purple-600" : "text-gray-900"
                            }`}>
                              {positionNumber}
                            </span>
                            <span className={`text-[9px] font-bold ${
                              isTaken ? "text-gray-400" : isSelected ? "text-purple-650 text-purple-600 font-extrabold" : "text-gray-400"
                            }`}>
                              {isTaken ? "Taken" : "Open"}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <ErrorMessage
                      name="assignedNumber"
                      component="div"
                      className="text-red-500 text-xs mt-1 font-semibold"
                    />
                  </div>
                )}
              </div>

              <JoinFormFooter accent="purple" submitting={submitting} label="Claim my position >" />
            </Form>
          )}
        </Formik>
    </JoinCard>
  );
};

export default JoinRandomPositioning;
