import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { editPairingValue } from "../api/endpoints";
import { toast } from "react-toastify";

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
  firstName: "",
  lastName: "",
  track: "",
  email: "",
};

const ParticipantForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const groupingPurpose = queryParams.get("groupingPurpose");
    const pairings = queryParams.get("pairings");
    const encryptedUserId = queryParams.get("userId");

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
        // Ensure that parsedPairings is an object
        if (typeof parsedPairings === "object" && parsedPairings !== null) {
          setFormData({
            groupingPurpose,
            numGroups: queryParams.get("numGroups"),
            numParticipants: queryParams.get("numParticipants"),
            pairings: parsedPairings,
            characteristicsLabel: queryParams.get("characteristicsLabel") || "",
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
  }, [location.search]);

  const validationSchema = Yup.object({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    track: Yup.string().required("Track is required"),
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

      // Iterate through all groups to find an available slot
      const groupKeys = Object.keys(pairings);
      // Shuffle keys to distribute randomly if multiple slots exist (optional, but good for fairness)
      groupKeys.sort(() => Math.random() - 0.5);

      for (const key of groupKeys) {
        const group = pairings[key];
        const foundIndex = group.findIndex(
          (entry: PairingEntry) =>
            entry.role.toLowerCase() === track.toLowerCase() && !entry.name
        );

        if (foundIndex !== -1) {
          selectedGroupKey = key;
          index = foundIndex;
          id = group[foundIndex].id;
          break; // Found a slot, stop searching
        }
      }

      if (selectedGroupKey && index !== -1 && id && groupingPurpose) {
        const newValue = {
          name: `${values.firstName} ${values.lastName}`,
          track: values.track,
          email: values.email,
        };

        await editPairingValue(
          userId,
          groupingPurpose,
          selectedGroupKey,
          index,
          id,
          newValue
        );

        // 1. Notify the new participant
        if (values.email) {
          import("../api/email").then(({ sendEmail }) => {
            sendEmail({
              to: values.email,
              subject: `You're in Group ${selectedGroupKey?.replace(
                "Group ",
                ""
              )}! 🎉`,
              templateParams: {
                user_name: values.firstName,
                group_name: selectedGroupKey,
                track: values.track,
                site_url: window.location.origin,
              },
            });
          });
        }

        // 2. Notify existing group members
        const groupMembers = pairings[selectedGroupKey] || [];
        const existingMembersEmails = groupMembers
          .filter(
            (m: PairingEntry) => m.email && m.email !== values.email && m.name
          )
          .map((m: PairingEntry) => m.email!);

        if (existingMembersEmails.length > 0) {
          import("../api/email").then(({ sendEmail }) => {
            sendEmail({
              to: existingMembersEmails,
              subject: `New Member Joined ${selectedGroupKey}! 👋`,
              templateParams: {
                user_name: "Team", // Addressing the group
                new_member_name: `${values.firstName} ${values.lastName}`,
                group_name: selectedGroupKey,
                track: values.track,
                site_url: window.location.origin,
              },
            });
          });
        }

        toast.success("Successfully registered!");
        // Redirect after a short delay
        setTimeout(() => {
          navigate("/"); // Or wherever you want to send them
        }, 2000);
      } else {
        console.error("No matching entry found for the track:", track);
        toast.error(
          `No available slot found for the track: ${track}. Please check with the organizer.`
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred while submitting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-4 rounded-lg min-h-screen bg-gray-50">
      <div className="bg-white p-6 md:p-10 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Participant Registration
        </h1>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, handleBlur }) => (
            <Form className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="Enter your first name"
                  className="p-2 w-full bg-transparent border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={values.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  name="firstName"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Enter your last name"
                  className="p-2 w-full bg-transparent border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={values.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  name="lastName"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <label
                  htmlFor="track"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {formData?.characteristicsLabel
                    ? formData.characteristicsLabel.charAt(0).toUpperCase() +
                      formData.characteristicsLabel.slice(1)
                    : "Track / Role"}
                </label>
                <input
                  type="text"
                  id="track"
                  name="track"
                  placeholder={`e.g. ${
                    formData?.characteristicsLabel
                      ? formData.characteristicsLabel
                      : "Designer, Developer"
                  }`}
                  className="p-2 w-full bg-transparent border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={values.track}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  name="track"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  className="p-2 w-full bg-transparent border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`mt-4 p-2 rounded text-white font-medium transition-colors ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ParticipantForm;
