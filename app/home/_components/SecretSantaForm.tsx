import React from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "../../../src/components/ui/button";

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
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, handleBlur, setFieldValue }) => {
          const isSecretSanta = values.allowWishlist;

          return (
            <Form className="flex flex-col gap-6">
              <div className="mb-2">
                <h2 className="text-xl font-medium text-gray-900">
                  {isSecretSanta
                    ? "Secret Santa Details"
                    : "Pairing Event Details"}
                </h2>
                <p className="text-lg text-gray-600">
                  {isSecretSanta
                    ? "Customize your gift exchange"
                    : "Setup your random pairing event"}
                </p>
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="subtype"
                      checked={values.allowWishlist === true} // Simplified check
                      onChange={() => setFieldValue("allowWishlist", true)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Secret Santa (With Wishlist)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="subtype"
                      checked={values.allowWishlist === false}
                      onChange={() => setFieldValue("allowWishlist", false)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Just Pair (No Wishlist)</span>
                  </label>
                </div>

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
                  className="p-2 w-full bg-white border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder={
                    isSecretSanta
                      ? "e.g. Office Secret Santa 2024"
                      : "e.g. Weekly Coffee Chat"
                  }
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
                  className="p-2 w-full bg-white border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

              {/* Options Card - Only show if Wishlist is enabled */}
              {values.allowWishlist && (
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
              )}

              {/* Info Alert */}
              <div
                className={`border rounded-lg p-4 text-sm ${
                  isSecretSanta
                    ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                <span className="font-bold">How it works:</span>{" "}
                {isSecretSanta
                  ? "Participants join through a shared link. Once everyone has registered, you'll generate the pairings. Each person will see only who they're buying for—completely anonymous!"
                  : "Participants join through a shared link. Once everyone has registered, you'll generate the pairings. We'll utilize our algorithm to shuffle and assign pairs randomly."}
              </div>

              <Button
                type="submit"
                disabled={loading}
                isLoading={loading}
                className={`mt-2 w-full text-white ${
                  loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading
                  ? "Creating Event..."
                  : isSecretSanta
                  ? "Create Secret Santa"
                  : "Create Pairings"}
              </Button>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default SecretSantaForm;
