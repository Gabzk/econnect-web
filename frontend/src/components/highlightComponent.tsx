import NewsCardComponent from "./newsCardComponent";

type HighlightComponentProps = {
  title?: string;
};

export default function HighlightComponent({ title }: HighlightComponentProps) {
  return (
    <section className="my-12 px-16">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        {title ? title : "Titulo do Destaque"}
      </h2>
      <div className="flex gap-4">
        {/* Card grande em destaque à esquerda */}
        <div className="flex-1">
          <NewsCardComponent
            big={true}
            title="Título da Notícia em Destaque"
            summary="Este é um resumo mais detalhado da notícia em destaque que aparece no card grande."
            imageUrl="/tigreen.png"
            link="#"
            date="05 de Outubro, 2025"
          />
        </div>

        {/* Grid 2x2 de cards menores à direita */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <NewsCardComponent
            title="Notícia 1"
            summary="Resumo da notícia 1"
            imageUrl="/tigreen.png"
            link="#"
            date="05 de Outubro, 2025"
          />
          <NewsCardComponent
            title="Notícia 2"
            summary="Resumo da notícia 2"
            imageUrl="/tigreen.png"
            link="#"
            date="05 de Outubro, 2025"
          />
          <NewsCardComponent
            title="Notícia 3"
            summary="Resumo da notícia 3"
            imageUrl="/tigreen.png"
            link="#"
            date="05 de Outubro, 2025"
          />
          <NewsCardComponent
            title="Notícia 4"
            summary="Resumo da notícia 4"
            imageUrl="/tigreen.png"
            link="#"
            date="05 de Outubro, 2025"
          />
        </div>
      </div>
    </section>
  );
}
