import YTMusic from "ytmusic-api";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ytmusic = new YTMusic();
  await ytmusic.initialize();
  const song = await ytmusic.getSong(id).catch(() => null);

  if (!song) notFound();

  const thumbnail =
    song.thumbnails?.[song.thumbnails.length - 1]?.url ||
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  return (
    <div className="p-8">
      <Image src={thumbnail} alt={song.name} width={300} height={300} priority unoptimized />
      <h1 className="text-3xl font-bold mt-4">{song.name}</h1>
      <p className="text-neutral-400">{song.artist?.name}</p>
    </div>
  );
}