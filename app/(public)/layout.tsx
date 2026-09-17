import PublicNavbar from "@/components/shared/PublicNavbar";
import Footer from "@/components/shared/Footer";

/* ---------------------------------------------------------------
   Public Layout — wraps /, /verify, /verify/report
   ❌ No wallet UI anywhere in this layout (hard rule #2)
   ❌ No blockchain jargon (hard rule #3)
----------------------------------------------------------------*/

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNavbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
