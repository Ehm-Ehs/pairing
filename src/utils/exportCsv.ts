import { toast } from "react-toastify";
import { SecretSantaPairing, RoleBasedPairing } from "../types";

export function exportSecretSantaCsv(pairing: SecretSantaPairing) {
  const participantsList = pairing.participants || [];
  if (participantsList.length === 0) {
    toast.info("No participants to export.");
    return;
  }
  
  try {
    let csvContent = "Name,Email,Wishlist,Assignment\n";

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

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
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

export function exportGroupPairsCsv(pairing: RoleBasedPairing) {
  try {
    let csvContent = "Group,Slot Number,Role,Name,Email\n";

    Object.entries(pairing.groups || {}).forEach(([groupKey, group]: [string, any]) => {
      if (Array.isArray(group)) {
        group.forEach((member: any) => {
          const name = member.name || "Available Slot";
          const email = member.email || "";
          csvContent += `"Group ${parseInt(groupKey) + 1}",${member.number},"${member.role}","${name}","${email}"\n`;
        });
      }
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${pairing.groupingPurpose?.replace(/\s+/g, "_") || "event"}_group_pairings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Group pairings exported!");
  } catch (err) {
    console.error("Failed to export CSV:", err);
    toast.error("Failed to export group pairings CSV.");
  }
}
