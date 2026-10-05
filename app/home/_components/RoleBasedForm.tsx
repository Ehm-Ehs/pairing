import type { FormValues } from "@/hooks/useCreateEvent";
import { SpeedNetworkingOption } from "@/components/events/SpeedNetworkingOption";
import { logger } from "@/utils/logger";
import React from "react";
import { Formik, Form, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { FaTrash, FaPlus, FaChevronRight } from "react-icons/fa";
import { EventImageUpload } from "@/components/events/EventImageUpload";

interface FormComponentProps {
  initialValues: {
    numParticipants: string;
    numGroups: string;
    groupingPurpose: string;
    characteristicsLabel: string;
    characteristics: { name: string; count: string }[];
    isRandom?: boolean;
    imageUrl?: string;
    visibilityMode?: "public" | "restricted";
    notificationChannel?: "email" | "whatsapp" | "both";
    isSpeedNetworking?: boolean;
    speedNetworkingRounds?: number;
  };
  validationSchema: Yup.Schema<unknown>;
  onSubmit: (values: FormValues) => void;
  loading?: boolean;
  onCancel?: () => void;
}

const FormComponent: React.FC<FormComponentProps> = ({
  initialValues,
  validationSchema,
  onSubmit,
  loading = false,
  onCancel,
}) => {

  return (
    <Formik
      initialValues={{
        ...initialValues,
        characteristicsLabel: initialValues.characteristicsLabel || "Role",
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ values, handleChange, handleBlur, setFieldValue }) => {
        const numParticipants = parseInt(values.numParticipants, 10);
        const numGroups = parseInt(values.numGroups, 10);
        const hasValidGroups = numParticipants > 0 && numGroups > 0;
        const maxParticipantsPerGroup = hasValidGroups ? Math.floor(numParticipants / numGroups) : 0;
        const totalRoleCount = values.characteristics.reduce((sum, char) => sum + (parseInt(char.count, 10) || 0), 0);
        const isAddRoleDisabled = hasValidGroups && totalRoleCount >= maxParticipantsPerGroup;

        return (
          <Form className="flex flex-col gap-6 w-full text-left">
          {/* Event Details Card */}
          <div className="bg-[#f1f3f5] rounded-3xl p-6 md:p-8 flex flex-col gap-6 border border-gray-200/20">
            <h3 className="text-xl font-bold text-gray-800 font-heading">
              Event Details
            </h3>

            {/* Event Name Input */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="groupingPurpose"
                className="text-sm font-semibold text-gray-600"
              >
                Event Name
              </label>
              <input
                type="text"
                id="groupingPurpose"
                name="groupingPurpose"
                className="px-4 py-3 w-full bg-white border-0 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 placeholder-gray-400"
                placeholder="e.g Doe Foundation"
                value={values.groupingPurpose}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <ErrorMessage
                name="groupingPurpose"
                component="div"
                className="text-red-500 text-xs font-semibold mt-1"
              />
            </div>

            {/* Participants & Groups row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="numParticipants"
                  className="text-sm font-semibold text-gray-600"
                >
                  Number of participants
                </label>
                <input
                  type="number"
                  id="numParticipants"
                  name="numParticipants"
                  className="px-4 py-3 w-full bg-white border-0 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 placeholder-gray-400"
                  placeholder="e.g 20"
                  value={values.numParticipants}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
                <ErrorMessage
                  name="numParticipants"
                  component="div"
                  className="text-red-500 text-xs font-semibold mt-1"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="numGroups"
                  className="text-sm font-semibold text-gray-600"
                >
                  Number of groups
                </label>
                <input
                  type="number"
                  id="numGroups"
                  name="numGroups"
                  className="px-4 py-3 w-full bg-white border-0 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 placeholder-gray-400"
                  placeholder="e.g 20"
                  value={values.numGroups}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
                <ErrorMessage
                  name="numGroups"
                  component="div"
                  className="text-red-500 text-xs font-semibold mt-1"
                />
              </div>
            </div>

            {/* Grouping Strategy Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-600">
                Grouping Strategy
              </label>
              <div className="bg-white rounded-xl p-4 flex gap-6 md:gap-12 flex-col sm:flex-row shadow-sm border border-gray-100/50">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-700 select-none">
                  <input
                    type="radio"
                    name="strategy"
                    checked={
                      !values.characteristics?.length ||
                      values.isRandom === true
                    }
                    onChange={() => {
                      setFieldValue("isRandom", true);
                      setFieldValue("characteristics", []);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span>Random (No specific roles)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-700 select-none">
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
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span>Role / Characteristic Based</span>
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
            />

            <EventImageUpload
              value={values.imageUrl}
              onChange={(url) => setFieldValue("imageUrl", url)}
              accent="blue"
            />
          </div>

          {/* Group Structure Card (only when strategy is Role based) */}
          {values.isRandom === false && (
            <div className="bg-[#f1f3f5] rounded-3xl p-6 md:p-8 flex flex-col gap-4 border border-gray-200/20 animate-in fade-in slide-in-from-top-4 duration-300">
              <div>
                <h3 className="text-xl font-bold text-gray-800 font-heading">
                  Group Structure
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Define specific roles, skills, or traits to distribute across
                  groups. The count specifies how many participants have this
                  trait.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-600">
                  Roles per Group
                </span>

                <FieldArray
                  name="characteristics"
                  render={(arrayHelpers) => (
                    <div className="flex flex-col gap-3">
                      {values.characteristics.map((char, index) => (
                        <div
                          key={index}
                          className="flex flex-row gap-2 sm:gap-3 items-center"
                        >
                          <div className="flex-1">
                            <input
                              type="text"
                              name={`characteristics[${index}].name`}
                              placeholder="e.g Developer"
                              className="px-4 py-3 w-full bg-white border-0 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 placeholder-gray-400"
                              value={char.name}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <ErrorMessage
                              name={`characteristics[${index}].name`}
                              component="div"
                              className="text-red-500 text-xs font-semibold mt-1"
                            />
                          </div>

                          <div className="w-24 sm:w-28">
                            <input
                              type="number"
                              name={`characteristics[${index}].count`}
                              placeholder="count"
                              className="px-4 py-3 w-full bg-white border-0 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 placeholder-gray-400"
                              value={char.count}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            />
                            <ErrorMessage
                              name={`characteristics[${index}].count`}
                              component="div"
                              className="text-red-500 text-xs font-semibold mt-1"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => arrayHelpers.remove(index)}
                            title="Remove role"
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3.5 sm:px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      ))}

                      <div className="flex items-center justify-between gap-2 sm:gap-4 mt-2 pt-2 border-t border-gray-200/60 text-xs font-bold">
                        <button
                          type="button"
                          disabled={isAddRoleDisabled}
                          onClick={() =>
                            arrayHelpers.push({ name: "", count: "" })
                          }
                          className={`flex items-center gap-1.5 select-none transition-colors shrink-0 ${
                            isAddRoleDisabled
                              ? "text-gray-400 cursor-not-allowed opacity-60"
                              : "text-[#3A76F0] hover:text-[#2f5fc7] cursor-pointer"
                          }`}
                        >
                          <FaPlus className="w-3 h-3" />
                          <span>Add Role</span>
                        </button>

                        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                          <label className="text-gray-600 hover:text-gray-900 cursor-pointer flex items-center gap-1 select-none whitespace-nowrap">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>Import Roles CSV</span>
                            <input
                              type="file"
                              accept=".csv"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const { parseRolesCsv } = await import("@/utils/csvImport");
                                    const parsed = await parseRolesCsv(file);
                                    if (parsed.length > 0) {
                                      setFieldValue("characteristics", parsed);
                                    }
                                  } catch (err) {
                                    logger.error("Failed to parse roles CSV:", err);
                                  } finally {
                                    e.target.value = "";
                                  }
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={async () => {
                              const { downloadCsvTemplate } = await import("@/utils/csvImport");
                              downloadCsvTemplate("roles-only");
                            }}
                            className="text-gray-500 hover:text-gray-800 underline cursor-pointer select-none whitespace-nowrap"
                          >
                            Sample CSV
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-2.5 rounded-full font-bold text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] hover:from-[#4280FF] hover:to-[#023194] text-white px-8 py-2.5 rounded-full font-bold text-sm flex items-center gap-1.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all active:scale-95 cursor-pointer disabled:from-blue-400 disabled:to-blue-600 disabled:cursor-not-allowed border-0 outline-none"
            >
              {loading ? "Submitting..." : "Create event"}
              {!loading && <FaChevronRight className="w-3 h-3" />}
            </button>
          </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default FormComponent;
