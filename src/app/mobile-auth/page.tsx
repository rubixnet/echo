import MobileAuthFallback from "@/components/auth/MobileAuthFallback";

export default async function MobileAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; state?: string }>;
}) {
  const { code = "", state = "" } = await searchParams;
  return <MobileAuthFallback code={code} state={state} />;
}
