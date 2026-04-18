import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "Cura — Cloud Medical Consultation Platform";
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex flex-col">
      {/* Top info strip */}
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            🩺
          </div>
          <span className="font-bold tracking-tight">Cura</span>
          <span className="text-white/50 hidden sm:inline">— Cloud Medical Consultation Platform</span>
        </div>
        <div className="text-white/60 text-xs hidden md:block">
          Crafted by <span className="text-cyan-300 font-semibold">Sharon</span>,{" "}
          <span className="text-cyan-300 font-semibold">Aaron</span> &{" "}
          <span className="text-cyan-300 font-semibold">Sam</span>
        </div>
      </div>

      {/* Embedded site */}
      <iframe
        src="/cura/index.html"
        title="Cura Platform"
        className="flex-1 w-full border-0"
        style={{ minHeight: "calc(100vh - 49px)" }}
      />
    </div>
  );
};

export default Index;
