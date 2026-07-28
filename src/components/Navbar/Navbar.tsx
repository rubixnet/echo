import DesktopNavbar from "@/components/Navbar/DesktopNavbar";
import MobileNavbar from "@/components/Navbar/MobileNavbar";

export default function Navbar() {
    return (
        <>
            <header className="hidden md:block fixed top-0 left-0 right-0 z-50 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-20 backdrop-blur-sm backdrop-saturate-200 [-webkit-mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)] pointer-events-none -z-20" />
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background/60 via-background/20 to-transparent pointer-events-none -z-10" />
                <div className="relative w-full pointer-events-auto pt-1">
                    <DesktopNavbar />
                </div>
            </header>
            
            <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-24 backdrop-blur-sm backdrop-saturate-200 [-webkit-mask-image:linear-gradient(to_top,black_50%,transparent_100%)] [mask-image:linear-gradient(to_top,black_50%,transparent_100%)] pointer-events-none -z-20" />
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/60 via-background/20 to-transparent pointer-events-none -z-10" />
                <div className="relative w-full pointer-events-auto pb-1">
                    <MobileNavbar />
                </div>
            </div>
        </>
    );
}
