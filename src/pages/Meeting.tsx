/**
 * @file Meeting.tsx
 * @description Interfaz exploratoria de videollamadas estilo ChatTeam — vista de reunión con un solo participante principal (Jorge) y chat a la derecha.
 */

import {
  TbMicrophone,
  TbCamera,
  TbMessageCircle,
  TbPhoneOff,
} from "react-icons/tb";

export default function Meeting() {
  const mainUser = { name: "Jorge" };

  return (
    <div className="relative flex min-h-screen bg-gray-100 text-gray-800">
      {/* ===================== PANEL IZQUIERDO: STREAMING PRINCIPAL ===================== */}
      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <div
          className="
            relative 
            w-full max-w-5xl 
            h-[65vh] 
            rounded-2xl 
            shadow-2xl 
            bg-[#2F3B55] 
            text-white 
            flex items-end 
            p-6
          "
        >
          {/* Nombre */}
          <span className="absolute bottom-4 left-6 text-sm font-medium">
            {mainUser.name}
          </span>

          {/* Mic Icon */}
          <span className="absolute bottom-4 right-6 opacity-90">
            <TbMicrophone className="w-5 h-5 text-white" />
          </span>
        </div>
      </div>

      {/* ===================== PANEL DERECHA: CHAT (solo en desktop) ===================== */}
      <div
        className="
        hidden 
        lg:flex 
        w-[380px] 
        bg-white 
        border-l border-gray-300 
        flex-col
      "
      >
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

      {/* ===================== BARRA DE CONTROLES CENTRADA ===================== */}
      <div
        className="
        fixed bottom-6 
        left-1/2 -translate-x-1/2 
        w-full lg:w-[calc(100%-380px)]
        flex justify-center 
        pointer-events-none
        px-4
      "
      >
        <div
          className="
          bg-white shadow-xl rounded-2xl 
          px-8 py-3 flex items-center gap-8
          border border-gray-200
          pointer-events-auto
        "
        >
          {/* MIC */}
          <button className="p-2 rounded-lg hover:bg-gray-100 transition">
            <TbMicrophone className="w-6 h-6 text-gray-700" />
          </button>

          {/* CAMERA */}
          <button className="p-2 rounded-lg hover:bg-gray-100 transition">
            <TbCamera className="w-6 h-6 text-gray-700" />
          </button>

          {/* CHAT */}
          <button className="p-2 rounded-lg hover:bg-gray-100 transition">
            <TbMessageCircle className="w-6 h-6 text-gray-700" />
          </button>

          {/* FINALIZAR */}
          <button
            className="
            px-5 py-2 bg-red-600 text-white rounded-lg 
            hover:bg-red-700 transition flex items-center gap-2
          "
          >
            <TbPhoneOff className="w-5 h-5" />
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
