"use client";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { editPairingValue } from "../../src/services/endpoints";
import { toast } from "react-toastify";
import { Button } from "../../src/components/ui/button";

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

const ParticipantFormContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        // Ensure that parsedPairings is an object
        if (typeof parsedPairings === "object" && parsedPairings !== null) {
          let label = searchParams.get("characteristicsLabel") || "";

          // Fallback: If no label is provided, but pairings have roles, default to "Role"
          if (!label) {
            const hasRoles = Object.values(parsedPairings).some((group: any) =>
              group.some(
                (member: any) => member.role && member.role.trim() !== ""
              )
            );
            if (hasRoles) {
              label = "Role";
            }
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
  }, [searchParams]);

  const validationSchema = Yup.object({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    track: Yup.string().when([], {
      is: () => !!formData?.characteristicsLabel,
      then: (schema) => schema.required("Track is required"),
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

      // Iterate through all groups to find an available slot
      const groupKeys = Object.keys(pairings);
      // Shuffle keys to distribute randomly if multiple slots exist (optional, but good for fairness)
      groupKeys.sort(() => Math.random() - 0.5);

      for (const key of groupKeys) {
        const group = pairings[key];
        const foundIndex = group.findIndex((entry: PairingEntry) => {
          // If track is provided (Role based), match role.
          // If track is NOT provided (Random), match any empty slot (no name) that has no specific role requirement OR empty role.
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
        const newValue = {
          name: `${values.firstName} ${values.lastName}`,
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
                  const shareLink = window.location.origin; // Or deep link if available
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
        // Redirect after a short delay
        setTimeout(() => {
          const params = new URLSearchParams({
            groupName: selectedGroupKey || "",
            role: values.track || "",
            eventName: groupingPurpose || "",
          }).toString();
          router.push(`/user/success?${params}`);
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
          {formData?.groupingPurpose || "Participant Registration"}
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
              {formData?.characteristicsLabel && (
                <div>
                  <label
                    htmlFor="track"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {formData.characteristicsLabel.charAt(0).toUpperCase() +
                      formData.characteristicsLabel.slice(1)}
                  </label>
                  <input
                    type="text"
                    id="track"
                    name="track"
                    placeholder={`e.g. ${
                      formData.characteristicsLabel === "Role"
                        ? "Designer, Developer"
                        : formData.characteristicsLabel
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
              )}
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
              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

const ParticipantFormPage = () => {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <ParticipantFormContent />
    </Suspense>
  );
};

export default ParticipantFormPage;
