import { SecretSantaPairing } from "../../../src/types";
import { getGravatarUrl } from "../../../src/utils/avatar";

interface PairsGridProps {
  pairing: SecretSantaPairing;
}

export function PairsGrid({ pairing }: PairsGridProps) {
  const expectedCount = Number(pairing.config?.expectedParticipants || 12);
  const totalPairs = Math.ceil(expectedCount / 2);

  if (pairing.config?.allowWishlist === false) {
    return (
      <div className="flex flex-col gap-4 text-left">
        <h3 className="text-2xl font-bold text-gray-900 font-heading">Participants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: totalPairs }).map((_, index) => {
            const pA = pairing.participants?.find(p => p.pairIndex === index && p.positionLetter === "A");
            const pB = pairing.participants?.find(p => p.pairIndex === index && p.positionLetter === "B");
            const filledCount = (pA ? 1 : 0) + (pB ? 1 : 0);

            return (
              <div
                key={index}
                className="bg-white rounded-[1.5rem] border border-gray-150/40 p-5 shadow-sm hover:shadow transition-shadow duration-300 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between border-b border-gray-55 pb-2">
                  <h4 className="text-base font-bold text-gray-900 font-heading">Pair {index + 1}</h4>
                  <span className="text-xs font-semibold text-gray-400">{filledCount}/2 members</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {/* Person A */}
                  {pA ? (
                    <div className="border border-gray-150/40 bg-white rounded-2xl p-3 flex items-center gap-3 w-full shadow-sm">
                      <img
                        src={getGravatarUrl(pA.email, pA.name)}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
                      />
                      <div className="flex-grow min-w-0">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 capitalize">Person A</span>
                        <h5 className="text-xs font-bold text-gray-900 mt-1 truncate capitalize font-heading">{pA.name}</h5>
                        {pA.email && <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">{pA.email}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-250 bg-white rounded-2xl p-3 flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xs font-bold font-mono">A</div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-gray-400 capitalize">Empty Slot</p>
                        <p className="text-[10px] text-gray-350 font-medium">Waiting for participant</p>
                      </div>
                    </div>
                  )}

                  {/* Person B */}
                  {pB ? (
                    <div className="border border-gray-150/40 bg-white rounded-2xl p-3 flex items-center gap-3 w-full shadow-sm">
                      <img
                        src={getGravatarUrl(pB.email, pB.name)}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
                      />
                      <div className="flex-grow min-w-0">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 capitalize">Person B</span>
                        <h5 className="text-xs font-bold text-gray-900 mt-1 truncate capitalize font-heading">{pB.name}</h5>
                        {pB.email && <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">{pB.email}</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-250 bg-white rounded-2xl p-3 flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xs font-bold font-mono">B</div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-gray-400 capitalize">Empty Slot</p>
                        <p className="text-[10px] text-gray-355 font-medium">Waiting for participant</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (pairing.participants?.length === 0) {
    return (
      <div className="flex flex-col gap-4 text-left">
        <h3 className="text-2xl font-bold text-gray-900 font-heading">Participants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: Math.max(4, Math.floor((pairing.config?.expectedParticipants || 8) / 2)) }).map((_, index) => (
            <div key={index} className="bg-white rounded-[1.5rem] border border-gray-150/40 p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-155 pb-2">
                <h4 className="text-base font-bold text-gray-900 font-heading">Pair {index + 1}</h4>
                <span className="text-xs font-semibold text-gray-400">0/2 members</span>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="border border-dashed border-gray-250 bg-white rounded-2xl p-3 flex items-center gap-3 w-full">
                  <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xs font-bold font-mono">A</div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-bold text-gray-400 capitalize">Empty Slot</p>
                    <p className="text-[10px] text-gray-300 font-medium">Waiting for participant</p>
                  </div>
                </div>
                <div className="border border-dashed border-gray-250 bg-white rounded-2xl p-3 flex items-center gap-3 w-full">
                  <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xs font-bold font-mono">B</div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-bold text-gray-400 capitalize">Empty Slot</p>
                    <p className="text-[10px] text-gray-300 font-medium">Waiting for participant</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (pairing.status === "locked" && pairing.pairs && pairing.pairs.length > 0) {
    return (
      <div className="flex flex-col gap-4 text-left">
        <h3 className="text-2xl font-bold text-gray-900 font-heading">Participants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pairing.pairs.map((pair, index) => {
            const santa = pairing.participants?.find(p => p.id === pair.santaId);
            const receiver = pairing.participants?.find(p => p.id === pair.receiverId);
            
            return (
              <div key={index} className="bg-white rounded-[1.5rem] border border-gray-150/40 p-5 shadow-sm hover:shadow transition-shadow duration-300 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-gray-55 pb-2">
                  <h4 className="text-base font-bold text-gray-900 font-heading">Pair {index + 1}</h4>
                  <span className="text-xs font-semibold text-gray-400">2/2 members</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {santa && (
                    <div className="border border-gray-150/40 bg-white rounded-2xl p-3 flex items-center gap-3 w-full shadow-sm">
                      <img
                        src={getGravatarUrl(santa.email, santa.name)}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
                      />
                      <div className="flex-grow min-w-0">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 capitalize">Giver (Santa)</span>
                        <h5 className="text-xs font-bold text-gray-900 mt-1 truncate capitalize font-heading">{santa.name}</h5>
                        {santa.email && <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">{santa.email}</p>}
                      </div>
                    </div>
                  )}
                  {receiver && (
                    <div className="border border-gray-150/40 bg-white rounded-2xl p-3 flex items-center gap-3 w-full shadow-sm">
                      <img
                        src={getGravatarUrl(receiver.email, receiver.name)}
                        alt="avatar"
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
                      />
                      <div className="flex-grow min-w-0">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#047857] border border-[#a7f3d0] capitalize">Recipient</span>
                        <h5 className="text-xs font-bold text-gray-900 mt-1 truncate capitalize font-heading">{receiver.name}</h5>
                        {receiver.email && <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">{receiver.email}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
