import QRCodeGenerator from "@/components/QRCodeGenerator";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <h1 className="sr-only">Custom QR Code Generator</h1>

      <main className="max-w-7xl mx-auto">
        <QRCodeGenerator />
      </main>

      <footer className="max-w-7xl mx-auto mt-12 text-center text-zinc-400 dark:text-zinc-600 text-xs sm:text-sm font-medium">
        <p suppressHydrationWarning>&copy; {new Date().getFullYear()} Pacifico Oyanib QRCode. Built with Next.js and qr-code-styling.</p>
      </footer>
    </div>
  );
}
