import React from "react";
import { Formik, Form, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { Button } from "../../../src/components/ui/button";

interface FormComponentProps {
  initialValues: {
    numParticipants: string;
    numGroups: string;
    groupingPurpose: string;
    characteristicsLabel: string;
    characteristics: { name: string; count: string }[];
    isRandom?: boolean; // Add optional type
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
        {({ values, handleChange, handleBlur, setFieldValue }) => (
          <Form className="flex flex-col gap-4">
            {/* Strategy Selection */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grouping Strategy
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy" // We need to add this to initialValues/Formik logic if we want to track it
                    checked={
                      !values.characteristics?.length ||
                      values.isRandom === true
                    } // simplifying assumption, need to add isRandom to values
                    onChange={() => {
                      setFieldValue("isRandom", true);
                      setFieldValue("characteristics", []);
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Random (No specific roles)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="strategy"
                    checked={values.isRandom === false}
                    onChange={() => {
                      setFieldValue("isRandom", false);
                      if (values.characteristics.length === 0) {
                        setFieldValue("characteristics", [
                          { name: "", count: "" },
                        ]);
                      }
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>Role / Characteristic Based</span>
                </label>
              </div>
            </div>
            <div>
              <input
                type="text"
                id="groupingPurpose"
                name="groupingPurpose"
                className="p-2 w-full max-w-[500px] bg-transparent border rounded"
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

            {values.isRandom === false && (
              <>
                <hr className="my-6 border-gray-200" />

                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Participant Characteristics
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Define specific roles, skills, or traits to distribute
                    across groups .
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
                    className="p-2 w-full max-w-[500px] bg-transparent border rounded"
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
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => arrayHelpers.remove(index)}
                            className="bg-red-500 hover:bg-red-600 h-10 w-20"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() =>
                          arrayHelpers.push({ name: "", count: "" })
                        }
                        className="bg-green-500 hover:bg-green-600 text-white my-4 w-full md:w-auto"
                      >
                        Add Characteristic (e.g., Role, Skill)
                      </Button>
                    </div>
                  )}
                />
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              className={`text-white ${
                loading ? "bg-blue-400" : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default FormComponent;
