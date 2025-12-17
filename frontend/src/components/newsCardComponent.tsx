import Image from "next/image";
import LikeButtonComponent from "./likeButtonComponent";
import ShareButtonComponent from "./shareButtonComponent";

type NewsCardComponentProps = {
  title?: string;
  summary?: string;
  imageUrl?: string;
  link?: string;
  date?: string;
  big?: boolean;
  id: number;
  likes?: number;
  liked?: boolean;
  priority?: boolean;
};

export default function NewsCardComponent({
  title,
  summary,
  imageUrl,
  link,
  date,
  big = false,
  id,
  likes = 0,
  liked = false,
  priority = false,
}: NewsCardComponentProps) {
  return (
    <div
      className={`flex flex-col w-full gap-4 border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 ${big ? "md:flex-row" : ""}`}
    >
      <div
        className={`overflow-hidden ${big ? "md:w-1/2 rounded-t-lg md:rounded-l-lg md:rounded-tr-none" : "rounded-t-lg"}`}
      >
        <Image
          src={imageUrl ? imageUrl : "/tigreen.png"}
          alt={title ? title : "Imagem da Notícia"}
          width={big ? 600 : 400}
          height={big ? 400 : 250}
          priority={priority}
          className={`object-cover w-full ${big ? "h-64 md:h-80" : "h-48"}`}
        />
      </div>
      <div
        className={`flex flex-col justify-between flex-1 p-4 ${big ? "md:p-6" : ""}`}
      >
        <div>
          {/* Título da notícia */}
          <a
            href={link}
            className={`font-semibold text-gray-800 mb-2 block hover:text-blue-600 transition-colors ${big ? "text-2xl md:text-3xl" : "text-lg"}`}
          >
            {title ? title : "Título da Notícia"}
          </a>

          {/* Resumo da notícia */}
          <p
            className={`text-gray-600 mb-4 line-clamp-3 ${big ? "text-base md:text-lg" : "text-sm"}`}
          >
            {summary ? summary : "Resumo da notícia..."}
          </p>
        </div>

        {/* Data da notícia */}
        <footer className="flex flex-row justify-between items-center">
          <time
            className={`text-gray-500 block ${big ? "text-base" : "text-sm"}`}
          >
            {date ? date : "Data da notícia"}
          </time>

          <div className="flex flex-row gap-4">
            <ShareButtonComponent
              title={title}
              summary={summary}
              url={link || ""}
            />
            <LikeButtonComponent
              newsId={id}
              initialLikes={likes}
              initialLiked={liked}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
