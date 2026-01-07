import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Formik, Form, ErrorMessage, Field } from "formik";
import * as Yup from "yup";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../src/services/firebase";
import { Pairing, RandomPositioningPairing } from "../../../src/types";
import { addParticipantToRandomPositioning } from "../../../src/services/endpoints";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { Loading } from "../../../src/components/ui/loading";
import { FaRandom } from "react-icons/fa";
import { Button } from "../../../src/components/ui/button";

interface JoinFormValues {
  name: string;
}

const JoinRandomPositioning: React.FC = () => {
  const { userId, eventId } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<RandomPositioningPairing | null>(null);

  // Validate params
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
            (p: Pairing) =>
              p.id === validEventId && p.type === "random-positioning"
          );
          if (foundEvent) {
            setEvent(foundEvent as RandomPositioningPairing);
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

    setSubmitting(true);
    try {
      const newParticipant = {
        id: uuidv4(),
        name: values.name,
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

  // If locked, we might want to show results here or redirect.
  // The request says: Participant View -> Show assignments.
  // For now, let's treat this as the "Join/View" page.
  // If already joined (cookie/localstorage?), show status?
  // User request: 3. Participant Join Flow... 6. Reveal & Visibility
  // For now, this is just the JOIN page. Result page is separate or same?
  // Let's stick to JOIN page. If locked, maybe we show results if we can identify user?
  // But we don't have auth for participants.
  // So "Reveal" usually requires them to re-enter info or use a unique link.
  // The JoinSecretSanta component handles reveal by email. Here we only have Name.
  // Name is not unique enough for secure reveal, but maybe good enough for this app?
  // Or we just show the full list if it's public.
  // "Organizer sees: Full ordered list. Participant sees: Their name, Their assigned position"
  // If I only have Name, I can ask "Enter your name to see your position".

  if (event.status === "locked") {
    // REVEAL MODE
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-purple-500">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Positions Revealed!
            </h1>
            <p className="text-gray-500 mt-2">
              Enter your name to find your position.
            </p>
          </div>
          <Formik
            initialValues={{ name: "" }}
            validationSchema={Yup.object({
              name: Yup.string().required("Name is required"),
            })}
            onSubmit={(values, { setSubmitting, setStatus }) => {
              const participant = event.participants.find(
                (p) => p.name.toLowerCase() === values.name.toLowerCase()
              );
              if (participant && participant.assignedNumber) {
                setStatus({ revealed: true, participant });
              } else {
                toast.error("Name not found or no position assigned.");
              }
              setSubmitting(false);
            }}
          >
            {({ status, isSubmitting }) => (
              <Form className="flex flex-col gap-4">
                {!status?.revealed ? (
                  <>
                    <input
                      name="name"
                      type="text"
                      placeholder="Your Name"
                      className="w-full p-2 border rounded"
                      onChange={() => {
                        // Simple way to bind to formik... actually Field is better
                      }}
                    />
                    <Field
                      name="name"
                      className="w-full p-2 border rounded"
                      placeholder="Your Name"
                    />
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Check Position
                    </Button>
                  </>
                ) : (
                  <div className="text-center animate-in fade-in zoom-in">
                    <p className="text-gray-500">You are position:</p>
                    <h2 className="text-6xl font-bold text-purple-600 my-4">
                      {status.participant.assignedNumber}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      Out of {event.participants.length} participants
                    </p>
                  </div>
                )}
              </Form>
            )}
          </Formik>

          {/* Optional: Show full list if not hidden? User: "Optional: full ordered list (organizer-controlled)" */}
          {/* For now, just individual reveal as per requirement "Each participant sees: Their name, Their assigned position" */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-purple-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaRandom className="w-8 h-8 text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <p className="text-purple-600 font-medium mt-1">
            Join Deadline: {new Date(event.deadline!).toLocaleString()}
          </p>
          {event.description && (
            <p className="text-gray-500 mt-2 text-sm">{event.description}</p>
          )}
        </div>

        <Formik
          initialValues={{ name: "" }}
          validationSchema={Yup.object({
            name: Yup.string().required("Name is required"),
          })}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <Field
                  name="name"
                  type="text"
                  className={`w-full p-2 border bg-white rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none ${
                    errors.name && touched.name
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter your name"
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                isLoading={submitting}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500"
              >
                {submitting ? "Joining..." : "Join Event"}
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default JoinRandomPositioning;
