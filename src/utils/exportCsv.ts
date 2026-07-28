import { toast } from "react-toastify";
import { SecretSantaPairing } from "../types";

export function exportSecretSantaCsv(pairing: SecretSantaPairing) {
  const participantsList = pairing.participants || [];
  if (participantsList.length === 0) {
    toast.info("No participants to export.");
    return;
  }
  
  try {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Email,Wishlist,Assignment\n";

    participantsList.forEach((p) => {
      let assignmentName = "Not Assigned Yet";
      
      if (pairing.config?.allowWishlist === false) {
        const partner = pairing.participants?.find(
          (other) => other.pairIndex === p.pairIndex && other.id !== p.id
        );
        assignmentName = partner 
          ? `Paired with ${partner.name} (Pair ${(p.pairIndex ?? 0) + 1})` 
          : `Awaiting partner (Pair ${(p.pairIndex ?? 0) + 1})`;
      } else if (pairing.status === "locked" && pairing.pairs) {
        const pair = pairing.pairs.find(pair => pair.santaId === p.id);
        const receiver = pair && pairing.participants?.find(r => r.id === pair.receiverId);
        if (receiver) {
          assignmentName = receiver.name || "";
        }
      }
      
      csvContent += `"${p.name}","${p.email || ""}","${p.wishlist || ""}","${assignmentName}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${pairing.groupingPurpose?.replace(/\s+/g, "_") || 'event'}_participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Participants list exported!");
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Failed to export participants.");
  }
}
