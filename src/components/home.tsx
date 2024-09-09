import React, { useState } from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { v4 as uuidv4 } from "uuid"; // Import UUID generator
import { addPairing } from "./api/endpoints";

const Home = () => {
  const [formValues, setFormValues] = useState<{
    numParticipants: string;
    numGroups: string;
    groupingPurpose: string;
  }>({
    numParticipants: "",
    numGroups: "",
    groupingPurpose: "",
  });

  const [pairings, setPairings] = useState<{
    [key: number]: { id: string; number: number }[];
  } | null>(null);

  const validationSchema = Yup.object({
    numParticipants: Yup.number()
      .positive("Number of participants must be greater than zero")
      .integer("Number of participants must be an integer")
      .required("Number of participants is required"),
    numGroups: Yup.number()
      .positive("Number of groups must be greater than zero")
      .integer("Number of groups must be an integer")
      .required("Number of groups is required")
      .test(
        "divisible",
        "Number of participants must be divisible by number of groups",
        function (numGroups) {
          const { numParticipants } = this.parent;
          if (numGroups === 0) return false;
          return Number(numParticipants) % numGroups === 0;
        }
      ),
    groupingPurpose: Yup.string().required("Group purpose is required"),
  });

  const handleFormSubmit = (values: {
    numParticipants: string;
    numGroups: string;
    groupingPurpose: string;
  }) => {
    setFormValues(values);
  };

  const handleGetPairing = () => {
    const numParticipants = parseInt(formValues.numParticipants, 10);
    const groups = parseInt(formValues.numGroups, 10);

    if (
      isNaN(numParticipants) ||
      isNaN(groups) ||
      numParticipants <= 0 ||
      groups <= 0
    ) {
      console.error("Invalid number of participants or groups.");
      return;
    }

    const participants = Array.from({ length: numParticipants }, (_, i) => ({
      id: uuidv4(), // Generate a unique ID
      number: i + 1,
    }));

    const shuffledParticipants = [...participants].sort(
      () => Math.random() - 0.5
    );

    const groupAssignments: {
      [key: number]: { id: string; number: number }[];
    } = {};
    for (let i = 0; i < groups; i++) {
      groupAssignments[i + 1] = [];
    }

    shuffledParticipants.forEach((participant, index) => {
      const group = (index % groups) + 1;
      groupAssignments[group].push(participant);
    });

    setPairings(groupAssignments);
    handleSubmitPairings(formValues, groupAssignments);
  };

  const handleSubmitPairings = async (
    formValues: {
      numParticipants: string;
      numGroups: string;
      groupingPurpose: string;
    },
    pairings: { [key: number]: { id: string; number: number }[] }
  ) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.uid;
    console.log(userId);
    if (!userId) {
      console.error("User ID not found in local storage.");
      return;
    }

    const submissionData = {
      ...formValues,
      pairings,
    };

    try {
      const response = await addPairing(userId, submissionData);
      console.log("Submission successful", response);
    } catch (error) {
      console.error("Error during submission:", error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <h1 className="text-2xl mb-6">Group Raffle</h1>
      <div className="flex flex-col pb-10 px-10 mt-5">
        <div className="text-black text-2xl mb-6 text-center">
          <p className="text-2xl pb-2 font-medium">Pairing info</p>
          <p className="text-sm">Add details of your pairings or groupings</p>
        </div>
        <Formik
          initialValues={{
            numParticipants: "",
            numGroups: "",
            groupingPurpose: "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            handleFormSubmit(values);
          }}
        >
          {({ values, handleChange, handleBlur }) => (
            <Form className="flex flex-col gap-4">
              <div>
                <input
                  type="text"
                  id="groupingPurpose"
                  name="groupingPurpose"
                  className="p-2 w-[350px] bg-transparent border rounded"
                  placeholder="Enter group purpose"
                  value={values.groupingPurpose}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  name="groupingPurpose"
                  component="div"
                  className="text-red-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  id="numParticipants"
                  name="numParticipants"
                  className="p-2 w-[350px] bg-transparent border rounded"
                  placeholder="Enter number of participants"
                  value={values.numParticipants}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  name="numParticipants"
                  component="div"
                  className="text-red-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  id="numGroups"
                  name="numGroups"
                  className="p-2 w-[350px] bg-transparent border rounded"
                  placeholder="Enter number of groups"
                  value={values.numGroups}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  name="numGroups"
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
      <div className="flex flex-col justify-center items-center">
        <button
          onClick={handleGetPairing}
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600 mb-4"
        >
          Get Pairing
        </button>

        {pairings && Object.keys(pairings).length > 0 && (
          <div className="bg-gray-100 p-4 rounded shadow-md">
            <h3 className="text-lg font-semibold">Pairings:</h3>
            <div className="flex">
              {Object.entries(pairings).map(([group, participants]) => (
                <div key={group} className="mb-2">
                  <p className="text-lg font-semibold">Group {group}:</p>
                  <ul>
                    {participants.map((participant) => (
                      <li key={participant.id}>
                        Participant {participant.number} (ID: {participant.id})
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
