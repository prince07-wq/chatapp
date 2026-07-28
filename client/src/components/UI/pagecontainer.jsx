export default function PageContainer({ children }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      {children}
    </main>
  );
}