import type { SecretSantaFormValues } from "@/hooks/useCreateEvent";
import { SpeedNetworkingOption } from "@/components/events/SpeedNetworkingOption";
import React from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { EventImageUpload } from "@/components/events/EventImageUpload";

interface SecretSantaFormProps {
  initialValues: {
    title: string;
    expectedParticipants: string;
    allowWishlist: boolean;
    imageUrl?: string;
    isSpeedNetworking?: boolean;
    speedNetworkingRounds?: number;
  };
  onSubmit: (values: SecretSantaFormValues) => void;
  loading?: boolean;
  onCancel?: () => void;
}

const SecretSantaForm: React.FC<SecretSantaFormProps> = ({
  initialValues,
  onSubmit,
  loading = false,
  onCancel,
}) => {

  const validationSchema = Yup.object({
    title: Yup.string().required("Event name is required"),
    expectedParticipants: Yup.number()
      .positive("Must be at least 1 participant")
      .integer("Must be a whole number")
      .required("Number of participants is required"),
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
            <Form className="bg-gray-50/50 p-6 md:p-8 rounded-3xl border border-gray-150/40 shadow-sm flex flex-col gap-6 text-left">
              {/* Event Details Section Label */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Event Details
                </h3>

                {/* How it works info box */}
                <div className="bg-blue-50 text-blue-600 border border-blue-100/50 text-xs rounded-2xl p-4 leading-relaxed mb-6">
                  <span className="font-bold">How it works:</span>{" "}
                  {isSecretSanta
                    ? "Participants join through a shared link. Once everyone has registered, you will generate the pairings. Each person will see only who they are buying for, completely anonymous!"
                    : "Participants join through a shared link. Once everyone has registered, you will generate the pairings. We will utilize our algorithm to shuffle and assign pairs randomly."}
                </div>

                {/* Event Name */}
                <div className="mb-4">
                  <label
                    htmlFor="title"
                    className="block text-sm font-semibold text-gray-600 mb-1"
                  >
                    Event Name
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="p-3 w-full bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700"
                    placeholder="e.g Doe Foundation"
                    value={values.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <ErrorMessage
                    name="title"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-semibold"
                  />
                </div>

                {/* Expected Participants */}
                <div className="mb-4">
                  <label
                    htmlFor="expectedParticipants"
                    className="block text-sm font-semibold text-gray-600 mb-1"
                  >
                    Number of participants
                  </label>
                  <input
                    type="number"
                    id="expectedParticipants"
                    name="expectedParticipants"
                    className="p-3 w-full bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700"
                    placeholder="e.g 20"
                    value={values.expectedParticipants}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                  <ErrorMessage
                    name="expectedParticipants"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-semibold"
                  />
                </div>

                {/* Event Type */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Event Type
                  </label>
                  <div className="bg-white border border-gray-150/20 rounded-2xl p-4 flex flex-col md:flex-row gap-6 shadow-sm">
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-gray-700">
                      <input
                        type="radio"
                        name="subtype"
                        checked={values.allowWishlist === true}
                        onChange={() => {
                          setFieldValue("allowWishlist", true);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>Secret Santa (With Wishlist)</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-gray-700">
                      <input
                        type="radio"
                        name="subtype"
                        checked={values.allowWishlist === false}
                        onChange={() => {
                          setFieldValue("allowWishlist", false);
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>Just Pair (No Wishlist)</span>
                    </label>
                  </div>
                </div>

                <SpeedNetworkingOption
                  enabled={values.isSpeedNetworking}
                  rounds={values.speedNetworkingRounds}
                  onChange={({ enabled, rounds }) => {
                    setFieldValue("isSpeedNetworking", enabled);
                    setFieldValue("speedNetworkingRounds", rounds);
                  }}
                  className="mb-4"
                />

                <EventImageUpload
                  value={values.imageUrl}
                  onChange={(url) => setFieldValue("imageUrl", url)}
                  accent="blue"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex gap-4 mt-4 w-full">
                <button
                  type="button"
                  onClick={onCancel}
                  className="bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold px-8 py-3 rounded-full text-xs transition-all shadow-sm flex-1 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] hover:from-[#4280FF] hover:to-[#023194] text-white font-bold px-8 py-3 rounded-full text-sm transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 active:scale-95 cursor-pointer disabled:from-blue-400 disabled:to-blue-600 disabled:cursor-not-allowed border-0 outline-none flex-1"
                >
                  {loading ? "Creating event..." : "Create event >"}
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default SecretSantaForm;
