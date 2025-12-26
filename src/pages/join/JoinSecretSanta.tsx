import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage, Field } from "formik";
import * as Yup from "yup";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { Pairing, SecretSantaPairing } from "../../types";
import { addParticipantToSecretSanta } from "../../services/endpoints";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { Loading } from "../../components/ui/loading";
import { FaGift, FaUsers } from "react-icons/fa";

interface JoinFormValues {
  name: string;
  email: string;
  wishlist: string;
}

const JoinSecretSanta: React.FC = () => {
  const { userId, eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<SecretSantaPairing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!userId || !eventId) return;
      try {
        const userDoc = await getDoc(doc(db, "Users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const foundEvent = userData.pairings.find(
            (p: Pairing) => p.id === eventId && p.type === "secret-santa"
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
  }, [userId, eventId]);

  const handleSubmit = async (values: JoinFormValues) => {
    if (!userId || !event) return;

    setSubmitting(true);
    try {
      const newParticipant = {
        id: uuidv4(),
        name: values.name,
        email: values.email,
        wishlist: values.wishlist,
        // No assignedToId yet
      };

      await addParticipantToSecretSanta(userId, event.id, newParticipant);
      // Pass event name and details to success page
      navigate(`/event/success`, {
        state: {
          eventName: event.title,
          isSecretSanta: event.config.allowWishlist,
          // role/groupName not applicable yet, but we can pass eventName
        },
      });
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-gray-500">
            The link may be invalid or the event has been deleted.
          </p>
        </div>
      </div>
    );
  }

  const isSecretSanta = event.config?.allowWishlist;

  if (event.status === "locked") {
    // Reveal View
    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${
          isSecretSanta
            ? "from-red-50 to-green-50"
            : "from-blue-50 to-indigo-50"
        } flex items-center justify-center p-4`}
      >
        <div
          className={`bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 ${
            isSecretSanta ? "border-red-500" : "border-blue-500"
          }`}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {isSecretSanta
                ? "Secret Santa Matches Detail"
                : "Your Pairing Match"}
            </h1>
            <p className="text-gray-500 mt-2">
              Enter your email to reveal your match!
            </p>
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
                (p) => p.email === values.email
              );
              if (!participant) {
                toast.error("Email not found in participant list");
                setSubmitting(false);
                return;
              }

              // Find pairing
              const pair = event.pairs?.find(
                (p) => p.santaId === participant.id
              );
              if (!pair) {
                toast.error("No match found yet");
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
              <Form className="flex flex-col gap-4">
                {!status?.revealed ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        name="email"
                        type="email"
                        className="w-full p-2 border rounded"
                        placeholder="Your registered email"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`${
                        isSecretSanta ? "bg-red-600" : "bg-blue-600"
                      } text-white py-2 rounded`}
                    >
                      Reveal Match
                    </button>
                  </>
                ) : (
                  <div
                    className={`${
                      isSecretSanta ? "bg-green-50" : "bg-blue-50"
                    } p-6 rounded-lg text-center animate-in fade-in zoom-in duration-300`}
                  >
                    <p className="text-lg text-gray-600 mb-2">
                      {isSecretSanta
                        ? "You are the Secret Santa for:"
                        : "You are paired with:"}
                    </p>
                    <h2
                      className={`text-3xl font-bold ${
                        isSecretSanta ? "text-green-600" : "text-blue-600"
                      } mb-4`}
                    >
                      {status.receiver.name}
                    </h2>
                    {status.receiver.wishlist && isSecretSanta && (
                      <div className="bg-white p-4 rounded border border-green-200">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                          Their Wishlist
                        </p>
                        <p className="text-gray-800 italic">
                          "{status.receiver.wishlist}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Form>
            )}
          </Formik>
        </div>
      </div>
    );
  }

  // Join View
  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${
        isSecretSanta ? "from-red-50 to-green-50" : "from-blue-50 to-indigo-50"
      } flex items-center justify-center p-4`}
    >
      <div
        className={`bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 ${
          isSecretSanta ? "border-red-500" : "border-blue-500"
        }`}
      >
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 ${
              isSecretSanta ? "bg-red-100" : "bg-blue-100"
            } rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            {isSecretSanta ? (
              <FaGift className="w-8 h-8 text-red-500" />
            ) : (
              <FaUsers className="w-8 h-8 text-blue-500" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <p className="text-gray-500 mt-1">
            {isSecretSanta
              ? "Join the Secret Santa exchange!"
              : "Join the pairing event!"}
          </p>
        </div>

        <Formik
          initialValues={{ name: "", email: "", wishlist: "" }}
          validationSchema={Yup.object({
            name: Yup.string().required("Name is required"),
            email: Yup.string()
              .email("Invalid email")
              .required("Email is required"),
            wishlist: event.config.allowWishlist
              ? Yup.string()
              : Yup.string().notRequired(),
          })}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <Field
                    name="name"
                    type="text"
                    className={`w-full p-2 border bg-white rounded-md focus:ring-2 ${
                      isSecretSanta
                        ? "focus:ring-red-500"
                        : "focus:ring-blue-500"
                    } focus:outline-none ${
                      errors.name && touched.name
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter your name"
                  />
                </div>
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Field
                  name="email"
                  type="email"
                  className={`w-full p-2 border bg-white rounded-md focus:ring-2 ${
                    isSecretSanta ? "focus:ring-red-500" : "focus:ring-blue-500"
                  } focus:outline-none ${
                    errors.email && touched.email
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Where should we send your match?"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              {event.config.allowWishlist && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wishlist / Notes (Optional)
                  </label>
                  <Field
                    as="textarea"
                    name="wishlist"
                    rows={3}
                    className="w-full p-2 border bg-white border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="Sizes, favorites, allergies, etc."
                  />
                  <ErrorMessage
                    name="wishlist"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`mt-4 w-full py-3 px-4 ${
                  isSecretSanta
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                } text-white font-medium rounded-md shadow focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  submitting ? "opacity-75 cursor-wait" : ""
                }`}
              >
                {submitting ? "Joining..." : "Join Event"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default JoinSecretSanta;
