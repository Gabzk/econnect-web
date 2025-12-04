import { useEffect, useState } from "react";

interface ShareButtonProps {
  title?: string;
  summary?: string;
  url: string;
}

export default function ShareButtonComponent({
  title,
  summary,
  url,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [isErrorAnimating, setIsErrorAnimating] = useState(false);
  const [errorUrl, setErrorUrl] = useState("");

  // Controla a animação de fade-in/fade-out do tooltip de erro
  useEffect(() => {
    if (showError) {
      setIsErrorVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsErrorAnimating(true);
        });
      });
    } else {
      setIsErrorAnimating(false);
      const timeout = setTimeout(() => setIsErrorVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [showError]);

  const handleShare = async () => {
    const shareUrl = url || window.location.href;

    const shareData = {
      title: title || "",
      text: summary || "",
      url: shareUrl,
    };

    // Verifica se Web Share API está disponível (requer HTTPS)
    if (
      typeof navigator !== "undefined" &&
      navigator.share &&
      window.isSecureContext
    ) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        // Usuário cancelou ou erro - tenta fallback
        console.error("Share canceled or failed:", error);
      }
    }

    // Fallback: tenta copiar para clipboard
    await copyToClipboard(shareUrl);
  };

  const copyToClipboard = async (text: string) => {
    // Tenta Clipboard API primeiro
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (error) {
        console.error("Clipboard API failed, trying fallback:", error);
      }
    }

    // Fallback com textarea
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    textArea.style.top = "auto";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      // Fallback for older browsers: document.execCommand('copy') is deprecated, but used here if Clipboard API is unavailable.
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Fallback copy failed:", error);
      // Mostra tooltip com o link para copiar manualmente
      setErrorUrl(text);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }

    document.body.removeChild(textArea);
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-1 text-gray-500 hover:text-green-600 transition-colors"
        title="Compartilhar"
        aria-label={copied ? "Link copiado" : "Compartilhar"}
      >
        {copied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
        )}
      </button>

      {/* Tooltip de erro com link para copiar */}
      {isErrorVisible && (
        <div
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 transition-opacity duration-200 ${
            isErrorAnimating ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg max-w-xs">
            <p className="mb-1 text-xs">
              Não foi possível copiar. Copie manualmente:
            </p>
            <input
              type="text"
              value={errorUrl}
              readOnly
              onClick={(e) => e.currentTarget.select()}
              className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border-none outline-none"
            />
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
}
