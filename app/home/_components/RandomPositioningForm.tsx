import React from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "../../../src/components/ui/button";

interface RandomPositioningFormProps {
  initialValues: {
    title: string;
    deadline: string;
    description: string;
    hideNames: boolean;
  };
  onSubmit: (values: any) => void;
  loading?: boolean;
  onCancel?: () => void;
}

const RandomPositioningForm: React.FC<RandomPositioningFormProps> = ({
  initialValues,
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const validationSchema = Yup.object({
    title: Yup.string().required("Event title is required"),
    deadline: Yup.string().required("Join deadline is required"),
    description: Yup.string().optional(),
    hideNames: Yup.boolean(),
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, handleBlur, setFieldValue }) => {
          return (
            <Form className="flex flex-col gap-6">
              {/* Event Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Event Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="p-2 w-full bg-white border rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g. Marathon Starting Lineup"
                  value={values.title}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  name="title"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Join Deadline */}
              <div>
                <label
                  htmlFor="deadline"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Join Deadline
                </label>
                <input
                  type="datetime-local"
                  id="deadline"
                  name="deadline"
                  className="p-2 w-full bg-white border rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  value={values.deadline}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Participants can join until this time.
                </p>
                <ErrorMessage
                  name="deadline"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Description (Optional) */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="p-2 w-full bg-white border rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Any extra info for participants..."
                  value={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              {/* Hide Names Toggle */}
              <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Hide Names Until Reveal
                    </h3>
                    <p className="text-sm text-gray-500">
                      Participants won't see who else joined until positions are
                      generated.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={values.hideNames}
                      onChange={(e) =>
                        setFieldValue("hideNames", e.target.checked)
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              <div className="border rounded-lg p-4 text-sm bg-purple-50 border-purple-200 text-purple-800">
                <span className="font-bold">How it works:</span> Create an event
                link. Participants join by entering their name. Once ready (or
                at the deadline), you generate random positions (1st, 2nd,
                3rd...).
              </div>

              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  isLoading={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {loading
                    ? "Creating Event..."
                    : "Create Random Positioning Event"}
                </Button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default RandomPositioningForm;
