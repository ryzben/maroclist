import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Terms of Service" };
}

export default async function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white min-h-screen">
        <div className="container-page py-16 max-w-3xl">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: April 2025</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">1. Acceptance</h2>
              <p>
                By using Maroclist (<strong>maroclist.com</strong>), you agree to these Terms of Service.
                If you do not agree, please do not use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">2. What Maroclist is</h2>
              <p>
                Maroclist is a listing platform that allows users to post and browse real estate in
                Morocco. We are not a real estate agency. We do not represent buyers or sellers and
                are not responsible for transactions between users.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">3. User accounts</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>You must provide accurate information when creating an account.</li>
                <li>You are responsible for keeping your password secure.</li>
                <li>You may not create accounts for others without their permission.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">4. Listing rules</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>You may only post real properties that you own or are authorized to advertise.</li>
                <li>Listings must be accurate — no misleading descriptions, false photos, or fake prices.</li>
                <li>Duplicate listings and spam are not allowed.</li>
                <li>We reserve the right to remove any listing that violates these rules.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">5. Prohibited use</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Scraping or automated data collection from the platform.</li>
                <li>Using the platform for fraud, scams, or illegal activity.</li>
                <li>Posting content that is offensive, discriminatory, or unlawful.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">6. Limitation of liability</h2>
              <p>
                Maroclist is provided &quot;as is&quot;. We do not guarantee the accuracy of listings or the
                outcome of any transaction. We are not liable for any loss or damage arising from
                use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">7. Contact</h2>
              <p>
                Questions about these terms? Email us at{" "}
                <a href="mailto:contact@maroclist.com" className="text-orange-500 hover:underline">
                  contact@maroclist.com
                </a>.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
