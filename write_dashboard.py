
import os

content = r"""import React from "react";
import { Button } from "../common/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../common/card";
import { FaSync, FaCheck, FaCopy } from "react-icons/fa";

interface Slot {
  id: string;
  filled: boolean;
  role: string;
  participantName?: string;
}

interface Group {
  id: string;
  groupNumber: number;
  slots: Slot[];
}

interface EventData {
  eventTitle: string;
  numGroups: number;
}

interface DashboardProps {
  event: EventData;
  groups: Group[];
  loadData: () => void;
  shareUrl: string;
  copyShareLink: () => void;
  copied: boolean;
  filledSlots: number;
  totalSlots: number;
  fillPercentage: number;
}

const Badge = ({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary";
  className?: string;
}) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-medium ${
      variant === "secondary"
        ? "bg-gray-100 text-gray-800"
        : "bg-blue-100 text-blue-800"
    } ${className}`}
  >
    {children}
  </span>
);

const Dashboard: React.FC<DashboardProps> = ({
  event,
  groups,
  loadData,
  shareUrl,
  copyShareLink,
  copied,
  filledSlots,
  totalSlots,
  fillPercentage,
}) => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{event.eventTitle}</h1>
          <p className="text-muted-foreground mt-1">Watch groups fill live</p>
        </div>
        <Button onClick={loadData} variant="outline" size="icon">
          <FaSync className="w-4 h-4" />
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-[#3A76F0] to-[#4650E5] text-white border-0 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Share Link</CardTitle>
          <CardDescription className="text-white/80">
            Send this link to participants so they can join
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 text-sm overflow-x-auto">
              {shareUrl}
            </div>
            <Button
              onClick={copyShareLink}
              variant="secondary"
              className="bg-white text-[#3A76F0] hover:bg-white/90"
            >
              {copied ? (
                <FaCheck className="w-4 h-4 mr-2" />
              ) : (
                <FaCopy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Groups</p>
              <p className="text-2xl">{event.numGroups}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Filled Slots</p>
              <p className="text-2xl">
                {filledSlots} / {totalSlots}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Fill Rate</p>
              <p className="text-2xl">{fillPercentage}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => {
          const filled = group.slots.filter((s) => s.filled).length;
          const total = group.slots.length;
          const isComplete = filled === total;

          return (
            <Card
              key={group.id}
              className={isComplete ? "border-[#60E1B1] bg-[#60E1B1]/5" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Group {group.groupNumber}
                  </CardTitle>
                  <Badge
                    variant={isComplete ? "default" : "secondary"}
                    className={isComplete ? "bg-[#60E1B1] text-black" : ""}
                  >
                    {filled}/{total}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-2 rounded-md ${
                      slot.filled
                        ? "bg-muted"
                        : "bg-muted/30 border border-dashed border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          slot.filled
                            ? "bg-[#60E1B1]"
                            : "bg-muted-foreground/30"
                        }`}
                      />
                      <span className="text-sm">{slot.role}</span>
                    </div>
                    {slot.filled && slot.participantName && (
                      <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                        {slot.participantName}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
"""

with open('/Users/mac/Desktop/me/random-selection/src/components/home/dashboard.tsx', 'w') as f:
    f.write(content)

print("Successfully wrote dashboard.tsx")
