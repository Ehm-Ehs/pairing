"use client";
import React, { useEffect, useState } from "react";
import Logo from "../../../src/assets/logo";
import { useParams, useRouter } from "next/navigation";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../src/services/firebase";
import { Pairing, SecretSantaPairing } from "../../../src/types";
import { addParticipantToSecretSanta } from "../../../src/services/endpoints";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { Loading } from "../../../src/components/ui/loading";
import { FaGift } from "react-icons/fa";
import { Button } from "../../../src/components/ui/button";

interface JoinFormValues {
  fullName: string;
  email: string;
  wishlist: string;
  pairIndex: number;
  positionLetter: string;
}



const JoinSecretSanta: React.FC = () => {
  const { userId, eventId } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<SecretSantaPairing | null>(null);

  const validUserId = Array.isArray(userId) ? userId[0] : userId;
  const validEventId = Array.isArray(eventId) ? eventId[0] : eventId;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!validUserId || !validEventId) return;
      try {
        const userDoc = await getDoc(doc(db, "Users", validUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const foundEvent = userData.pairings.find(
            (p: Pairing) => p.id === validEventId && p.type === "secret-santa"
          );
          if (foundEvent) {
            setEvent(foundEvent as SecretSantaPairing);
          } else {
            toast.error("Event not found");
          }
        } else {
          toast.error("Organizer not found");
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

    // Check if slot is taken in the meantime (only for slot grids)
    if (!isSecretSanta) {
      const isTaken = event.participants.some(
        (p) => p.pairIndex === values.pairIndex && p.positionLetter === values.positionLetter
      );
      if (isTaken) {
        toast.error("This position was just taken. Please choose another slot.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const limit = Number(event.config.expectedParticipants || 0);
      if (limit > 0 && event.participants.length >= limit) {
        toast.error("This event is full!");
        setSubmitting(false);
        return;
      }

      const newParticipant = {
        id: uuidv4(),
        name: values.fullName.trim(),
        email: values.email.trim(),
        wishlist: isSecretSanta ? values.wishlist.trim() : "",
        pairIndex: isSecretSanta ? -1 : values.pairIndex,
        positionLetter: isSecretSanta ? "" : values.positionLetter,
      };

      await addParticipantToSecretSanta(validUserId, event.id, newParticipant);

      const queryParams = new URLSearchParams({
        eventName: event.title,
        isSecretSanta: event.config?.allowWishlist ? "true" : "false",
      }).toString();

      router.push(`/event/success?${queryParams}`);
    } catch (error) {
      console.error("Error joining:", error);
      toast.error("Failed to join event");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading event details..." />;

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Event Not Found</h1>
          <p className="text-gray-505 text-sm text-gray-500">
            The link may be invalid or the event has been deleted.
          </p>
        </div>
      </div>
    );
  }

  const isSecretSanta = event.config?.allowWishlist;
  const expectedCount = Number(event.config.expectedParticipants || 12);
  const totalPairs = Math.ceil(expectedCount / 2);

  if (event.status === "locked") {
    // REVEAL MODE
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-start items-center px-4 py-12 text-left">
        <Logo className="h-9 w-auto mb-10" />

        <div className="bg-white rounded-[2rem] border-t-4 border-t-[#10B981] border-x border-b border-gray-200/60 shadow-sm w-full max-w-xl flex flex-col overflow-hidden">
          <div className="bg-[#F5F6F8] p-6 md:p-8 flex flex-col items-center border-b border-gray-200/60 w-full relative">
            <div className="w-12 h-12 bg-[#10B981] text-white rounded-xl flex items-center justify-center shadow-md mb-4 flex-shrink-0">
              <FaGift className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight text-center">
              {event.title}
            </h2>
            <span className="bg-[#D1FAE5] text-[#065F46] text-xs font-semibold px-4 py-1.5 rounded-full mt-1.5">
              {isSecretSanta ? "Secret Santa • Revealed" : "Single Pairing • Revealed"}
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
              if (!participant) {
                toast.error("Email not found in participant list");
                setSubmitting(false);
                return;
              }

              // Find receiver in Secret Santa pairings
              const pair = event.pairs?.find(
                (p) => p.santaId === participant.id
              );
              if (!pair) {
                // If it is just a simple pair, find the partner in the same pairIndex
                const partner = event.participants.find(
                  (p) => p.pairIndex === participant.pairIndex && p.id !== participant.id
                );
                if (partner) {
                  setStatus({ revealed: true, receiver: partner });
                } else {
                  toast.error("Your pairing match is not available.");
                }
                setSubmitting(false);
                return;
              }

              const receiver = event.participants.find(
                (p) => p.id === pair.receiverId
              );
              if (receiver) {
                setStatus({ revealed: true, receiver });
              }
              setSubmitting(false);
            }}
          >
            {({ isSubmitting, status }) => (
              <Form className="flex flex-col w-full">
                <div className="p-6 md:p-8 flex flex-col gap-6 w-full">
                  {!status?.revealed ? (
                    <>
                      <p className="text-gray-550 text-sm leading-relaxed">
                        Enter your email to reveal your pair assignment!
                      </p>
                      <div>
                        <label className="block text-sm font-semibold text-gray-655 mb-1">
                          Email Address
                        </label>
                        <input
                          name="email"
                          type="email"
                          className="px-4 py-3 w-full bg-white border border-gray-205 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium"
                          placeholder="Your registered email"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="bg-[#E6F4EA] border border-emerald-100 rounded-3xl p-6 text-center animate-in fade-in zoom-in duration-300 w-full">
                      <p className="text-sm text-emerald-800 font-bold mb-2">
                        {isSecretSanta
                          ? "You are the Secret Santa for:"
                          : "You are paired with:"}
                      </p>
                      <h2 className="text-3xl font-extrabold text-[#065F46] mb-4 font-heading tracking-tight">
                        {status.receiver.name}
                      </h2>
                      {status.receiver.wishlist && isSecretSanta && (
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                          <p className="text-[10px] font-bold text-gray-450 uppercase tracking-wider mb-1">
                            Their Wishlist
                          </p>
                          <p className="text-gray-700 italic text-sm">
                            "{status.receiver.wishlist}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!status?.revealed && (
                  <div className="bg-[#F5F6F8] p-6 flex items-center justify-center border-t border-gray-200 w-full rounded-b-[2rem]">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                      className="bg-gradient-to-b from-[#10B981] to-[#059669] hover:opacity-95 text-white font-bold px-8 py-3.5 rounded-full text-xs font-bold shadow-md transition-all cursor-pointer w-full h-auto"
                    >
                      Reveal Match
                    </Button>
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-start items-center px-4 py-12 text-left">
      <Logo className="h-9 w-auto mb-10" />

      <div className="bg-white rounded-[2rem] border-t-4 border-t-[#10B981] border-x border-b border-gray-200/60 shadow-sm w-full max-w-xl flex flex-col overflow-hidden">
        <div className="bg-[#F5F6F8] p-6 md:p-8 flex flex-col items-center border-b border-gray-200/60 w-full relative">
          <div className="w-12 h-12 bg-[#10B981] text-white rounded-xl flex items-center justify-center shadow-md mb-4 flex-shrink-0">
            <FaGift className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight text-center">
            {event.title}
          </h2>
          <span className="bg-[#D1FAE5] text-[#065F46] text-xs font-semibold px-4 py-1.5 rounded-full mt-1.5">
            {isSecretSanta ? "Secret Santa" : "Single Pairing"}
          </span>
        </div>

        <Formik
          initialValues={{
            fullName: "",
            email: "",
            wishlist: "",
            pairIndex: -1,
            positionLetter: "",
          }}
          validationSchema={Yup.object({
            fullName: Yup.string().required("Name is required"),
            email: Yup.string()
              .email("Invalid email")
              .required("Email is required"),
            wishlist: isSecretSanta
              ? Yup.string()
              : Yup.string().notRequired(),
            pairIndex: isSecretSanta
              ? Yup.number().notRequired()
              : Yup.number()
                  .min(0, "Please choose an available slot in the grid below")
                  .required("Please choose a slot"),
            positionLetter: isSecretSanta
              ? Yup.string().notRequired()
              : Yup.string().required("Please choose a slot"),
          })}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, handleChange, handleBlur }) => (
            <Form className="flex flex-col w-full">
              <div className="p-6 md:p-8 flex flex-col gap-6 w-full">
                {/* Details & Info Block */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Your Details
                  </h3>
                  <div className="bg-[#E6F4EA] border-l-4 border-l-[#10B981] text-[#065F46] text-xs rounded-r-xl rounded-l-none p-4 leading-relaxed">
                    <p className="font-bold mb-1">How it works:</p>
                    {isSecretSanta
                      ? "Enter your details and optional wishlist. Pairings will be generated once everyone has registered and we'll notify you anonymously! Simple as that!"
                      : "Choose any available pair and pick Person A or Person B. Once both positions are filled, you'll be matched with your partner! Simple as that!"}
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
                    className={`px-4 py-3 w-full bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium ${
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
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    className={`px-4 py-3 w-full bg-white border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium ${
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
                    We'll send your partner assignment here
                  </p>
                </div>

                {/* Add Wishlist (Optional) - ONLY for Secret Santa */}
                {isSecretSanta && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                      Add Wishlist (Optional)
                    </label>
                    <textarea
                      name="wishlist"
                      rows={4}
                      className="px-4 py-3 w-full bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium"
                      placeholder="Your Santa will see this when they're matched with you. Keep it realistic and fun!"
                      value={values.wishlist}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <ErrorMessage
                      name="wishlist"
                      component="div"
                      className="text-red-500 text-xs mt-1 font-semibold"
                    />
                  </div>
                )}

                {/* Choose Your Pair & Position Selector Grid - ONLY for non-wishlist Single Pairing */}
                {!isSecretSanta && (
                  <div className="flex flex-col gap-3">
                    <label className="block text-sm font-semibold text-gray-655">
                      Choose Your Pair & Position <span className="text-red-500">*</span>
                      <span className="block text-[11px] font-normal text-gray-400 mt-0.5">
                        Select an available slot and choose to be Person A or Person B.
                      </span>
                    </label>

                    <div className="grid grid-cols-1 gap-4 max-h-[380px] overflow-y-auto pr-1">
                      {Array.from({ length: totalPairs }).map((_, i) => {
                        const pA = event.participants.find((p) => p.pairIndex === i && p.positionLetter === "A");
                        const pB = event.participants.find((p) => p.pairIndex === i && p.positionLetter === "B");

                        const isSelectedA = values.pairIndex === i && values.positionLetter === "A";
                        const isSelectedB = values.pairIndex === i && values.positionLetter === "B";

                        let slotCountText = "Both open";
                        if (pA && pB) slotCountText = "Full";
                        else if (pA || pB) slotCountText = "1 slot left";

                        const isBothTaken = !!pA && !!pB;

                        return (
                          <div
                            key={i}
                            className="bg-gray-50/50 rounded-xl border border-gray-150/45 p-4 flex flex-col gap-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-805 text-gray-800">Pair {i + 1}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isBothTaken
                                  ? "bg-red-50 text-red-500 border border-red-100"
                                  : "bg-blue-50 text-blue-600 border border-blue-100"
                              }`}>
                                {slotCountText}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {/* Person A Slot */}
                              <button
                                type="button"
                                disabled={!!pA}
                                onClick={() => {
                                  setFieldValue("pairIndex", i);
                                  setFieldValue("positionLetter", "A");
                                }}
                                className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-center focus:outline-none ${
                                  pA
                                    ? "bg-gray-100 border-transparent text-gray-400 opacity-60 cursor-not-allowed"
                                    : isSelectedA
                                    ? "border-emerald-500 bg-emerald-50/10 shadow-sm ring-1 ring-emerald-500"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                                  pA ? "bg-gray-200 text-gray-400" :
                                  isSelectedA ? "bg-emerald-500 text-white animate-pulse" :
                                  "bg-emerald-50/60 text-emerald-600"
                                }`}>
                                  {pA ? pA.name.charAt(0).toUpperCase() : "A"}
                                </div>
                                <div className="min-w-0 w-full text-center">
                                  <p className={`text-[11px] font-bold truncate leading-tight ${pA ? "text-gray-505 text-gray-500" : "text-gray-800"}`}>
                                    {pA ? pA.name : "Person A"}
                                  </p>
                                  <p className="text-[9px] text-gray-400 font-medium">
                                    {pA ? "Taken" : "Available"}
                                  </p>
                                </div>
                              </button>

                              {/* Person B Slot */}
                              <button
                                type="button"
                                disabled={!!pB}
                                onClick={() => {
                                  setFieldValue("pairIndex", i);
                                  setFieldValue("positionLetter", "B");
                                }}
                                className={`border rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-center focus:outline-none ${
                                  pB
                                    ? "bg-gray-100 border-transparent text-gray-400 opacity-60 cursor-not-allowed"
                                    : isSelectedB
                                    ? "border-emerald-500 bg-emerald-50/10 shadow-sm ring-1 ring-emerald-500"
                                    : "border-gray-200 bg-white hover:border-gray-300"
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                                  pB ? "bg-gray-200 text-gray-400" :
                                  isSelectedB ? "bg-emerald-500 text-white animate-pulse" :
                                  "bg-fuchsia-50/60 text-fuchsia-600"
                                }`}>
                                  {pB ? pB.name.charAt(0).toUpperCase() : "B"}
                                </div>
                                <div className="min-w-0 w-full text-center">
                                  <p className={`text-[11px] font-bold truncate leading-tight ${pB ? "text-gray-505 text-gray-500" : "text-gray-805"}`}>
                                    {pB ? pB.name : "Person B"}
                                  </p>
                                  <p className="text-[9px] text-gray-400 font-medium">
                                    {pB ? "Taken" : "Available"}
                                  </p>
                                </div>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <ErrorMessage
                      name="pairIndex"
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
                  className="bg-gradient-to-b from-[#10B981] to-[#059669] hover:opacity-95 text-white font-bold px-8 py-3.5 rounded-full text-xs transition-all shadow-md flex-1 cursor-pointer flex items-center justify-center gap-1.5 h-auto"
                >
                  {submitting ? "Joining..." : "Join event >"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default JoinSecretSanta;
