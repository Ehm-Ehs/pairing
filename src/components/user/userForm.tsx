import { Formik, Form, ErrorMessage, Field } from "formik";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import { editPairingValue } from "../api/endpoints";

interface PairingItem {
  id: string;
  number?: number;
  name?: string;
}

const ParticipantForm = () => {
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

  const [groupingPurpose, setGroupingPurpose] = useState<string>("");
  const [numGroups, setNumGroups] = useState<number>(0);
  const [numParticipants, setNumParticipants] = useState<number>(0);
  const [pairings, setPairings] = useState<any[]>([]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);

    const purpose = queryParams.get("groupingPurpose");
    const groups = queryParams.get("numGroups");
    const participants = queryParams.get("numParticipants");
    const pairingData = queryParams.get("pairings");

    if (purpose) setGroupingPurpose(purpose);
    if (groups) setNumGroups(Number(groups));
    if (participants) setNumParticipants(Number(participants));
    if (pairingData) {
      try {
        const parsedPairings = JSON.parse(decodeURIComponent(pairingData));
        setPairings(parsedPairings);
      } catch (error) {
        console.error("Error parsing pairings data:", error);
      }
    }
  }, []);

  const combinedArray = Object.values(pairings).flat();
  const itemsWithoutName = combinedArray.filter(
    (item) => !item.hasOwnProperty("name")
  );

  const randomIndex = Math.floor(Math.random() * itemsWithoutName.length);
  const randomItem = itemsWithoutName[randomIndex];
  const selectedOldId = randomItem ? randomItem.id : null;

  const handleSubmit = async (values: typeof initialValues) => {
    if (selectedOldId === null) {
      return;
    }

    const keys = Object.keys(pairings);

    if (keys.length === 0) {
      return;
    }
    console.log({ pairings });
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const pairingsIndex = keys.indexOf(randomKey);
    const selectedPairing = pairings[pairingsIndex];
    console.log({ selectedPairing });
    if (!selectedPairing) {
      return;
    }
    const filteredPairing = selectedPairing.filter(
      (item: PairingItem) => !item.hasOwnProperty("name")
    );

    if (filteredPairing.length === 0) {
      return;
    }

    const pairingIndex = Math.floor(Math.random() * filteredPairing.length);
    console.log({ pairingIndex });
    const indexId = filteredPairing[pairingIndex].id;
    console.log({ indexId });
    const newValue = {
      id: indexId,
      name: `${values.firstName} ${values.lastName}`,
      track: values.track,
      email: values.email,
    };

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.uid;
      await editPairingValue(
        userId,
        groupingPurpose,
        pairingsIndex,
        pairingIndex,
        newValue
      );
    } catch (error) {
      console.error("Error updating pairing:", error);
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
        {() => (
          <Form className="flex flex-col gap-4">
            <div>
              <Field
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                className="p-2 w-[350px] bg-transparent border rounded"
              />
              <ErrorMessage
                name="firstName"
                component="div"
                className="text-red-500"
              />
            </div>
            <div>
              <Field
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Enter your last name"
                className="p-2 w-[350px] bg-transparent border rounded"
              />
              <ErrorMessage
                name="lastName"
                component="div"
                className="text-red-500"
              />
            </div>
            <div>
              <Field
                type="text"
                id="track"
                name="track"
                placeholder="Enter your track"
                className="p-2 w-[350px] bg-transparent border rounded"
              />
              <ErrorMessage
                name="track"
                component="div"
                className="text-red-500"
              />
            </div>
            <div>
              <Field
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                className="p-2 w-[350px] bg-transparent border rounded"
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
