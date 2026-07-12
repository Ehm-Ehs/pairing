import React from "react";
import dynamic from "next/dynamic";
import { ModeSelection } from "./ModeSelection";

const FormComponent = dynamic(() => import("./RoleBasedForm"), {
  loading: () => <div className="text-gray-400 animate-pulse py-8 text-center text-xs font-semibold">Loading Form...</div>,
  ssr: false,
});

const SecretSantaForm = dynamic(() => import("./SecretSantaForm"), {
  loading: () => <div className="text-gray-400 animate-pulse py-8 text-center text-xs font-semibold">Loading Form...</div>,
  ssr: false,
});

const RandomPositioningForm = dynamic(() => import("./RandomPositioningForm"), {
  loading: () => <div className="text-gray-400 animate-pulse py-8 text-center text-xs font-semibold">Loading Form...</div>,
  ssr: false,
});

import { useCreateEvent } from "../../../src/hooks/useCreateEvent";
import { validationSchema } from "./createEventValidation";
import GuestLimitBlocker from "../../../src/components/auth/GuestLimitBlocker";
import { GroupingsPageProps } from "../../../src/types";

import { Modal } from "../../../src/components/ui/modal";
import { Button } from "../../../src/components/ui/button";
import { useRouter } from "next/navigation";
import {
  LogoCirclesIcon,
  SinglePairingIcon,
  CircleXFilledPinkIcon,
} from "../../../src/components/ui/icons";

interface CreateParingProps {
  user?: GroupingsPageProps;
}

const CreateParing: React.FC<CreateParingProps> = ({ user }) => {
  const router = useRouter();
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
      <div className="py-12 flex items-center justify-center p-4">
        <GuestLimitBlocker />
      </div>
    );
  }

  // If no type selected, show ModeSelection
  if (!eventType) {
    return (
      <div className="py-8">
        <ModeSelection onSelect={setEventType} />
      </div>
    );
  }

  const handleCancel = () => {
    setEventType(null);
  };

  return (
    <div className="py-8 px-4 max-w-4xl mx-auto">
      {/* Back button */}


      {/* Main card container */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-sm border border-gray-200/80 w-full flex flex-col items-center">
        {/* Header */}  <div
          onClick={() => {
            if (eventType) {
              setEventType(null);
            } else {
              router.push("/home");
            }
          }}
          className="self-start flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 text-sm font-semibold cursor-pointer group"
        >
          <svg width="29" height="29" viewBox="0 0 28.3333 28.3333" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M10.2978 13.0333L12.2924 15.028L11.0897 16.2308L8.28467 13.4258L7.58483 12.7245C7.45204 12.5917 7.37744 12.4115 7.37744 12.2237C7.37744 12.0359 7.45204 11.8557 7.58483 11.7229L11.0897 8.21667L12.2924 9.41942L10.3771 11.3333H17C18.1272 11.3333 19.2082 11.7811 20.0052 12.5781C20.8022 13.3752 21.25 14.4562 21.25 15.5833C21.25 16.7105 20.8022 17.7915 20.0052 18.5885C19.2082 19.3856 18.1272 19.8333 17 19.8333H14.1667V18.1333H17C17.6763 18.1333 18.3249 17.8647 18.8031 17.3865C19.2813 16.9082 19.55 16.2596 19.55 15.5833C19.55 14.907 19.2813 14.2584 18.8031 13.7802C18.3249 13.302 17.6763 13.0333 17 13.0333H10.2978ZM14.1667 28.3333C6.34242 28.3333 0 21.9909 0 14.1667C0 6.34242 6.34242 0 14.1667 0C21.9909 0 28.3333 6.34242 28.3333 14.1667C28.3333 21.9909 21.9909 28.3333 14.1667 28.3333ZM14.1667 26.6333C17.473 26.6333 20.644 25.3199 22.9819 22.9819C25.3199 20.644 26.6333 17.473 26.6333 14.1667C26.6333 10.8603 25.3199 7.68936 22.9819 5.3514C20.644 3.01345 17.473 1.7 14.1667 1.7C10.8603 1.7 7.68936 3.01345 5.3514 5.3514C3.01345 7.68936 1.7 10.8603 1.7 14.1667C1.7 17.473 3.01345 20.644 5.3514 22.9819C7.68936 25.3199 10.8603 26.6333 14.1667 26.6333Z" fill="#242424" fill-opacity="0.9" />
          </svg>

          Back to My Events
        </div>
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 ${eventType === "role-based" ? "bg-[#3A76F0] shadow-[#3A76F0]/30" :
            eventType === "random-positioning" ? "bg-[#CB30E0] shadow-[#CB30E0]/30" :
              "bg-[#34C759] shadow-[#34C759]/30"
            }`}>
            {eventType === "role-based" ? <LogoCirclesIcon className="w-6 h-6 text-white" /> :
              eventType === "random-positioning" ? <CircleXFilledPinkIcon className="w-6.5 h-6.5 text-white" /> :
                <SinglePairingIcon className="w-6 h-6 text-white" />}
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-heading tracking-tight">
            {eventType === "role-based"
              ? "Create Group Pairs"
              : eventType === "random-positioning"
                ? "Random Positioning Details"
                : "Create Just Pair"}
          </h2>
          <p className="text-sm text-gray-500">
            {eventType === "role-based"
              ? "Tell us about your group or pairs"
              : eventType === "random-positioning"
                ? "Assign unique random positions (1-N) to participants."
                : "Set up anonymous 1:1 matching"}
          </p>
        </div>

        {/* Form area */}
        <div className="w-full">
          {eventType === "role-based" ? (
            <FormComponent
              initialValues={formValues}
              validationSchema={validationSchema}
              onSubmit={handleFormSubmit}
              loading={loading}
              onCancel={handleCancel}
            />
          ) : eventType === "random-positioning" ? (
            <RandomPositioningForm
              initialValues={{
                title: "",
                deadline: "",
                description: "",
                hideNames: false,
                imageUrl: "",
              }}
              onSubmit={handleSubmitRandomPositioning}
              loading={loading}
              onCancel={handleCancel}
            />
          ) : (
            <SecretSantaForm
              initialValues={{
                title: "",
                expectedParticipants: "10",
                allowWishlist: true,
                imageUrl: "",
              }}
              onSubmit={handleSubmitSecretSanta}
              loading={loading}
              onModeChange={setIsSecretSantaMode}
              onCancel={handleCancel}
            />
          )}
        </div>
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
