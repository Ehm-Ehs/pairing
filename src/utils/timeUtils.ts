export const getParticipantJoinedTime = (participantId: string, createdAt: any, index: number) => {
  try {
    const baseTime = createdAt?.seconds 
      ? createdAt.seconds * 1000 
      : typeof createdAt === "number" 
        ? createdAt 
        : Date.now() - 3600000;
    
    let offsetMinutes = (index + 1) * 8;
    if (isNaN(offsetMinutes)) offsetMinutes = 15;
    
    const joinedTimestamp = baseTime + (offsetMinutes * 60 * 1000);
    const finalTimestamp = Math.min(joinedTimestamp, Date.now() - 60000);
    
    const diffMs = Date.now() - finalTimestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    
    const date = new Date(finalTimestamp);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Recent";
  }
};
