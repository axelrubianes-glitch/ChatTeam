/**
 * @file Meeting.tsx
 * @description Interfaz exploratoria de videollamadas estilo ChatTeam — Figma Exacto + Animaciones iOS.
 */

import {
  TbMicrophone,
  TbMicrophoneOff,
  TbCamera,
  TbMessageCircle,
  TbPhoneOff
} from "react-icons/tb";

export default function Meeting() {
  const users = [
    { name: "Juan", active: false },
    { name: "Héctor", active: false },
    { name: "Jorge", active: true },
    { name: "Daniel", active: false },
    { name: "Amanda", active: false },
    { name: "Ximena", active: true },
  ];

  return (
    <div className="relative flex min-h-screen bg-gray-100 text-gray-800">

      {/* ===================== GRID IZQUIERDA ===================== */}
      <div className="
        flex-1 
        pt-20 px-6 pb-40
        grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 
        gap-x-6 gap-y-6
      ">
        {users.map((u, i) => (
          <div
            key={i}
            className={`
              relative rounded-xl shadow-lg 
              flex items-end p-3 text-sm font-medium
              h-[220px]
              ${u.active ? "bg-[#2F3B55] text-white" : "bg-gray-200 text-gray-600"}
            `}
          >
            {/* Nombre */}
            <span className="absolute bottom-3 left-3 text-sm">
              {u.name}
            </span>

            {/* Mic Icon */}
            <span className="absolute bottom-3 right-3 opacity-80">
              {u.active ? (
                <TbMicrophone className="w-5 h-5 text-white" />
              ) : (
                <TbMicrophoneOff className="w-5 h-5" />
              )}
            </span>
          </div>
        ))}
      </div>

     {/* ===================== PANEL DERECHA (Solo Chat) ===================== */}
<div className="w-[380px] bg-white border-l border-gray-300 flex flex-col">

  {/* CHAT */}
  <div className="flex-1 p-4 pb-20 flex flex-col">
    <h2 className="text-lg font-semibold text-blue-700 mb-3">Chat</h2>

    <div className="flex-1 overflow-y-auto space-y-1 pr-2 pb-16">

      <div className="bg-gray-100 p-2 rounded-lg w-fit">
        <strong>Jorge:</strong> Ya estoy conectado.
      </div>

      <div className="bg-blue-600 text-white p-2 rounded-lg w-fit ml-auto">
        Perfecto, iniciemos.
      </div>
    </div>

    {/* INPUT */}
    <div className="mt-3 flex gap-2">
      <input
        type="text"
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        placeholder="Escribe un mensaje..."
      />
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Enviar
      </button>
    </div>
  </div>
</div>


      {/* ===================== BARRA DE CONTROLES CENTRADA EN AREA IZQUIERDA ===================== */}
      <div className="absolute bottom-16 left-0 w-[calc(100%-380px)] flex justify-center pointer-events-none">

        <div className="
          bg-white shadow-xl rounded-2xl 
          px-8 py-3 flex items-center gap-8
          border border-gray-200
          pointer-events-auto
        ">
          {/* MIC */}
          <button className="p-2 rounded-lg ios-hover ios-press hover:bg-gray-100 transition">
            <TbMicrophone className="w-6 h-6 text-gray-700" />
          </button>

          {/* CAMERA */}
          <button className="p-2 rounded-lg ios-hover ios-press hover:bg-gray-100 transition">
            <TbCamera className="w-6 h-6 text-gray-700" />
          </button>

          {/* CHAT */}
          <button className="p-2 rounded-lg ios-hover ios-press hover:bg-gray-100 transition">
            <TbMessageCircle className="w-6 h-6 text-gray-700" />
          </button>

          {/* FINALIZAR */}
          <button className="
            px-5 py-2 bg-red-600 text-white rounded-lg 
            hover:bg-red-700 transition flex items-center gap-2
            ios-hover ios-press
          ">
            <TbPhoneOff className="w-5 h-5" />
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
