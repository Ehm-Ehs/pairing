import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../src/components/ui/card";
import { Badge } from "../../../src/components/ui/Badge";
import { RoleBasedPairing } from "../../../src/types";

interface RoleBasedListProps {
  pairing: RoleBasedPairing;
}

const RoleBasedList = ({ pairing }: RoleBasedListProps) => {
  return (
    <>
      {/* Characteristics */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">
          Characteristics Distribution
          {pairing.characteristicsLabel && ` - ${pairing.characteristicsLabel}`}
        </h3>
        <div className="flex flex-wrap gap-2">
          {pairing.characteristics.map((char, i) => (
            <Badge key={i} variant="secondary">
              {char.name}: {char.count}
            </Badge>
          ))}
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(pairing.groups).map(([groupKey, group], groupIndex) => {
          const groupFilled = group.length;
          return (
            <Card key={groupKey} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Group {groupIndex + 1}
                  </CardTitle>
                  <Badge variant="secondary">{groupFilled} members</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.map((participant, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/80 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3A76F0] to-[#4650E5] flex items-center justify-center text-white text-xs font-bold shadow-sm mt-0.5">
                      {participant.name
                        ? participant.name.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {participant.name || "Available Slot"}
                        </p>
                        <span className="text-[10px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded border">
                          #{participant.number}
                        </span>
                      </div>

                      {participant.email && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {participant.email}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3A76F0]" />
                        <p className="text-xs font-medium text-[#3A76F0]">
                          {participant.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {group.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4 italic">
                    No participants yet
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default RoleBasedList;
