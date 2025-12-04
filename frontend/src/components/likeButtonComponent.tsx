"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface LikeButtonComponentProps {
  newsId: number;
  initialLiked?: boolean;
  initialLikes?: number;
}

export default function LikeButtonComponent({
  newsId,
  initialLiked = false,
  initialLikes = 0,
}: LikeButtonComponentProps) {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState("");

  // Controla a animação de fade-in/fade-out
  useEffect(() => {
    const shouldShow = showTooltip || showError;
    if (shouldShow) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timeout = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [showTooltip, showError]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      setTooltipMessage("Faça login para curtir");
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/news/handle-like/${newsId}`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikes(data.likes);
      } else {
        setTooltipMessage("Erro ao curtir. Tente novamente.");
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
      }
    } catch (error) {
      console.error("Erro ao curtir:", error);
      setTooltipMessage("Erro de conexão. Tente novamente.");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleLike}
        disabled={isLoading}
        className={`flex items-center gap-1 transition-colors ${
          liked
            ? "text-red-500 hover:text-red-600"
            : "text-gray-500 hover:text-red-500"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label={liked ? "Descurtir" : "Curtir"}
      >
        {liked ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
        {likes > 0 && <span className="text-sm">{likes}</span>}
      </button>

      {/* Tooltip */}
      {isVisible && (
        <div
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 transition-opacity duration-200 ${
            isAnimating ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`text-white text-sm rounded-lg px-3 py-2 shadow-lg whitespace-nowrap ${
              showError ? "bg-red-600" : "bg-gray-800"
            }`}
          >
            <p>{tooltipMessage}</p>
          </div>
          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${
              showError ? "border-t-red-600" : "border-t-gray-800"
            }`}
          />
        </div>
      )}
    </div>
  );
}
