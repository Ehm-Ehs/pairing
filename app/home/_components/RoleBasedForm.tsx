import React, { useState, useRef } from "react";
import { Formik, Form, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { FaImage, FaTrash, FaPlus, FaChevronRight } from "react-icons/fa";
import { compressImage } from "../../../src/utils/imageCompressor";

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
  };
  validationSchema: Yup.Schema<any>;
  onSubmit: (values: any) => void;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFieldValue: (field: string, value: any) => void) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      compressImage(file)
        .then((compressedUrl) => {
          setFieldValue("imageUrl", compressedUrl);
        })
        .catch((err) => {
          console.error("Compression failed:", err);
        });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, setFieldValue: (field: string, value: any) => void) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImageFile(file);
      compressImage(file)
        .then((compressedUrl) => {
          setFieldValue("imageUrl", compressedUrl);
        })
        .catch((err) => {
          console.error("Compression failed:", err);
        });
    }
  };

  return (
    <Formik
      initialValues={{
        ...initialValues,
        characteristicsLabel: initialValues.characteristicsLabel || "Role",
      }}
      validationSchema={validationSchema}
      onSubmit={(values) => {
        // If imageFile is selected, we can attach it or log it (since the DB doesn't store it yet)
        onSubmit(values);
      }}
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

            {/* Public Results Visibility Setting */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-600">
                Public Link Group Visibility
              </label>
              <div className="bg-white rounded-xl p-4 flex gap-6 md:gap-12 flex-col sm:flex-row shadow-sm border border-gray-100/50">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-700 select-none">
                  <input
                    type="radio"
                    name="visibilityMode"
                    value="public"
                    checked={values.visibilityMode !== "restricted"}
                    onChange={() => setFieldValue("visibilityMode", "public")}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block font-bold text-gray-900">🌐 Public (Show All Groups)</span>
                    <span className="text-xs text-gray-400 font-normal">Everyone on public links can view members of all groups</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-700 select-none">
                  <input
                    type="radio"
                    name="visibilityMode"
                    value="restricted"
                    checked={values.visibilityMode === "restricted"}
                    onChange={() => setFieldValue("visibilityMode", "restricted")}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block font-bold text-gray-900">🔒 Restricted (Blur Other Groups)</span>
                    <span className="text-xs text-gray-400 font-normal">Participants see only their group (available slots remain visible)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Notification Channel Setting */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-600">
                Participant Notification Channel
              </label>
              <div className="bg-white rounded-xl p-4 flex gap-6 md:gap-8 flex-col sm:flex-row shadow-sm border border-gray-100/50">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-700 select-none">
                  <input
                    type="radio"
                    name="notificationChannel"
                    value="email"
                    checked={values.notificationChannel === "email"}
                    onChange={() => setFieldValue("notificationChannel", "email")}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block font-bold text-gray-900">📧 Email (Resend API)</span>
                    <span className="text-xs text-gray-400 font-normal">Send alerts via Resend email</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-700 select-none">
                  <input
                    type="radio"
                    name="notificationChannel"
                    value="whatsapp"
                    checked={values.notificationChannel === "whatsapp"}
                    onChange={() => setFieldValue("notificationChannel", "whatsapp")}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block font-bold text-gray-900">💬 WhatsApp API</span>
                    <span className="text-xs text-gray-400 font-normal">Send alerts via WhatsApp message</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-gray-700 select-none">
                  <input
                    type="radio"
                    name="notificationChannel"
                    value="both"
                    checked={values.notificationChannel === "both" || !values.notificationChannel}
                    onChange={() => setFieldValue("notificationChannel", "both")}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block font-bold text-gray-900">📬 Both (Email & WhatsApp)</span>
                    <span className="text-xs text-gray-400 font-normal">Send notifications through both channels</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Multi-Round Speed Networking Setting */}
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-white border border-gray-100/80 shadow-sm">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isSpeedNetworking"
                    checked={(values as any).isSpeedNetworking || false}
                    onChange={(e) => {
                      setFieldValue("isSpeedNetworking", e.target.checked);
                      if (e.target.checked && !(values as any).speedNetworkingRounds) {
                        setFieldValue("speedNetworkingRounds", 3);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-gray-900 flex flex-wrap items-center gap-2">
                      <span>Enable Multi-Round Speed Networking</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold uppercase tracking-wider">
                        0.5 Tokens / Participant
                      </span>
                    </span>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      Generate continuous multi-round table rotations with zero repeat pairings (0.5 tokens per participant).
                    </p>
                  </div>
                </div>
              </label>

              {(values as any).isSpeedNetworking && (
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-4 animate-in fade-in duration-200">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-gray-700">Number of Networking Rounds</label>
                    <span className="text-[11px] text-gray-400">Select how many rounds to generate (1 to 10)</span>
                  </div>
                  <select
                    name="speedNetworkingRounds"
                    value={(values as any).speedNetworkingRounds || 3}
                    onChange={(e) => setFieldValue("speedNetworkingRounds", Number(e.target.value))}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                      <option key={r} value={r}>
                        {r} {r === 1 ? "Round" : "Rounds"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Upload Event Image */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-600">
                Upload Event Image (optional)
              </label>
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, setFieldValue)}
                onClick={() => {
                  if (!values.imageUrl) {
                    fileInputRef.current?.click();
                  }
                }}
                className={`relative bg-white border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors shadow-sm ${values.imageUrl ? "h-64 border-solid" : "p-6 hover:bg-gray-50"
                  }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e, setFieldValue)}
                  accept="image/*"
                  className="hidden"
                />
                {values.imageUrl ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={values.imageUrl}
                      alt="Event Preview"
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="bg-white/95 hover:bg-white text-gray-800 text-xs font-bold px-4 py-2 rounded-full shadow transition-all active:scale-95 cursor-pointer"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setFieldValue("imageUrl", "");
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow transition-all active:scale-95 cursor-pointer"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
                      <FaImage className="w-6 h-6 text-[#3A76F0]" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      Drag and drop image file, or{" "}
                      <span className="text-[#3A76F0] hover:underline">
                        Upload File
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports PNG, JPG, JPEG (Max file size: 5MB)
                    </p>
                  </>
                )}
              </div>
            </div>
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
                          className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
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

                          <div className="w-full sm:w-28">
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
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors self-end sm:self-auto"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </div>
                      ))}

                      <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-2 border-t border-gray-200/60">
                        <button
                          type="button"
                          disabled={isAddRoleDisabled}
                          onClick={() =>
                            arrayHelpers.push({ name: "", count: "" })
                          }
                          className={`font-bold text-xs flex items-center gap-1.5 select-none transition-colors ${
                            isAddRoleDisabled
                              ? "text-gray-400 cursor-not-allowed opacity-60"
                              : "text-[#3A76F0] hover:text-[#2f5fc7] cursor-pointer"
                          }`}
                        >
                          <FaPlus className="w-3 h-3" />
                          Add Role
                        </button>

                        <div className="flex items-center gap-3">
                          <label className="text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer flex items-center gap-1.5 select-none">
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
                                    const { parseRolesCsv } = await import("../../../src/utils/csvImport");
                                    const parsed = await parseRolesCsv(file);
                                    if (parsed.length > 0) {
                                      setFieldValue("characteristics", parsed);
                                    }
                                  } catch (err: any) {
                                    console.error("Failed to parse roles CSV:", err);
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
                              const { downloadCsvTemplate } = await import("../../../src/utils/csvImport");
                              downloadCsvTemplate("roles-only");
                            }}
                            className="text-xs font-bold text-gray-500 hover:text-gray-800 underline cursor-pointer select-none"
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
