"use client";
import { ASSIGNMENT_NOT_READY } from "@/utils/messages";
import { errorMessage } from "@/utils/errors";
import { JoinFormFooter, JoinTextField, WhatsAppPhoneField } from "@/components/join/JoinFormParts";
import { logger } from "@/utils/logger";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { SecretSantaPairing } from "@/types";
import { joinEvent, lookupAssignment } from "@/services/endpoints";
import { usePublicEvent } from "@/hooks/usePublicEvent";
import { EventNotFound, JoinCard } from "@/components/join/JoinCard";
import { EventUnavailable } from "@/components/join/EventUnavailable";
import { RevealByEmail } from "@/components/join/RevealByEmail";
import { rememberPrivateLink } from "@/components/events/PrivateLinkCard";
import { toast } from "react-toastify";
import { Loading } from "@/components/ui/loading";
import { FaGift } from "react-icons/fa";

interface JoinFormValues {
  fullName: string;
  email: string;
  phone: string;
  wishlist: string;
  pairIndex: number;
  positionLetter: string;
}



const JoinSecretSanta: React.FC = () => {
  const router = useRouter();
  const { event, messages, loading, ownerId: validUserId } = usePublicEvent<SecretSantaPairing>("secret-santa");
  const [showReveal, setShowReveal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

      // The server validates the slot, rejects duplicates and sends the confirmation message.
      const result = await joinEvent({
        ownerId: validUserId,
        eventId: event.id,
        participant: {
          name: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone?.trim() || "",
          wishlist: isSecretSanta ? values.wishlist.trim() : "",
          ...(isSecretSanta ? {} : { pairIndex: values.pairIndex, positionLetter: values.positionLetter }),
        },
      });
      rememberPrivateLink(result.revealUrl);

      const queryParams = new URLSearchParams({
        eventName: event.title,
        isSecretSanta: event.config?.allowWishlist ? "true" : "false",
        email: values.email.trim(),
        pairIndex: !event.config?.allowWishlist ? String(values.pairIndex) : "",
        positionLetter: !event.config?.allowWishlist ? values.positionLetter : "",
      }).toString();

      router.push(`/event/success?${queryParams}`);
    } catch (error) {
      logger.error("Error joining:", error);
      toast.error(errorMessage(error) || "Failed to join event");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading event details..." />;

  if (!event) return <EventNotFound />;

  const isSecretSanta = event.config?.allowWishlist;
  const expectedCount = Number(event.config.expectedParticipants || 12);
  const totalPairs = Math.ceil(expectedCount / 2);
  const isClosed = event.status === "locked";
  const isFull = expectedCount > 0 && event.participants.length >= expectedCount;

  if (showReveal) {
    return (
      <RevealByEmail
        accent="emerald"
        icon={<FaGift className="w-6 h-6" />}
        title={event.title}
        badge={isSecretSanta ? "Secret Santa • Revealed" : "Just Pair • Revealed"}
        prompt={
          isSecretSanta
            ? "Enter your email and we will send your private link to your registered contact."
            : "Enter your email to reveal your pair assignment!"
        }
        submitLabel={isSecretSanta ? "Send My Link" : "Reveal Match"}
        notFoundMessage={ASSIGNMENT_NOT_READY}
        onClose={() => setShowReveal(false)}
        lookup={async (email) => {
          const res = await lookupAssignment({ ownerId: validUserId, eventId: event.id, email });
          if (res.sent) {
            // Secret Santa matches are never shown here: the private link goes to the registered contact.
            return (
              <div className="bg-[#E6F4EA] border border-emerald-100 rounded-3xl p-6 text-center w-full">
                <p className="text-sm text-emerald-800 font-bold mb-2">Check your inbox</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {res.message || "We sent your private link to your registered contact. Open it to see your match."}
                </p>
              </div>
            );
          }
          if (res.assignment?.kind !== "pair") return null;
          const { pairIndex, positionLetter, partner } = res.assignment;
          return (
            <div className="bg-[#E6F4EA] border border-emerald-100 rounded-3xl p-6 text-center w-full">
              <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-2">Your Selection</p>
              <p className="text-base font-bold text-gray-900 mb-1 font-heading">
                Pair {(pairIndex ?? -1) + 1} (Slot {positionLetter})
              </p>
              <div className="mt-4 pt-4 border-t border-emerald-100 flex flex-col items-center">
                <p className="text-xs text-emerald-700 font-semibold mb-2">Status:</p>
                {partner ? (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-1.5 rounded-full border border-emerald-200 capitalize">
                    Paired with {partner.name}
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-4 py-1.5 rounded-full border border-amber-200">
                    Awaiting pair
                  </span>
                )}
              </div>
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
      accent="emerald"
      icon={<FaGift className="w-6 h-6" />}
      title={event.title}
      badge={isSecretSanta ? "Secret Santa" : "Just Pair"}
    >
        <Formik
          initialValues={{
            fullName: "",
            email: "",
            phone: "",
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
          {({ values, setFieldValue, handleChange, handleBlur }) => (
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

                <JoinTextField name="fullName" label="Full Name" accent="emerald" placeholder="e.g John Sam" />
                <JoinTextField
                  name="email"
                  label="Email Address"
                  type="email"
                  accent="emerald"
                  placeholder="e.g John@example.com"
                  hint="We'll send your partner assignment here"
                />

                <WhatsAppPhoneField />

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

              <JoinFormFooter accent="emerald" submitting={submitting} label="Join event >" />
            </Form>
          )}
        </Formik>
    </JoinCard>
  );
};

export default JoinSecretSanta;
