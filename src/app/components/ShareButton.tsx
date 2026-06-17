"use client";

import { useCallback } from "react";
import { Share2 } from "lucide-react";


export default function ShareButton({ event }: { event: any }) {
  const handleShare = useCallback(() => {
    const shareData = {
      title: event.title,
      text: `Chai and Bae presents you all girls event: ${event.title}`,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/#upcoming`,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareData.url).then(() => {
        alert("Link copied to clipboard");
      });
    }
  }, [event]);

  return (
    <>
      <button
        onClick={handleShare}
        className="meta-icon"
        aria-label="Share"
      >

        <Share2 size={18} />
      </button>
    </>
  );
}
