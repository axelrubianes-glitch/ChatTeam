/**
 * @file About.tsx
 * @description Página "Sobre nosotros" traducida y centrada.
 */

export default function About() {
  return (
    <section className="flex justify-center items-center min-h-screen bg-gray-100 px-4 md:px-6">
      <div className="flex flex-col justify-center items-center w-full max-w-2xl text-center py-12">
        <h1 className="text-3xl md:text-4xl font-semibold text-blue-700 mb-6">
          Sobre ChatTeam
        </h1>
        <p className="text-gray-700 leading-relaxed text-lg">
          ChatTeam es una aplicación web diseñada para conectar personas mediante videollamadas seguras,
          simples y accesibles. Nuestra misión es hacer que la comunicación sea fácil y rápida, estés donde estés.
        </p>
      </div>
    </section>
  );
}
