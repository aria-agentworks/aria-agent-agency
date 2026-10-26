import { useState, useEffect } from "react";
import { MessageCircle, X, Sparkles } from "lucide-react";
import { trackEvent } from "@/lib/store";

interface WhatsAppFloatProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export function WhatsAppFloat({
  phoneNumber = "919876543210",
  defaultMessage = "Hi Aria Agent Agency, I'm interested in automating my office workflows. Can you guide me?",
}: WhatsAppFloatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Show polite prompt badge after 5 seconds on first visit
    const timer = setTimeout(() => {
      if (!hasInteracted) {
        setIsOpen(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [hasInteracted]);

  const handleChatClick = () => {
    trackEvent("whatsapp_click", { page: window.location.pathname });
    const encodedMsg = encodeURIComponent(defaultMessage);
    const url = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodedMsg}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-auto">
      {isOpen && (
        <div
          role="dialog"
          aria-label="WhatsApp quick support"
          className="bg-card text-foreground border border-border shadow-2xl rounded-2xl p-4 max-w-xs animate-in fade-in slide-in-from-bottom-3 duration-300 relative"
          style={{
            boxShadow: "0 12px 36px -4px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.05)",
          }}
        >
          <button
            onClick={() => {
              setIsOpen(false);
              setHasInteracted(true);
            }}
            className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-secondary transition"
            aria-label="Close message"
          >
            <X size={15} />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Aria Live Support
            </span>
          </div>

          <p className="text-sm font-medium leading-snug mb-3">
            Looking for an automation tailored to your clinic, firm, or showroom?
          </p>

          <button
            onClick={handleChatClick}
            id="whatsapp-chat-button"
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition shadow-sm"
          >
            <MessageCircle size={15} />
            Chat on WhatsApp
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => {
          if (!isOpen) {
            handleChatClick();
          } else {
            setIsOpen(false);
          }
          setHasInteracted(true);
        }}
        id="whatsapp-float-trigger"
        aria-label="Contact Aria on WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          boxShadow: "0 8px 24px -2px rgba(37, 211, 102, 0.45), 0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <span className="sr-only">Chat on WhatsApp</span>
        <MessageCircle size={28} className="transition-transform group-hover:scale-110" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
        </span>
      </button>
    </div>
  );
}
