/**
 * @file About.tsx
 * @description Página "Sobre Nosotros" moderna con iconos y equipo centrado.
 */

import { MdOutlineTrackChanges, MdOutlineVisibility } from "react-icons/md";
import { LuGem } from "react-icons/lu";

export default function About() {
  const team = [
    {
      name: "Juan Esteban Agudelo",
      role: "Product Owner & Frontend",
      img: "https://i.pravatar.cc/300?img=12",
    },
    {
      name: "Juan Carlos Villa",
      role: "Backend Developer",
      img: "https://i.pravatar.cc/300?img=30",
    },
    {
      name: "Axel David Rubianes",
      role: "Database Manager",
      img: "https://i.pravatar.cc/300?img=15",
    },
    {
      name: "Juan José Flórez",
      role: "Project Manager",
      img: "https://i.pravatar.cc/300?img=20",
    },
    {
      name: "Carlos Daniel Salinas",
      role: "Tester",
      img: "https://i.pravatar.cc/300?img=25",
    },
  ];

  return (
    <section className="min-h-screen bg-gray-100 px-4 md:px-10 py-16 flex flex-col items-center">
      {/* TÍTULO PRINCIPAL */}
      <h1 className="text-3xl md:text-4xl font-semibold text-blue-700 mb-4 text-center">
        Sobre ChatTeam
      </h1>

      <p className="text-gray-700 max-w-3xl text-center text-lg leading-relaxed mb-16">
        ChatTeam es una aplicación web diseñada para conectar personas mediante videollamadas 
        seguras, simples y accesibles. Nuestro objetivo es ofrecer una experiencia clara, rápida 
        y confiable para facilitar la comunicación estés donde estés.
      </p>

      {/* MISIÓN / VISIÓN / VALORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mb-20">
        
        <div className="bg-white shadow-md rounded-xl p-8 text-center hover:shadow-lg transition">
          <MdOutlineTrackChanges className="text-blue-600 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-blue-700">Nuestra Misión</h3>
          <p className="text-gray-700">
            Brindar una plataforma de comunicación estable, accesible y moderna que conecte a las personas de manera sencilla y segura.
          </p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-8 text-center hover:shadow-lg transition">
          <MdOutlineVisibility className="text-blue-600 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-blue-700">Nuestra Visión</h3>
          <p className="text-gray-700">
            Ser una de las mejores herramientas de comunicación web, enfocada en 
            accesibilidad, rapidez y calidad de experiencia para nuestros usuarios.
          </p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-8 text-center hover:shadow-lg transition">
          <LuGem className="text-blue-600 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-blue-700">Nuestros Valores</h3>
          <p className="text-gray-700">
            Trabajo en equipo, responsabilidad, aprendizaje continuo y compromiso con 
            ofrecer software de alta calidad.
          </p>
        </div>
      </div>

      {/* EQUIPO */}
      <h2 className="text-3xl font-semibold text-blue-700 mb-10 text-center">
        Nuestro Equipo
      </h2>

      <div className="
        grid grid-cols-1 
        sm:grid-cols-2 
        lg:grid-cols-3 
        gap-10 
        w-full max-w-6xl 
        pb-20 
        justify-items-center
      ">
        {team.map((member) => (
          <div
            key={member.name}
            className="bg-white p-6 rounded-xl shadow-md text-center hover:shadow-xl transition relative w-72"
          >
            <div className="relative w-32 h-32 mx-auto mb-4 group">
              <img
                src={member.img}
                alt={member.name}
                className="w-full h-full object-cover rounded-full border-4 border-blue-600 shadow"
              />

              <div className="
                absolute inset-0 bg-blue-700 bg-opacity-75 rounded-full 
                flex items-center justify-center text-white text-sm font-medium 
                opacity-0 group-hover:opacity-100 
                transition-opacity duration-300
              ">
                {member.role}
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800">{member.name}</h3>
            <p className="text-blue-600 mt-1 font-medium">{member.role}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
