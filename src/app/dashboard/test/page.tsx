import Image from "next/image";
export default function Test() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-4xl font-bold text-neutral-950">Test</h1>
      <p className="text-lg text-neutral-500">This is a test page</p>
      <Image width={500} height={500} unoptimized
        src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256"
        alt="Cover"
        className="w-[100vw] h-[100vh] rounded-lg object-cover shadow-sm border border-neutral-200"
      />
    </div>
  );
}
