import React from "react";
import { Formik, Form, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";

interface FormComponentProps {
  initialValues: {
    numParticipants: string;
    numGroups: string;
    groupingPurpose: string;
    characteristics: { name: string; count: string }[];
  };
  validationSchema: Yup.Schema<any>;
  onSubmit: (values: any) => void;
}

const FormComponent: React.FC<FormComponentProps> = ({
  initialValues,
  validationSchema,
  onSubmit,
}) => {
  return (
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

          <FieldArray
            name="characteristics"
            render={(arrayHelpers) => (
              <div>
                {values.characteristics.map((char, index) => (
                  <div key={index} className="flex gap-4 mb-2 items-center">
                    <input
                      type="text"
                      name={`characteristics[${index}].name`}
                      placeholder="Characteristic name"
                      className="p-2 w-[350px] bg-transparent border rounded"
                      value={char.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <input
                      type="number"
                      name={`characteristics[${index}].count`}
                      placeholder="Count"
                      className="p-2 w-[350px] bg-transparent border rounded"
                      value={char.count}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
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
                  className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                  Add Characteristic
                </button>
              </div>
            )}
          />

          <button
            type="submit"
            className="bg-blue-700 text-white p-2 rounded hover:bg-blue-800"
          >
            Submit
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default FormComponent;
