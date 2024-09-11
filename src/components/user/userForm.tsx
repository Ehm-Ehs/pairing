import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { editPairingValue } from "../api/endpoints";

// Function to decrypt userId (Base64 decoding example)
const decryptData = (data: string): string => {
  return atob(data); // Base64 decode
};

const ParticipantForm = () => {
  const location = useLocation();
  const [formData, setFormData] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [keyIndex, setKeyIndex] = useState<number | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const groupingPurpose = queryParams.get("groupingPurpose");
    const pairings = queryParams.get("pairings");
    const encryptedUserId = queryParams.get("userId");

    if (encryptedUserId) {
      const decryptedUserId = decryptData(encryptedUserId);
      setUserId(decryptedUserId);
    }

    try {
      if (pairings) {
        const parsedPairings = JSON.parse(decodeURIComponent(pairings));
        // Ensure that parsedPairings is an object
        if (typeof parsedPairings === "object" && parsedPairings !== null) {
          const groupKeys = Object.keys(parsedPairings);

          if (groupKeys.length > 0 && groupingPurpose) {
            // Pick a random groupKey from available keys
            const randomGroupKey =
              groupKeys[Math.floor(Math.random() * groupKeys.length)];
            setGroupKey(randomGroupKey);

            // Find a suitable keyIndex
            const group = parsedPairings[randomGroupKey];
            const track = initialValues.track;
            const index = group.findIndex(
              (entry: any) => entry.role === track && !entry.name
            );

            if (index !== -1) {
              setKeyIndex(index);
            }
          }

          setFormData({
            groupingPurpose,
            numGroups: queryParams.get("numGroups"),
            numParticipants: queryParams.get("numParticipants"),
            pairings: parsedPairings,
          });
        }
      }
    } catch (error) {
      console.error("Failed to parse pairings:", error);
    }
  }, [location.search]);

  const initialValues = {
    firstName: "",
    lastName: "",
    track: "",
    email: "",
  };

  const validationSchema = Yup.object({
    firstName: Yup.string().required("First name is required"),
    lastName: Yup.string().required("Last name is required"),
    track: Yup.string().required("Track is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

  const handleSubmit = async (values: typeof initialValues) => {
    if (formData && userId) {
      const { pairings, groupingPurpose } = formData;
      const track = values.track;

      if (pairings && groupKey !== null && keyIndex !== null) {
        // Select the group key based on groupingPurpose if available
        const selectedGroupKey = groupKey || Object.keys(pairings)[0]; // Default to the first group key if groupKey is not set

        const group = pairings[selectedGroupKey];
        const index = group.findIndex(
          (entry: any) => entry.role === track && !entry.name
        );
        const id = index !== -1 ? group[index].id : null;
        if (index !== -1) {
          const newValue = {
            name: `${values.firstName} ${values.lastName}`,
            track: values.track,
            email: values.email,
          };

          console.log({ selectedGroupKey }, { group }, { index }, { id });
          await editPairingValue(
            userId,
            groupingPurpose,
            selectedGroupKey,
            index,
            id,
            newValue
          );
        } else {
          console.error("No matching entry found for the track:", track);
        }
      } else {
        console.error(
          "Pairings data is missing or groupKey/keyIndex is not set."
        );
      }
    } else {
      console.error("Form data or user ID is missing.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-6 rounded-lg">
      <h1 className="text-2xl mb-4">Participant Form</h1>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange, handleBlur }) => (
          <Form className="flex flex-col gap-4">
            <div>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                className="p-2 w-[350px] bg-transparent border rounded"
                value={values.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <ErrorMessage
                name="firstName"
                component="div"
                className="text-red-500"
              />
            </div>
            <div>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Enter your last name"
                className="p-2 w-[350px] bg-transparent border rounded"
                value={values.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <ErrorMessage
                name="lastName"
                component="div"
                className="text-red-500"
              />
            </div>
            <div>
              <input
                type="text"
                id="track"
                name="track"
                placeholder="Enter your track"
                className="p-2 w-[350px] bg-transparent border rounded"
                value={values.track}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <ErrorMessage
                name="track"
                component="div"
                className="text-red-500"
              />
            </div>
            <div>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                className="p-2 w-[350px] bg-transparent border rounded"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-red-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-700 text-white p-2 rounded hover:bg-blue-800"
            >
              Submit
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ParticipantForm;
