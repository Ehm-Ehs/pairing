import React from "react";
import { Formik, Form, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";

interface FormComponentProps {
  initialValues: {
    numParticipants: string;
    numGroups: string;
    groupingPurpose: string;
    characteristicsLabel: string;
    characteristics: { name: string; count: string }[];
  };
  validationSchema: Yup.Schema<any>;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

const FormComponent: React.FC<FormComponentProps> = ({
  initialValues,
  validationSchema,
  onSubmit,
  loading = false,
}) => {
  return (
    <>
      <div className="mb-6 ">
        <h2 className="text-xl font-medium text-gray-900 ">Pairing Details</h2>
        <p className="text-lg text-gray-600">
          Tell us about your group or pairs
        </p>
      </div>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, handleBlur }) => (
          <Form className="flex flex-col gap-4">
            <div>
              <input
                type="text"
                id="groupingPurpose"
                name="groupingPurpose"
                className="p-2 w-[500px] bg-transparent border rounded"
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
            <div className="flex flex-col md:flex-row gap-4">
              <div>
                <input
                  type="number"
                  id="numParticipants"
                  name="numParticipants"
                  className="p-2 w-full   bg-transparent border rounded"
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
                  className="p-2 w-full   bg-transparent border rounded"
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
            </div>

            <hr className="my-6 border-gray-200" />

            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Participant Characteristics
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Define specific roles, skills, or traits to distribute across
                groups .
              </p>
              <p className="text-sm text-gray-500 mt-1">
                The count specifies how many participants have this trait.
              </p>
            </div>
            <div className="mb-4">
              <input
                type="text"
                id="characteristicsLabel"
                name="characteristicsLabel"
                className="p-2 w-[500px] bg-transparent border rounded"
                placeholder="Label for Characteristics (e.g., Role, Skill)"
                value={values.characteristicsLabel}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <FieldArray
              name="characteristics"
              render={(arrayHelpers) => (
                <div>
                  {values.characteristics.map((char, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row gap-4 mb-2 items-start md:items-center"
                    >
                      <div>
                        {" "}
                        <input
                          type="text"
                          name={`characteristics[${index}].name`}
                          placeholder="Characteristic name"
                          className="p-2 w-full bg-transparent border rounded"
                          value={char.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <ErrorMessage
                          name={`characteristics[${index}].name`}
                          component="div"
                          className="text-red-500 text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          name={`characteristics[${index}].count`}
                          placeholder="Count"
                          className="p-2 w-full bg-transparent border rounded"
                          value={char.count}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                        <ErrorMessage
                          name={`characteristics[${index}].count`}
                          component="div"
                          className="text-red-500 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => arrayHelpers.remove(index)}
                        className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => arrayHelpers.push({ name: "", count: "" })}
                    className="bg-green-500 text-white p-2 my-4 rounded hover:bg-green-600 text-sm font-medium transition-colors"
                  >
                    Add Characteristic (e.g., Role, Skill)
                  </button>
                </div>
              )}
            />

            <button
              type="submit"
              disabled={loading}
              className={`p-2 rounded text-white ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default FormComponent;
