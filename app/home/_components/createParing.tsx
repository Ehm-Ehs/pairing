import React from "react";
import FormComponent from "./RoleBasedForm";
import PairingResults from "./pairings";
import { ModeSelection } from "./ModeSelection";
import SecretSantaForm from "./SecretSantaForm";
import RandomPositioningForm from "./RandomPositioningForm";
import { useCreateEvent } from "../../../src/hooks/useCreateEvent";
import { validationSchema } from "./createEventValidation";
import GuestLimitBlocker from "../../../src/components/auth/GuestLimitBlocker";
import { GroupingsPageProps } from "../../../src/types";

import { Modal } from "../../../src/components/ui/modal";
import { Button } from "../../../src/components/ui/button";

interface CreateParingProps {
  user?: GroupingsPageProps;
}

const CreateParing: React.FC<CreateParingProps> = ({ user }) => {
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

  const [isSecretSantaMode, setIsSecretSantaMode] = React.useState(true);

  // Render blocker if anonymous guest event limit reached
  if (user?.isAnonymous && (user?.pairings?.length || 0) >= 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <GuestLimitBlocker />
      </div>
    );
  }

  // Render logic
  if (!eventType) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <ModeSelection onSelect={setEventType} />
      </div>
    );
  }

  const handleCancel = () => {
    setEventType(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row justify-center gap-8 md:gap-20 md:py-16 md:px-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex flex-col justify-center items-center w-full max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 font-heading">
            {eventType === "role-based"
              ? "Pairing Details"
              : eventType === "random-positioning"
              ? "Random Positioning Details"
              : isSecretSantaMode
              ? "Secret Santa Details"
              : "Pairing Event Details"}
          </h2>
          <p className="text-lg text-gray-600">
            {eventType === "role-based"
              ? "Tell us about your group or pairs"
              : eventType === "random-positioning"
              ? "Assign unique random positions (1-N) to participants."
              : isSecretSantaMode
              ? "Customize your gift exchange"
              : "Setup your random pairing event"}
          </p>
        </div>

        {eventType === "role-based" ? (
          <>
            <div className="flex flex-col p-6 md:p-10 border rounded shadow-lg bg-white w-full">
              <FormComponent
                initialValues={formValues}
                validationSchema={validationSchema}
                onSubmit={handleFormSubmit}
                loading={loading}
                onCancel={handleCancel}
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
              onCancel={handleCancel}
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
              onModeChange={setIsSecretSantaMode}
              onCancel={handleCancel}
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
