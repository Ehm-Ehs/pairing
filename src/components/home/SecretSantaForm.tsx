import React from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";

interface SecretSantaFormProps {
  initialValues: {
    title: string;
    expectedParticipants: string;
    allowWishlist: boolean;
  };
  onSubmit: (values: any) => void;
  loading?: boolean;
}

const SecretSantaForm: React.FC<SecretSantaFormProps> = ({
  initialValues,
  onSubmit,
  loading = false,
}) => {
  const validationSchema = Yup.object({
    title: Yup.string().required("Event title is required"),
    expectedParticipants: Yup.number()
      .positive("Must be at least 1 participant")
      .integer("Must be a whole number")
      .required("Expected participants is required"),
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-900">
          Secret Santa Details
        </h2>
        <p className="text-lg text-gray-600">Customize your gift exchange</p>
      </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, handleBlur, setFieldValue }) => (
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
                className="p-2 w-full bg-transparent border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Office Secret Santa 2024"
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

            {/* Expected Participants */}
            <div>
              <label
                htmlFor="expectedParticipants"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Expected Participants
              </label>
              <input
                type="number"
                id="expectedParticipants"
                name="expectedParticipants"
                className="p-2 w-full bg-transparent border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="20"
                value={values.expectedParticipants}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <p className="text-xs text-gray-500 mt-1">
                Participants will join through a shared link
              </p>
              <ErrorMessage
                name="expectedParticipants"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            {/* Options Card */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Allow Wishlist Notes
                  </h3>
                  <p className="text-sm text-gray-500">
                    Let participants add gift preferences
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={values.allowWishlist}
                    onChange={(e) =>
                      setFieldValue("allowWishlist", e.target.checked)
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Info Alert */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <span className="font-bold">How it works:</span> Participants join
              through a shared link. Once everyone has registered, you'll
              generate the pairings. Each person will see only who they're
              buying for—completely anonymous!
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`p-3 rounded-lg text-white font-medium transition-colors mt-2 ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Creating Event..." : "Create Secret Santa"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default SecretSantaForm;
