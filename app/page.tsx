import QRCodeGenerator from "@/components/QRCodeGenerator";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <h1 className="sr-only">Custom QR Code Generator</h1>

      <main>
        <QRCodeGenerator />
      </main>

      <footer className="max-w-6xl mx-auto mt-16 text-center text-zinc-500 dark:text-zinc-500 text-sm">
        <p suppressHydrationWarning>&copy; {new Date().getFullYear()} Pacifico Oyanib QRCode. Built with Next.js and qr-code-styling.</p>
      </footer>
    </div>
  );
}
