import QRCodeGenerator from "@/components/QRCodeGenerator";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <header className="max-w-6xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white sm:text-5xl tracking-tight">
          Custom QR Code Generator
        </h1>
        <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Create beautiful, fully customizable QR codes for your brand. 
          Adjust colors, styles, and add your logo in seconds.
        </p>
      </header>

      <main>
        <QRCodeGenerator />
      </main>

      <footer className="max-w-6xl mx-auto mt-16 text-center text-zinc-500 dark:text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} QR Code Styling App. Built with Next.js and qr-code-styling.</p>
      </footer>
    </div>
  );
}
