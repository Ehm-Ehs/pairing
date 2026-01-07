import { FaUsers, FaGift, FaRandom } from "react-icons/fa";
import { Card, CardContent } from "../../../src/components/ui/card";

interface ModeSelectionProps {
  onSelect: (
    mode: "role-based" | "secret-santa" | "random-positioning"
  ) => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelect }) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
        <p className="text-gray-500 mt-2">
          Choose your event type and set up the details
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
          onClick={() => onSelect("role-based")}
        >
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
              <FaUsers className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Group Pairs</h3>
            <p className="text-gray-500">
              Balanced groups with or without characteristics
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-red-500 hover:shadow-md transition-all group"
          onClick={() => onSelect("secret-santa")}
        >
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-100 transition-colors">
              <FaGift className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Single Pairings (1:1)
            </h3>
            <p className="text-gray-500">
              Anonymous 1:1 pairing (Secret Santa or Just Pair)
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-purple-500 hover:shadow-md transition-all group"
          onClick={() => onSelect("random-positioning")}
        >
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-100 transition-colors">
              <FaRandom className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Random Positioning</h3>
            <p className="text-gray-500">
              Assign linear positions (1st, 2nd...) to participants
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
