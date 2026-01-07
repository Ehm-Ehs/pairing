import React from "react";
import FormComponent from "./RoleBasedForm";
import PairingResults from "./pairings";
import { ModeSelection } from "./ModeSelection";
import SecretSantaForm from "./SecretSantaForm";
import RandomPositioningForm from "./RandomPositioningForm";
import { useCreateEvent } from "../../../src/hooks/useCreateEvent";
import { validationSchema } from "./createEventValidation";

import { Modal } from "../../../src/components/ui/modal";
import { Button } from "../../../src/components/ui/button";

const CreateParing: React.FC = () => {
  const {
    eventType,
    setEventType,
    formValues,
    groups,
    modalState,
    loading,
    resultsRef,
    handleFormSubmit,
    handleModalConfirm,
    handleModalClose,
    handleSubmitSecretSanta,
    handleSubmitRandomPositioning,
  } = useCreateEvent();

  // Render logic
  if (!eventType) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <ModeSelection onSelect={setEventType} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row justify-center gap-8 md:gap-20 md:py-16 md:px-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex flex-col justify-center items-center w-full max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="w-full flex justify-start mb-4">
          <Button
            onClick={() => setEventType(null)}
            variant="ghost"
            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 pl-0 hover:bg-transparent"
          >
            &larr; Back to Event Type
          </Button>
        </div>

        {eventType === "role-based" ? (
          <>
            <div className="flex flex-col p-6 md:p-10 border rounded shadow-lg bg-white w-full">
              <FormComponent
                initialValues={formValues}
                validationSchema={validationSchema}
                onSubmit={handleFormSubmit}
                loading={loading}
              />
            </div>
            <div ref={resultsRef} className="w-full">
              <PairingResults formValues={formValues} groups={groups} />
            </div>
          </>
        ) : eventType === "random-positioning" ? (
          <div className="flex flex-col p-6 md:p-10 border rounded shadow-lg bg-white w-full">
            <RandomPositioningForm
              initialValues={{
                title: "",
                deadline: "",
                description: "",
                hideNames: false,
              }}
              onSubmit={handleSubmitRandomPositioning}
              loading={loading}
            />
          </div>
        ) : (
          <div className="flex flex-col p-6 md:p-10 border rounded shadow-lg bg-white w-full">
            <SecretSantaForm
              initialValues={{
                title: "",
                expectedParticipants: "10",
                allowWishlist: true,
              }}
              onSubmit={handleSubmitSecretSanta}
              loading={loading}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        description={modalState.description}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        confirmText="Continue Anyway"
        cancelText="Edit"
      />
    </div>
  );
};

export default CreateParing;
