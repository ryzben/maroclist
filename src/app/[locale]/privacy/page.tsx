import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Privacy Policy" };
}

export default async function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white min-h-screen">
        <div className="container-page py-16 max-w-3xl">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: April 2025</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">1. Who we are</h2>
              <p>
                Maroclist (<strong>maroclist.com</strong>) is a real estate marketplace connecting buyers and
                sellers in Morocco, with a focus on international buyers in the United States and Canada.
                For questions, contact us at <a href="mailto:contact@maroclist.com" className="text-orange-500 hover:underline">contact@maroclist.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">2. What we collect</h2>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Account information:</strong> name and email address when you sign up.</li>
                <li><strong>Listing information:</strong> property details, photos, and contact phone number you submit.</li>
                <li><strong>Messages:</strong> content sent via the contact form on listing pages.</li>
                <li><strong>Usage data:</strong> pages visited, browser type, and IP address (via standard server logs).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">3. How we use your data</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>To display your listings to potential buyers.</li>
                <li>To forward contact messages to listing owners.</li>
                <li>To manage your account and send password reset emails.</li>
                <li>To improve the platform and fix issues.</li>
              </ul>
              <p className="mt-2">We do not sell your personal data to third parties.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">4. Data storage</h2>
              <p>
                Your data is stored securely via <strong>Supabase</strong> (PostgreSQL database) and
                images are stored in Supabase Storage. Data is hosted on servers in the EU/US region.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">5. Your rights</h2>
              <p>
                You can request deletion of your account and all associated data at any time by emailing{" "}
                <a href="mailto:contact@maroclist.com" className="text-orange-500 hover:underline">contact@maroclist.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">6. Cookies</h2>
              <p>
                We use only essential session cookies required for authentication. We do not use
                advertising or tracking cookies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-2">7. Changes</h2>
              <p>
                We may update this policy as the platform evolves. The date at the top of this page
                reflects the most recent revision.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
