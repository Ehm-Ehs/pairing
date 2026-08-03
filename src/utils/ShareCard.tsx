import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { FaCheck, FaCopy } from "react-icons/fa";

interface ShareCardProps {
  index: number;
  originalIndex: number;
  isShortened: boolean;
  setIsShortened: (value: boolean) => void;
  handleShare: (index: number) => void;
  handleFormRedirect: (index: number) => void;
  isLoadingLink: number | null;
  isLoadingForm: number | null;
  copiedLink: number | null;
  copiedFormUrl: boolean;
}

const ShareCard = ({
  index,
  originalIndex,
  isShortened,
  setIsShortened,
  handleShare,
  handleFormRedirect,
  isLoadingLink,
  isLoadingForm,
  copiedLink,
  copiedFormUrl,
}: ShareCardProps) => {
  return (
    <Card className="bg-gradient-to-br from-[#3A76F0] to-[#4650E5] text-white border-0 mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Share Links</CardTitle>
            <CardDescription className="text-white/80">
              Share these links with participants
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
            <input
              type="checkbox"
              id={`shorten-${index}`}
              checked={isShortened}
              onChange={(e) => setIsShortened(e.target.checked)}
              className="w-4 h-4 rounded border-white/30 text-[#3A76F0] focus:ring-offset-0 focus:ring-white/50 bg-transparent"
            />
            <label
              htmlFor={`shorten-${index}`}
              className="text-sm font-medium text-white cursor-pointer select-none"
            >
              Shorten Links
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => handleShare(originalIndex)}
            variant="secondary"
            disabled={isLoadingLink === originalIndex}
            className="bg-white text-[#3A76F0] hover:bg-white/90 flex-1"
          >
            {isLoadingLink === originalIndex ? (
              <span className="flex items-center gap-1.5">
                <span>Copying</span>
                <span className="inline-flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 bg-[#3A76F0] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-[#3A76F0] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-[#3A76F0] rounded-full animate-bounce" />
                </span>
              </span>
            ) : copiedLink === originalIndex ? (
              <>
                <FaCheck className="w-4 h-4 mr-2" />
                Link Copied!
              </>
            ) : (
              <>
                <FaCopy className="w-4 h-4 mr-2" />
                Copy Share Link
              </>
            )}
          </Button>

          <Button
            onClick={() => handleFormRedirect(originalIndex)}
            variant="secondary"
            disabled={isLoadingForm === originalIndex}
            className="bg-white text-[#3A76F0] hover:bg-white/90 flex-1"
          >
            {isLoadingForm === originalIndex ? (
              <span className="flex items-center gap-1.5">
                <span>Copying</span>
                <span className="inline-flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 bg-[#3A76F0] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-[#3A76F0] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-[#3A76F0] rounded-full animate-bounce" />
                </span>
              </span>
            ) : copiedFormUrl ? (
              <>
                <FaCheck className="w-4 h-4 mr-2" />
                Form URL Copied!
              </>
            ) : (
              <>
                <FaCopy className="w-4 h-4 mr-2" />
                Copy Form URL
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareCard;
