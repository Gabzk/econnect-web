import Image from "next/image";

type NewsCardComponentProps = {
  title?: string;
  summary?: string;
  imageUrl?: string;
  link?: string;
  date?: string;
  big?: boolean;
};

export default function NewsCardComponent({
  title,
  summary,
  imageUrl,
  link,
  date,
  big = false,
}: NewsCardComponentProps) {
  return (
    <div
      className={`flex flex-col w-full gap-4 border border-gray-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 ${big ? "md:flex-row" : ""}`}
    >
      <Image
        src={imageUrl ? imageUrl : "/tigreen.png"}
        alt={title ? title : "Imagem da Notícia"}
        width={big ? 600 : 400}
        height={big ? 400 : 250}
        className={`object-cover w-full ${big ? "md:w-1/2 h-64 md:h-80" : "h-48"}`}
      />
      <div
        className={`flex flex-col justify-between flex-1 p-4 ${big ? "md:p-6" : ""}`}
      >
        <div>
          <a
            href={link}
            className={`font-semibold text-gray-800 mb-2 block hover:text-blue-600 transition-colors ${big ? "text-2xl md:text-3xl" : "text-lg"}`}
          >
            {title ? title : "Título da Notícia"}
          </a>
          <p
            className={`text-gray-600 mb-4 line-clamp-3 ${big ? "text-base md:text-lg" : "text-sm"}`}
          >
            {summary ? summary : "Resumo da notícia..."}
          </p>
        </div>

        <time
          className={`text-gray-500 block ${big ? "text-base" : "text-sm"}`}
        >
          {date ? date : "Data da notícia"}
        </time>
      </div>
    </div>
  );
}
