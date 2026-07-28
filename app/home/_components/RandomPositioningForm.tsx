import React, { useState, useRef } from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "../../../src/components/ui/button";
import { FaImage, FaCheck } from "react-icons/fa";
import { compressImage } from "../../../src/utils/imageCompressor";

interface RandomPositioningFormProps {
  initialValues: {
    title: string;
    deadline: string;
    description: string;
    hideNames: boolean;
    assignmentMode?: "participants-pick" | "fcfs" | "random";
    imageUrl?: string;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validationSchema = Yup.object({
    title: Yup.string().required("Event name is required"),
    deadline: Yup.string().required("Join deadline is required"),
    description: Yup.string().optional(),
  });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any) => void
  ) => {
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

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    setFieldValue: (field: string, value: any) => void
  ) => {
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
    <div className="w-full max-w-2xl mx-auto">
      <Formik
        initialValues={{
          ...initialValues,
          assignmentMode: initialValues.assignmentMode || "participants-pick",
        }}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, handleChange, handleBlur, setFieldValue }) => {
          return (
            <Form className="bg-gray-50/50 p-6 md:p-8 rounded-3xl border border-gray-150/40 shadow-sm flex flex-col gap-6 text-left">
              {/* Event Details Section Label */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Event Details
                </h3>

                {/* How it works info box */}
                <div className="bg-purple-50 text-purple-800 border border-purple-100/50 text-xs rounded-2xl p-4 leading-relaxed mb-6">
                  <span className="font-bold">How it works:</span> Create an event
                  link. Participants join by entering their name. Once ready (or
                  at the deadline), you generate random positions (1st, 2nd,
                  3rd...).
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
                    className="p-3 w-full bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700"
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

                {/* Join Deadline */}
                <div className="mb-4">
                  <label
                    htmlFor="deadline"
                    className="block text-sm font-semibold text-gray-600 mb-1"
                  >
                    Join Deadline (Participants can join until this time)
                  </label>
                  <input
                    type="datetime-local"
                    id="deadline"
                    name="deadline"
                    className="p-3 w-full bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm text-gray-700"
                    value={values.deadline}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <ErrorMessage
                    name="deadline"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-semibold"
                  />
                </div>

                {/* Description (Optional) */}
                <div className="mb-4">
                  <label
                    htmlFor="description"
                    className="block text-sm font-semibold text-gray-600 mb-1"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="p-3 w-full bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700"
                    placeholder="Any additional info for participants..."
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <ErrorMessage
                    name="description"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-semibold"
                  />
                </div>

                {/* Position Assignment Mode */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Position Assignment Mode
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card 1: Participants Pick */}
                    <div
                      onClick={() => setFieldValue("assignmentMode", "participants-pick")}
                      className={`relative bg-white border rounded-2xl p-4 flex flex-col items-start gap-1 cursor-pointer transition-all hover:shadow-sm ${
                        values.assignmentMode === "participants-pick"
                          ? "border-[#CB30E0] bg-[#CB30E0]/5 ring-1 ring-[#CB30E0]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {values.assignmentMode === "participants-pick" && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-[#CB30E0] text-white rounded-full flex items-center justify-center shadow-sm">
                          <FaCheck className="w-2.5 h-2.5" />
                        </div>
                      )}
                      <h4 className="text-sm font-bold text-gray-900 pr-6 font-heading">
                        Participants Pick
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Each person selects their own position from available slots
                      </p>
                    </div>

                    {/* Card 2: First Come, First Served */}
                    <div
                      onClick={() => setFieldValue("assignmentMode", "fcfs")}
                      className={`relative bg-white border rounded-2xl p-4 flex flex-col items-start gap-1 cursor-pointer transition-all hover:shadow-sm ${
                        values.assignmentMode === "fcfs"
                          ? "border-[#CB30E0] bg-[#CB30E0]/5 ring-1 ring-[#CB30E0]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {values.assignmentMode === "fcfs" && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-[#CB30E0] text-white rounded-full flex items-center justify-center shadow-sm">
                          <FaCheck className="w-2.5 h-2.5" />
                        </div>
                      )}
                      <h4 className="text-sm font-bold text-gray-900 pr-6 font-heading">
                        First Come, First Served
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Positions assigned automatically in the order people join
                      </p>
                    </div>

                    {/* Card 3: Random Assignment */}
                    <div
                      onClick={() => setFieldValue("assignmentMode", "random")}
                      className={`relative bg-white border rounded-2xl p-4 flex flex-col items-start gap-1 cursor-pointer transition-all hover:shadow-sm ${
                        values.assignmentMode === "random"
                          ? "border-[#CB30E0] bg-[#CB30E0]/5 ring-1 ring-[#CB30E0]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {values.assignmentMode === "random" && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-[#CB30E0] text-white rounded-full flex items-center justify-center shadow-sm">
                          <FaCheck className="w-2.5 h-2.5" />
                        </div>
                      )}
                      <h4 className="text-sm font-bold text-gray-900 pr-6 font-heading">
                        Random Assignment
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        System randomly assigns a position when each participant joins
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload Event Image (optional) */}
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
                    className={`relative bg-white border-2 border-dashed border-gray-250/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors shadow-sm ${
                      values.imageUrl ? "h-64 border-solid" : "p-6 hover:bg-gray-50/55"
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
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-3">
                          <FaImage className="w-6 h-6 text-[#CB30E0]" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">
                          Drag and drop image file, or{" "}
                          <span className="text-[#CB30E0] hover:underline">
                            Upload File
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">
                          Supports PNG, JPG, JPEG (Max file size: 5MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
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
                  className="bg-gradient-to-b from-[#CB30E0] to-[#6A0D7A] hover:from-[#d54eeb] hover:to-[#7f1692] text-white font-bold px-8 py-3 rounded-full text-sm transition-all shadow-lg shadow-fuchsia-500/25 hover:shadow-xl hover:shadow-fuchsia-500/35 active:scale-95 cursor-pointer disabled:from-fuchsia-400 disabled:to-fuchsia-600 disabled:cursor-not-allowed border-0 outline-none flex-1"
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

export default RandomPositioningForm;
