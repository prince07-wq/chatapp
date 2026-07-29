import AppleSpinner from "../components/UI/AppleSpinner.jsx";

export default function RouteLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper dark:bg-ink">
      <AppleSpinner
        size={30}
        className="text-grey dark:text-grey-light"
      />
    </main>
  );
}