import Logo from "./Logo";

export default function Header() {
  return (
    <header
      className="flex flex-col items-center px-4 py-6 sm:px-6 sm:py-7"
      style={{ background: "#0a0a0a", borderBottom: "1px solid var(--color-accent)" }}
    >
      <Logo />
    </header>
  );
}
