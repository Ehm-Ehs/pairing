import { useRouter } from "next/navigation";

export const useHomeActions = () => {
  const router = useRouter();

  const handleCreateNew = () => {
    router.push("/create-event");
  };

  const handleShare = (target: number | string, eventObj?: { id?: string }) => {
    if (typeof target === "string") {
      router.push(`/your-pairing?id=${target}`);
    } else if (eventObj && eventObj.id) {
      router.push(`/your-pairing?id=${eventObj.id}`);
    } else {
      router.push(`/your-pairing?index=${target}`);
    }
  };

  return { handleCreateNew, handleShare };
};
