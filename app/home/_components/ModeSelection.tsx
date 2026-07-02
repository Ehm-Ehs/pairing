import {
  LogoCirclesIcon,
  SinglePairingIcon,
  CircleXFilledPinkIcon,
} from "../../../src/components/ui/icons";

interface ModeSelectionProps {
  onSelect: (
    mode: "role-based" | "secret-santa" | "random-positioning"
  ) => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelect }) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 font-heading tracking-tight">
          Create New Event
        </h2>
        <p className="text-gray-500 mt-2 text-sm">
          Choose your event type and set up the details
        </p>
      </div>

      <div className="bg-[#f1f3f5] rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-gray-200/20">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Group Pairs Card */}
          <div
            className="cursor-pointer bg-white rounded-[2rem] p-6 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all flex flex-col items-start justify-between text-left group h-full"
            onClick={() => onSelect("role-based")}
          >
            <div>
              <div className="w-12 h-12 bg-[#3A76F0] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#3A76F0]/30 text-white">
                <LogoCirclesIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1 font-heading text-gray-900">
                Group Pairs
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-6">
                Balanced team with roles
              </p>
            </div>
            <span className="border border-[#3A76F0] text-[#3A76F0] group-hover:bg-[#3A76F0]/5 font-bold text-xs rounded-full px-4 py-1.5 transition-colors inline-flex items-center">
              Create Event &gt;
            </span>
          </div>

          {/* Single Pairing Card */}
          <div
            className="cursor-pointer bg-white rounded-[2rem] p-6 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all flex flex-col items-start justify-between text-left group h-full"
            onClick={() => onSelect("secret-santa")}
          >
            <div>
              <div className="w-12 h-12 bg-[#34C759] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#34C759]/30 text-white">
                <SinglePairingIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1 font-heading text-gray-900">
                Single Pairing
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-6">
                1:1 anonymous matching
              </p>
            </div>
            <span className="border border-[#34C759] text-[#34C759] group-hover:bg-[#34C759]/5 font-bold text-xs rounded-full px-4 py-1.5 transition-colors inline-flex items-center">
              Create Event &gt;
            </span>
          </div>

          {/* Random Positioning Card */}
          <div
            className="cursor-pointer bg-white rounded-[2rem] p-6 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all flex flex-col items-start justify-between text-left group h-full"
            onClick={() => onSelect("random-positioning")}
          >
            <div>
              <div className="w-12 h-12 bg-[#CB30E0] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#CB30E0]/30 text-white">
                <CircleXFilledPinkIcon className="w-6.5 h-6.5 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1 font-heading text-gray-900">
                Random Positioning
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-6">
                Assign linear positions (1st, 2nd...) to participants
              </p>
            </div>
            <span className="border border-[#CB30E0] text-[#CB30E0] group-hover:bg-[#CB30E0]/5 font-bold text-xs rounded-full px-4 py-1.5 transition-colors inline-flex items-center">
              Create Event &gt;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
