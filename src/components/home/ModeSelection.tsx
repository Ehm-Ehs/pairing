import React from "react";
import { FaUsers, FaGift } from "react-icons/fa";
import { Card, CardContent } from "../common/card";

interface ModeSelectionProps {
  onSelect: (mode: "role-based" | "secret-santa") => void;
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card
          className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
          onClick={() => onSelect("role-based")}
        >
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
              <FaUsers className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Role-Based Groups</h3>
            <p className="text-gray-500">
              Balanced groups with specific roles (e.g., 1 Designer, 2
              Developers)
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
            <h3 className="text-xl font-semibold mb-2">Secret Santa</h3>
            <p className="text-gray-500">
              Anonymous 1:1 gift exchange with optional wishlists
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
