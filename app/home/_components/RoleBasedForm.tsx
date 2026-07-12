import React, { useState, useRef } from "react";
import { Formik, Form, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { FaImage, FaTrash, FaPlus, FaChevronRight } from "react-icons/fa";

interface FormComponentProps {
  initialValues: {
    numParticipants: string;
    numGroups: string;
    groupingPurpose: string;
    characteristicsLabel: string;
    characteristics: { name: string; count: string }[];
    isRandom?: boolean;
    imageUrl?: string;
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setFieldValue("imageUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setFieldValue("imageUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
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
                      Supports PNG, JPG, JPEG
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

                      <button
                        type="button"
                        disabled={isAddRoleDisabled}
                        onClick={() =>
                          arrayHelpers.push({ name: "", count: "" })
                        }
                        className={`font-bold text-sm mt-2 flex items-center gap-1.5 w-fit select-none transition-colors ${
                          isAddRoleDisabled
                            ? "text-gray-400 cursor-not-allowed opacity-60"
                            : "text-[#3A76F0] hover:text-[#2f5fc7] cursor-pointer"
                        }`}
                      >
                        <FaPlus className="w-3 h-3" />
                        Add Role
                      </button>
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
