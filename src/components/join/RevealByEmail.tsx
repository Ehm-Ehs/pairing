"use client";

import { errorMessage } from "@/utils/errors";
import React, { useState } from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { JOIN_THEMES, JoinAccent, JoinCard, NEUTRAL_BUTTON } from "./JoinCard";

/** These messages are a couple of sentences long, so they stay up longer than the default. */
const LONG_TOAST = { autoClose: 9000 };

const schema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
});

interface Props {
  accent: JoinAccent;
  icon: React.ReactNode;
  title: string;
  badge: string;
  /** Sentence above the email field. */
  prompt: string;
  submitLabel: string;
  /** Shown when the email is registered but there is nothing to show for it yet. */
  notFoundMessage: string;
  /**
   * Looks the email up and returns what to show the participant,
   * or null when there is nothing to show for that email.
   */
  lookup: (email: string) => Promise<React.ReactNode | null>;
  onClose: () => void;
}

/** The "already registered?" screen: enter your email, see your assignment. */
export const RevealByEmail: React.FC<Props> = ({
  accent,
  icon,
  title,
  badge,
  prompt,
  submitLabel,
  notFoundMessage,
  lookup,
  onClose,
}) => {
  const theme = JOIN_THEMES[accent];
  const [result, setResult] = useState<React.ReactNode | null>(null);
  const footer = "bg-[#F5F6F8] p-6 flex items-center justify-center gap-3 border-t border-gray-200 w-full rounded-b-[2rem]";

  return (
    <JoinCard accent={accent} icon={icon} title={title} badge={badge}>
      <Formik
        initialValues={{ email: "" }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const found = await lookup(values.email);
            if (found) setResult(found);
            else toast.error(notFoundMessage, LONG_TOAST);
          } catch (error) {
            toast.error(errorMessage(error) || notFoundMessage, LONG_TOAST);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, values, handleChange, handleBlur }) => (
          <Form className="flex flex-col w-full">
            <div className="p-6 md:p-8 flex flex-col gap-6 w-full">
              {result ? (
                <div className="animate-in fade-in zoom-in duration-300 w-full">{result}</div>
              ) : (
                <>
                  <p className="text-gray-500 text-sm leading-relaxed">{prompt}</p>
                  <div>
                    <label htmlFor="reveal-email" className="block text-sm font-semibold text-gray-600 mb-1">
                      Email Address
                    </label>
                    <input
                      id="reveal-email"
                      name="email"
                      type="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`px-4 py-3 w-full bg-white border border-gray-200 rounded-xl focus:ring-2 ${theme.ring} focus:outline-none transition-all text-sm placeholder:text-gray-400 text-gray-700 font-medium`}
                      placeholder="Your registered email"
                    />
                    <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1 font-semibold" />
                  </div>
                </>
              )}
            </div>

            {result ? (
              <div className={footer}>
                <button type="button" onClick={onClose} className={NEUTRAL_BUTTON}>
                  Done
                </button>
              </div>
            ) : (
              <div className={`${footer} flex-col sm:flex-row`}>
                <button type="button" onClick={onClose} className={NEUTRAL_BUTTON}>
                  Back
                </button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  className={`bg-gradient-to-b ${theme.button} hover:opacity-95 text-white font-bold px-8 py-3.5 rounded-full text-xs shadow-md transition-all cursor-pointer w-full h-auto`}
                >
                  {submitLabel}
                </Button>
              </div>
            )}
          </Form>
        )}
      </Formik>
    </JoinCard>
  );
};
