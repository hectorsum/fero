import Header from "@/presentation/layout/Header";
import Sidebar from "@/presentation/layout/Sidebar";
import Footer from "@/presentation/layout/Footer";
import BookingWizard from "@/presentation/booking/BookingWizard";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      <Header />
      <main className="flex-1 flex justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-6 lg:pt-12 lg:pb-[72px]">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-10 lg:gap-11 items-start">
          <BookingWizard />
          <Sidebar />
        </div>
      </main>
      <Footer />
    </div>
  );
}
