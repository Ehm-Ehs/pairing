import Link from "next/link";
import { FaHouse, FaGhost } from "react-icons/fa6";
import { StatusPage, STATUS_PRIMARY_ACTION } from "@/components/layout/StatusPage";

export default function NotFound() {
  return (
    <StatusPage
      icon={<FaGhost size={28} />}
      badge="404 Page Not Found"
      title="Page Not Found"
      message="Whoops! The page you're looking for doesn't exist or may have moved."
    >
      <Link href="/" className={STATUS_PRIMARY_ACTION}>
        <FaHouse size={14} />
        <span>Take Me Home</span>
      </Link>
    </StatusPage>
  );
}
