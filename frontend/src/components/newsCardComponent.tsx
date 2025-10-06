import Image from "next/image";

type NewsCardComponentProps = {
  title: string;
  summary: string;
  imageUrl: string;
  link: string;
  date: string;
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
      className={`flex ${big ? "flex-col" : "flex-row"} gap-4 border border-gray-300 rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition-shadow duration-300`}
    >
      <Image
        src={imageUrl}
        alt={title}
        width={big ? 800 : 192}
        height={big ? 384 : 192}
        className={`object-cover rounded-md ${big ? "w-full h-96" : "w-48 h-48"}`}
      />
      <div
        className={`flex flex-col justify-between flex-1 ${big ? "" : "h-48"}`}
      >
        <div>
          <a
            href={link}
            className={`font-semibold text-gray-800 mb-2 block ${big ? "text-3xl" : "text-xl"}`}
          >
            {title ? title : "Título da Notícia"}
          </a>
          <p className={`text-gray-600 mb-4 ${big ? "text-lg" : "text-base"}`}>
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
