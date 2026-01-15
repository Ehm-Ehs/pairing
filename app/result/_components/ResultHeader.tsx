import { GroupingsPageProps } from "../../../src/types";

interface ResultHeaderProps {
  data: GroupingsPageProps;
  selectedIndex: number | null;
}

const ResultHeader = ({ data, selectedIndex }: ResultHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold font-heading">Pairing Results</h1>
    </div>
  );
};

export default ResultHeader;
