import  DesktopNavbar  from "@/components/Navbar/DesktopNavbar";
import MobileNavbar  from "@/components/Navbar/MobileNavbar";

export default function Navbar() {
    return (
        <>
            <header className="hidden md:block fixed top-0 w-full h-16 z-50"> 
                <DesktopNavbar />
            </header>

            <div className="block md:hiddne z-50">
                <MobileNavbar />
            </div>

        </>

    )
}