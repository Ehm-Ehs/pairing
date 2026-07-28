"use client";
import React, { useEffect, useState } from "react";
import Logo from "../../../src/assets/logo";
import { useParams, useRouter } from "next/navigation";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../src/services/firebase";
import { Pairing, RandomPositioningPairing } from "../../../src/types";
import { addParticipantToRandomPositioning } from "../../../src/services/endpoints";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { Loading } from "../../../src/components/ui/loading";
import { FaRandom, FaCalendarAlt, FaInfoCircle } from "react-icons/fa";
import { Button } from "../../../src/components/ui/button";

interface JoinFormValues {
  fullName: string;
  email: string;
  assignedNumber: number;
}



const JoinRandomPositioning: React.FC = () => {
  const { userId, eventId } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<RandomPositioningPairing | null>(null);
  const [closedMessage, setClosedMessage] = useState("");
  const [fullMessage, setFullMessage] = useState("");
  const [showReveal, setShowReveal] = useState(false);

  const validUserId = Array.isArray(userId) ? userId[0] : userId;
  const validEventId = Array.isArray(eventId) ? eventId[0] : eventId;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!validUserId || !validEventId) return;
      try {
        const userDoc = await getDoc(doc(db, "Users", validUserId));
        const userData = userDoc.exists() ? userDoc.data() : {};
        setClosedMessage(userData.settings?.defaults?.closedEventMessage || "");
        setFullMessage(userData.settings?.defaults?.fullEventMessage || "");

        // 1. Try Pairings collection
        const pairingDoc = await getDoc(doc(db, "Pairings", validEventId));
        if (pairingDoc.exists()) {
          setEvent(pairingDoc.data() as RandomPositioningPairing);
        } else if (userDoc.exists()) {
          // 2. Legacy fallback
          const foundEvent = userData.pairings?.find(
            (p: Pairing) =>
              p.id === validEventId && p.type === "random-positioning"
          );
          if (foundEvent) {
            setEvent(foundEvent as RandomPositioningPairing);
          } else {
            toast.error("Event not found");
          }
        } else {
          toast.error("Event not found");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        toast.error("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [validUserId, validEventId]);

  const handleSubmit = async (values: JoinFormValues) => {
    if (!validUserId || !event) return;

    setSubmitting(true);
    try {
      const mode = (event as any).assignmentMode || "participants-pick";
      const totalPositions = event.expectedParticipants || 25;
      const takenNumbers = event.participants.map((p) => p.assignedNumber).filter(Boolean) as number[];

      let finalAssignedNumber = values.assignedNumber;

      if (mode === "participants-pick") {
        if (takenNumbers.includes(values.assignedNumber)) {
          toast.error("This position is already taken! Please select another one.");
          setSubmitting(false);
          return;
        }
      } else if (mode === "fcfs") {
        let nextNumber = 1;
        while (takenNumbers.includes(nextNumber)) {
          nextNumber++;
        }
        finalAssignedNumber = nextNumber;
      } else {
        // Mode is random
        const availableNumbers = [];
        for (let i = 1; i <= totalPositions; i++) {
          if (!takenNumbers.includes(i)) {
            availableNumbers.push(i);
          }
        }
        finalAssignedNumber =
          availableNumbers.length > 0
            ? availableNumbers[Math.floor(Math.random() * availableNumbers.length)]
            : takenNumbers.length + 1;
      }

      const newParticipant = {
        id: uuidv4(),
        name: values.fullName.trim(),
        email: values.email.trim(),
        assignedNumber: finalAssignedNumber,
        joinedAt: Date.now(),
      };

      await addParticipantToRandomPositioning(
        validUserId,
        event.id,
        newParticipant
      );

      const queryParams = new URLSearchParams({
        eventName: event.title,
        isRandomPositioning: "true",
        nextStepsDate: event.deadline || "",
        assignedNumber: finalAssignedNumber.toString(),
      }).toString();

      router.push(`/event/success?${queryParams}`);
    } catch (error: any) {
      console.error("Error joining:", error);
      toast.error(error.message || "Failed to join event");
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

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Event Not Found</h1>
          <p className="text-gray-550 text-sm text-gray-500">
            The link may be invalid or the event has been deleted.
          </p>
        </div>
      </div>
    );
  }

  const assignmentMode = (event as any).assignmentMode || "participants-pick";
  const totalPositions = event.expectedParticipants || 25;
  const takenNumbers = event.participants.map((p) => p.assignedNumber).filter(Boolean) as number[];

  const isClosed = event.status === "locked";
  const isFull = totalPositions > 0 && event.participants.length >= totalPositions;

  if (isClosed && !showReveal) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-start items-center px-4 py-12 text-left font-medium text-gray-700">
        <Logo className="h-9 w-auto mb-10" />

        <div className="bg-white rounded-[2rem] border-t-4 border-t-red-500 border-x border-b border-gray-200/60 shadow-sm w-full max-w-xl flex flex-col overflow-hidden">
          <div className="bg-[#F5F6F8] p-6 md:p-8 flex flex-col items-center border-b border-gray-200/60 w-full relative">
            <div className="w-12 h-12 bg-red-100 text-red-650 rounded-xl flex items-center justify-center shadow-md mb-4 flex-shrink-0">
              <span className="text-xl font-bold text-red-600">×</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight text-center capitalize">
              {event.title}
            </h2>
            <span className="bg-red-50 text-red-750 text-xs font-semibold px-4 py-1.5 rounded-full mt-1.5">
              Closed
            </span>
          </div>

          <div className="p-8 md:p-10 flex flex-col items-center text-center gap-6 w-full">
            <p className="text-sm text-gray-500 leading-relaxed max-w-md">
              {closedMessage || "Sorry, this event is closed. No further registrations are allowed."}
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

  if (isFull) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-start items-center px-4 py-12 text-left font-medium text-gray-700">
        <Logo className="h-9 w-auto mb-10" />

        <div className="bg-white rounded-[2rem] border-t-4 border-t-amber-500 border-x border-b border-gray-200/60 shadow-sm w-full max-w-xl flex flex-col overflow-hidden">
          <div className="bg-[#F5F6F8] p-6 md:p-8 flex flex-col items-center border-b border-gray-200/60 w-full relative">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shadow-md mb-4 flex-shrink-0">
              <span className="text-xl font-bold text-amber-600">!</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight text-center capitalize">
              {event.title}
            </h2>
            <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-4 py-1.5 rounded-full mt-1.5">
              Event Full
            </span>
          </div>

          <div className="p-8 md:p-10 flex flex-col items-center text-center gap-6 w-full">
            <p className="text-sm text-gray-500 leading-relaxed max-w-md">
              {fullMessage || "Sorry, this event is full. All available slots have been taken."}
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
    // REVEAL MODE
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-start items-center px-4 py-12 text-left">
        <Logo className="h-9 w-auto mb-10" />

        <div className="bg-white rounded-[2rem] border-t-4 border-t-[#8338EC] border-x border-b border-gray-200/60 shadow-sm w-full max-w-xl flex flex-col overflow-hidden">
          <div className="bg-[#F5F6F8] p-6 md:p-8 flex flex-col items-center border-b border-gray-200/60 w-full relative">
            <div className="w-12 h-12 bg-[#8338EC] text-white rounded-xl flex items-center justify-center shadow-md mb-4 flex-shrink-0">
              <FaRandom className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight text-center">
              {event.title}
            </h2>
            <span className="bg-[#F3E8FF] text-[#6B21A8] text-xs font-semibold px-4 py-1.5 rounded-full mt-1.5">
              Random Position • Revealed
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
              const participant = event.participants.find(
                (p) => p.email?.toLowerCase() === values.email.toLowerCase()
              );
              if (participant && participant.assignedNumber) {
                setStatus({ revealed: true, participant });
              } else {
                toast.error("Email not found or no position assigned yet.");
              }
              setSubmitting(false);
            }}
          >
            {({ status, isSubmitting, values, handleChange, handleBlur }) => (
              <Form className="flex flex-col w-full">
                <div className="p-6 md:p-8 flex flex-col gap-6 w-full">
                  {!status?.revealed ? (
                    <>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        Enter your email to find your position!
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
                          className="px-4 py-3 w-full bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium"
                          placeholder="Your registered email"
                        />
                        <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1 font-semibold" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center animate-in fade-in zoom-in duration-300 w-full flex flex-col items-center p-4">
                      <p className="text-sm font-bold text-gray-500">You are assigned position:</p>
                      <div className="w-24 h-24 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-5xl font-extrabold text-[#8338EC] font-heading my-4 shadow-md">
                        {status.participant.assignedNumber}
                      </div>
                      <p className="text-gray-400 text-xs font-medium">
                        Out of {event.participants.length} total participants
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
                      className="bg-gradient-to-b from-[#8338EC] to-[#6f2ec9] hover:opacity-95 text-white font-bold px-8 py-3.5 rounded-full text-xs shadow-md transition-all cursor-pointer w-full h-auto"
                    >
                      Check Position
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

  // JOIN VIEW
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-start items-center px-4 py-12 text-left">
      <div className="bg-white rounded-[2rem] border-t-4 border-t-[#8338EC] border-x border-b border-gray-200/60 shadow-sm w-full max-w-xl flex flex-col overflow-hidden">
        <div className="bg-[#F5F6F8] p-6 md:p-8 flex flex-col items-center border-b border-gray-200/60 w-full relative">
          <div className="w-12 h-12 bg-[#8338EC] text-white rounded-xl flex items-center justify-center shadow-md mb-4 flex-shrink-0">
            <FaRandom className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight text-center">
            {event.title}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5">
            <span className="bg-[#F3E8FF] text-[#6B21A8] text-xs font-semibold px-4 py-1.5 rounded-full">
              Random Position
            </span>
            {event.deadline && (
              <span className="bg-gray-200/60 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                <FaCalendarAlt className="w-2.5 h-2.5" />
                Until {getFriendlyDeadline(event.deadline)}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-gray-550 text-xs text-center max-w-md mt-3 leading-relaxed">
              {event.description}
            </p>
          )}
        </div>

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
          {({ errors, touched, handleChange, handleBlur, values, setFieldValue }) => (
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

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="fullName"
                    type="text"
                    className={`px-4 py-3 w-full bg-white border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium ${
                      errors.fullName && touched.fullName ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="e.g John Sam"
                    value={values.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <ErrorMessage
                    name="fullName"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-semibold"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-605 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    className={`px-4 py-3 w-full bg-white border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium ${
                      errors.email && touched.email ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="e.g John@example.com"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-semibold"
                  />
                  <p className="text-gray-400 text-[11px] mt-1.5 pl-1">
                    We'll send your position assignment here
                  </p>
                </div>

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

              {/* Action Buttons */}
              <div className="bg-[#F5F6F8] p-6 flex items-center justify-center gap-4 border-t border-gray-200 w-full rounded-b-[2rem]">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="bg-[#E5E7EB] hover:bg-[#D1D5DB] text-gray-700 font-bold px-8 py-3.5 rounded-full text-xs transition-all shadow-sm flex-1 cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={submitting}
                  isLoading={submitting}
                  className="bg-gradient-to-b from-[#8338EC] to-[#6f2ec9] hover:opacity-95 text-white font-bold px-8 py-3.5 rounded-full text-xs transition-all shadow-md flex-1 cursor-pointer flex items-center justify-center gap-1.5 h-auto"
                >
                  {submitting ? "Joining..." : "Claim my position >"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default JoinRandomPositioning;
