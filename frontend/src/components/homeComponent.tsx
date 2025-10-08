import HighlightComponent from "./highlightComponent";

export default function HomeComponent() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-emerald-700 text-center mt-12">
        Econnect
      </h1>

      <HighlightComponent title="Notícias mais curtidas" />

      <HighlightComponent title="Últimas Notícias" />
    </div>
  );
}

