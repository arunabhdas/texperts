import dynamic from "next/dynamic";

const SimulationApp = dynamic(() => import("@/components/SimulationApp"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen text-gray-400">
      Loading simulation...
    </div>
  ),
});

export default function Home() {
  return <SimulationApp />;
}
