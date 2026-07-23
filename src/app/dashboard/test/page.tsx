import Image from "next/image";

export default function Test() {
    return (
            <Image src="/test.png" width={10000} height={10000} alt="Cover" className="w-[100vw] h-[130vh] rounded-lg object-cover shadow-sm border border-neutral-200" />

    );
}