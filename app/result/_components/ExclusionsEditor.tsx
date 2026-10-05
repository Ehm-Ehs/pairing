"use client";

import { errorMessage } from "@/utils/errors";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { SecretSantaPairing } from "@/types";
import { setSecretSantaExclusions } from "@/services/endpoints";

interface Props {
  pairing: SecretSantaPairing;
}

/**
 * Lets the organizer say which participants must not draw each other
 * (partners, family members). The rules are applied by the server when pairs are drawn.
 */
export const ExclusionsEditor: React.FC<Props> = ({ pairing }) => {
  const participants = pairing.participants || [];
  const exclusions = pairing.config?.exclusions || [];
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [saving, setSaving] = useState(false);

  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name || "Removed participant";

  const save = async (next: { a: string; b: string }[]) => {
    setSaving(true);
    try {
      await setSecretSantaExclusions(pairing.id, next);
      setA("");
      setB("");
    } catch (err) {
      toast.error(errorMessage(err) || "Could not save the exclusion.");
    } finally {
      setSaving(false);
    }
  };

  const add = () => {
    if (!a || !b || a === b) {
      toast.error("Choose two different participants.");
      return;
    }
    const exists = exclusions.some((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    if (exists) {
      toast.info("That exclusion already exists.");
      return;
    }
    save([...exclusions, { a, b }]);
  };

  const selectClass =
    "flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 bg-white";

  return (
    <div className="bg-white rounded-[2rem] border border-gray-150/40 shadow-sm p-5 flex flex-col gap-4 text-left">
      <div>
        <h4 className="text-base font-bold text-gray-900">Exclusion rules</h4>
        <p className="text-xs text-gray-500 mt-0.5">
          People in an exclusion will never draw each other, for example partners or family members.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <select aria-label="First participant" value={a} onChange={(e) => setA(e.target.value)} className={selectClass}>
          <option value="">Select participant</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400 font-semibold text-center">cannot draw</span>
        <select aria-label="Second participant" value={b} onChange={(e) => setB(e.target.value)} className={selectClass}>
          <option value="">Select participant</option>
          {participants
            .filter((p) => p.id !== a)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        <button
          type="button"
          onClick={add}
          disabled={saving}
          className="bg-[#047857] disabled:opacity-50 text-white text-xs font-bold rounded-xl px-5 py-2.5"
        >
          Add
        </button>
      </div>

      {exclusions.length > 0 && (
        <ul className="flex flex-col gap-2">
          {exclusions.map((x) => (
            <li
              key={`${x.a}-${x.b}`}
              className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs"
            >
              <span className="font-semibold text-gray-800">
                {nameOf(x.a)} <span className="text-gray-400 font-medium">and</span> {nameOf(x.b)}
              </span>
              <button
                type="button"
                onClick={() => save(exclusions.filter((y) => y !== x))}
                disabled={saving}
                className="text-red-500 font-bold hover:text-red-700 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
