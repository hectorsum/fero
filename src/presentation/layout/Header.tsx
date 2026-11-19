import Logo from "./Logo";

export default function Header() {
  return (
    <header className="bg-cover bg-center flex flex-col items-center px-4 pt-7 pb-6 sm:px-6 sm:pt-9 sm:pb-[30px] relative">
      <img className="absolute top-0 w-full h-full object-cover" src="/photo-banner.avif" alt="Foto de la barbería" />
      <div className="absolute top-0 w-full h-full bg-[#0e0c09] opacity-75"></div>
      <Logo />
    </header>
  );
}
