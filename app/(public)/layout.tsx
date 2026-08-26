// Public layout shell — no wallet UI, no sidebar, no blockchain terminology
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Public navigation — no WalletConnectButton here, ever */}
      <header>
        <nav>
          <span>MedTrace</span>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
