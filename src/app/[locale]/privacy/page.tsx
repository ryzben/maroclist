import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CookieSettingsButton } from "@/components/ConsentBanner";
import { analyticsConfig } from "@/lib/analytics";
import { localeAlternates } from "@/lib/seo";

type Locale = "fr" | "en" | "ar";
const CONTACT = "contact@maroclist.com";

interface Copy {
  title: string;
  updated: string;
  sections: { h: string; p?: string[]; list?: string[] }[];
  trackersH: string;
  trackersIntro: string;
  noTrackers: string;
  cols: [string, string, string, string];
  rows: {
    auth: [string, string, string]; lang: [string, string, string]; consent: [string, string, string];
    attribution: [string, string, string]; ga: [string, string, string]; gads: [string, string, string];
    meta: [string, string, string]; plausible: [string, string, string];
  };
  changeH: string;
  changeP: string;
  rightsH: string;
  rights: string[];
  complaints: string;
  lastH: string;
  lastP: string;
}

// Arabic: Modern Standard Arabic, as is usual for legal text (ad copy is in Darija).
const COPY: Record<Locale, Copy> = {
  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : 16 novembre 2026",
    sections: [
      { h: "1. Qui sommes-nous", p: [
        "Maroclist (maroclist.com) est une plateforme d’annonces immobilières au Maroc, éditée par RFALA LLC, responsable du traitement de vos données.",
        `Contact pour toute question sur vos données : ${CONTACT}.`,
      ] },
      { h: "2. Données collectées", list: [
        "Compte : nom, adresse e-mail, et numéro de téléphone / WhatsApp si vous le renseignez.",
        "Annonces : description du bien, photos, prix, ville, numéro de contact.",
        "Messages envoyés aux propriétaires via le formulaire de contact (nom, téléphone, message).",
        "Données techniques : adresse IP, navigateur, pages consultées (journaux du serveur, sécurité).",
        "Avec votre accord uniquement : statistiques de visite et données publicitaires (voir « Cookies et traceurs »).",
      ] },
      { h: "3. Finalités et bases légales", list: [
        "Publier vos annonces et transmettre les messages des acheteurs : exécution du service que vous demandez.",
        "Gérer votre compte et sa sécurité : exécution du service et intérêt légitime.",
        "Mesurer l’audience et l’efficacité de nos publicités : votre consentement, que vous pouvez retirer à tout moment.",
      ], p: ["Nous ne vendons pas vos données personnelles."] },
      { h: "4. Destinataires et hébergement", p: [
        "Vos données sont hébergées par Supabase (base de données et photos) Vercel (hébergement du site), Resend (envoi des e-mails) et Cloudflare (vérification anti-robots sur les formulaires de connexion et de publication, sans cookie publicitaire), sur des serveurs situés dans l’Union européenne et aux États-Unis. Si vous l’acceptez, Google (Analytics, Ads) et Meta (Facebook, Instagram) reçoivent des données de navigation. Ces prestataires peuvent traiter des données hors du Maroc ; nous ne leur transmettons que ce qui est nécessaire.",
        "Le numéro de téléphone que vous indiquez sur une annonce est visible par les visiteurs.",
      ] },
      { h: "5. Durées de conservation", list: [
        "Compte et annonces : tant que votre compte est actif ; supprimés sur demande.",
        "Messages de contact : tant que l’annonce concernée existe ; supprimés sur demande.",
        "Choix sur les cookies : 6 mois, puis nous vous redemandons.",
        "Statistiques Google Analytics : 14 mois maximum.",
      ] },
    ],
    trackersH: "6. Cookies et traceurs",
    trackersIntro: "Les traceurs nécessaires fonctionnent sans votre accord. Les autres ne sont activés que si vous les acceptez dans le bandeau. Refuser n’a aucun effet sur l’utilisation du site.",
    noTrackers: "Nous n’utilisons actuellement aucun traceur de mesure d’audience ou publicitaire.",
    cols: ["Traceur", "Finalité", "Durée", "Accord requis"],
    rows: {
      auth: ["Connexion (sb-…-auth-token)", "Garder votre session ouverte", "Session / 1 an"],
      lang: ["ml_lang, NEXT_LOCALE", "Mémoriser votre langue", "1 an / session"],
      consent: ["ml_consent", "Mémoriser vos choix sur les cookies", "6 mois"],
      attribution: ["ml_attribution (stockage local)", "Savoir quelle campagne vous a amené (utm_*, gclid, fbclid)", "30 jours"],
      ga: ["Google Analytics 4 (_ga, _ga_…)", "Statistiques de visite", "13 mois"],
      gads: ["Google Ads (_gcl_au)", "Mesurer les conversions de nos publicités Google", "90 jours"],
      meta: ["Meta Pixel (_fbp, _fbc)", "Mesurer et cibler nos publicités Facebook / Instagram", "90 jours"],
      plausible: ["Plausible Analytics", "Statistiques de visite sans cookie ni donnée personnelle", "—"],
    },
    changeH: "Modifier vos choix",
    changeP: "Vous pouvez changer d’avis à tout moment :",
    rightsH: "7. Vos droits",
    rights: [
      "Conformément à la loi marocaine n° 09-08 relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel, vous disposez d’un droit d’accès, de rectification et d’opposition.",
      "Si vous résidez dans l’Union européenne, le RGPD vous donne aussi un droit à l’effacement, à la limitation, à la portabilité et au retrait de votre consentement.",
      `Pour exercer ces droits, écrivez à ${CONTACT}. Nous répondons sous 30 jours.`,
    ],
    complaints: "Vous pouvez saisir la CNDP (Commission nationale de contrôle de la protection des données à caractère personnel, www.cndp.ma) au Maroc, ou l’autorité de protection des données de votre pays de résidence dans l’UE.",
    lastH: "8. Modifications",
    lastP: "Nous pouvons mettre à jour cette politique. La date en haut de la page indique la dernière version.",
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: November 16, 2026",
    sections: [
      { h: "1. Who we are", p: [
        "Maroclist (maroclist.com) is a real estate listings platform for Morocco, published by RFALA LLC, the controller of your personal data.",
        `Questions about your data: ${CONTACT}.`,
      ] },
      { h: "2. What we collect", list: [
        "Account: name, email address, and phone / WhatsApp number if you add one.",
        "Listings: property details, photos, price, city, contact number.",
        "Messages sent to owners through the contact form (name, phone, message).",
        "Technical data: IP address, browser, pages visited (server logs, security).",
        "Only with your consent: visit statistics and advertising data (see “Cookies and trackers”).",
      ] },
      { h: "3. Purposes and legal bases", list: [
        "Publishing your listings and forwarding buyers’ messages: providing the service you ask for.",
        "Running your account and keeping it secure: providing the service and legitimate interest.",
        "Measuring audience and ad performance: your consent, which you can withdraw at any time.",
      ], p: ["We do not sell your personal data."] },
      { h: "4. Recipients and hosting", p: [
        "Your data is hosted by Supabase (database and photos) Vercel (website hosting), Resend (email delivery) and Cloudflare (anti-bot check on the sign-in and posting forms, no advertising cookies), on servers in the European Union and the United States. If you accept, Google (Analytics, Ads) and Meta (Facebook, Instagram) receive browsing data. These providers may process data outside Morocco; we share only what is necessary.",
        "The phone number you put on a listing is visible to visitors.",
      ] },
      { h: "5. How long we keep data", list: [
        "Account and listings: while your account is active; deleted on request.",
        "Contact messages: as long as the listing exists; deleted on request.",
        "Cookie choices: 6 months, then we ask again.",
        "Google Analytics statistics: 14 months at most.",
      ] },
    ],
    trackersH: "6. Cookies and trackers",
    trackersIntro: "Necessary trackers work without your consent. The others are only turned on if you accept them in the banner. Refusing has no effect on how the site works.",
    noTrackers: "We currently use no audience-measurement or advertising trackers.",
    cols: ["Tracker", "Purpose", "Duration", "Consent needed"],
    rows: {
      auth: ["Sign-in (sb-…-auth-token)", "Keep you signed in", "Session / 1 year"],
      lang: ["ml_lang, NEXT_LOCALE", "Remember your language", "1 year / session"],
      consent: ["ml_consent", "Remember your cookie choices", "6 months"],
      attribution: ["ml_attribution (local storage)", "Know which campaign brought you (utm_*, gclid, fbclid)", "30 days"],
      ga: ["Google Analytics 4 (_ga, _ga_…)", "Visit statistics", "13 months"],
      gads: ["Google Ads (_gcl_au)", "Measure conversions from our Google ads", "90 days"],
      meta: ["Meta Pixel (_fbp, _fbc)", "Measure and target our Facebook / Instagram ads", "90 days"],
      plausible: ["Plausible Analytics", "Visit statistics without cookies or personal data", "—"],
    },
    changeH: "Change your choices",
    changeP: "You can change your mind at any time:",
    rightsH: "7. Your rights",
    rights: [
      "Under Moroccan Law No. 09-08 on the protection of individuals with regard to the processing of personal data, you have the right to access, correct and object to the processing of your data.",
      "If you live in the European Union, the GDPR also gives you the right to erasure, restriction, portability and to withdraw your consent.",
      `To exercise these rights, email ${CONTACT}. We reply within 30 days.`,
    ],
    complaints: "You can complain to the CNDP (Commission nationale de contrôle de la protection des données à caractère personnel, www.cndp.ma) in Morocco, or to the data protection authority of your EU country of residence.",
    lastH: "8. Changes",
    lastP: "We may update this policy. The date at the top of the page shows the latest version.",
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: 16 نونبر 2026",
    sections: [
      { h: "1. من نحن", p: [
        "Maroclist ‏(maroclist.com) منصة لإعلانات العقارات في المغرب، تنشرها شركة RFALA LLC، وهي المسؤولة عن معالجة معطياتك الشخصية.",
        `للتواصل بخصوص معطياتك: ${CONTACT}.`,
      ] },
      { h: "2. المعطيات التي نجمعها", list: [
        "الحساب: الاسم، البريد الإلكتروني، ورقم الهاتف / واتساب إذا أضفته.",
        "الإعلانات: وصف العقار، الصور، الثمن، المدينة، رقم التواصل.",
        "الرسائل المرسلة إلى الملاك عبر استمارة التواصل (الاسم، الهاتف، الرسالة).",
        "معطيات تقنية: عنوان IP، المتصفح، الصفحات التي زرتها (سجلات الخادم، الأمان).",
        "بموافقتك فقط: إحصاءات الزيارة ومعطيات الإعلانات (انظر «ملفات تعريف الارتباط وأدوات التتبع»).",
      ] },
      { h: "3. الأغراض والأسس القانونية", list: [
        "نشر إعلاناتك وإيصال رسائل المشترين: تقديم الخدمة التي تطلبها.",
        "تسيير حسابك وحمايته: تقديم الخدمة والمصلحة المشروعة.",
        "قياس الزيارات وفعالية الإعلانات: موافقتك، ويمكنك سحبها في أي وقت.",
      ], p: ["نحن لا نبيع معطياتك الشخصية."] },
      { h: "4. المتلقون والاستضافة", p: [
        "تُستضاف معطياتك لدى Supabase (قاعدة البيانات والصور) وVercel (استضافة الموقع) وResend (إرسال الرسائل الإلكترونية) وCloudflare (التحقق من أنك لست روبوتًا في نماذج تسجيل الدخول والنشر، دون ملفات تعريف ارتباط إعلانية)، على خوادم في الاتحاد الأوروبي والولايات المتحدة. إذا وافقت، تتلقى Google ‏(Analytics وAds) وMeta ‏(Facebook وInstagram) معطيات التصفح. قد يعالج هؤلاء المزودون المعطيات خارج المغرب، ولا نشاركهم إلا ما هو ضروري.",
        "رقم الهاتف الذي تضعه في الإعلان يظهر للزوار.",
      ] },
      { h: "5. مدة الاحتفاظ بالمعطيات", list: [
        "الحساب والإعلانات: ما دام حسابك نشطًا، وتُحذف عند الطلب.",
        "رسائل التواصل: ما دام الإعلان المعني موجودًا، وتُحذف عند الطلب.",
        "اختياراتك بخصوص ملفات تعريف الارتباط: 6 أشهر، ثم نسألك من جديد.",
        "إحصاءات Google Analytics: ‏14 شهرًا كحد أقصى.",
      ] },
    ],
    trackersH: "6. ملفات تعريف الارتباط وأدوات التتبع",
    trackersIntro: "تعمل الأدوات الضرورية دون الحاجة إلى موافقتك. أما الأخرى فلا تُفعَّل إلا إذا قبلتها في الشريط. الرفض لا يؤثر على استخدام الموقع.",
    noTrackers: "لا نستخدم حاليًا أي أداة لقياس الزيارات أو للإعلانات.",
    cols: ["الأداة", "الغرض", "المدة", "تتطلب الموافقة"],
    rows: {
      auth: ["تسجيل الدخول (sb-…-auth-token)", "إبقاؤك متصلًا بحسابك", "الجلسة / سنة"],
      lang: ["ml_lang، NEXT_LOCALE", "تذكر لغتك", "سنة / الجلسة"],
      consent: ["ml_consent", "تذكر اختياراتك بخصوص ملفات تعريف الارتباط", "6 أشهر"],
      attribution: ["ml_attribution (تخزين محلي)", "معرفة الحملة التي أوصلتك إلينا (utm_*، gclid، fbclid)", "30 يومًا"],
      ga: ["Google Analytics 4 ‏(_ga، _ga_…)", "إحصاءات الزيارة", "13 شهرًا"],
      gads: ["Google Ads ‏(_gcl_au)", "قياس نتائج إعلاناتنا على Google", "90 يومًا"],
      meta: ["Meta Pixel ‏(_fbp، _fbc)", "قياس واستهداف إعلاناتنا على Facebook وInstagram", "90 يومًا"],
      plausible: ["Plausible Analytics", "إحصاءات زيارة دون ملفات تعريف الارتباط ودون معطيات شخصية", "—"],
    },
    changeH: "تغيير اختياراتك",
    changeP: "يمكنك تغيير رأيك في أي وقت:",
    rightsH: "7. حقوقك",
    rights: [
      "وفقًا للقانون المغربي رقم 09-08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي، لك الحق في الولوج إلى معطياتك وتصحيحها والتعرض على معالجتها.",
      "إذا كنت مقيمًا في الاتحاد الأوروبي، يمنحك النظام العام لحماية البيانات (RGPD) أيضًا الحق في المحو والتقييد وقابلية النقل وسحب الموافقة.",
      `لممارسة هذه الحقوق، راسلنا على ${CONTACT}. نجيب في غضون 30 يومًا.`,
    ],
    complaints: "يمكنك تقديم شكاية إلى اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي (CNDP، ‏www.cndp.ma) في المغرب، أو إلى سلطة حماية البيانات في بلد إقامتك داخل الاتحاد الأوروبي.",
    lastH: "8. التعديلات",
    lastP: "قد نُحدّث هذه السياسة. يشير التاريخ أعلى الصفحة إلى آخر نسخة.",
  },
};

function copyFor(locale: string): Copy {
  return COPY[(locale in COPY ? locale : "fr") as Locale];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: copyFor(locale).title, alternates: localeAlternates(locale, () => "/privacy") };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = copyFor(locale);
  const cfg = analyticsConfig();
  const yes = { fr: "Oui", en: "Yes", ar: "نعم" }[locale as Locale] ?? "Oui";
  const no = { fr: "Non", en: "No", ar: "لا" }[locale as Locale] ?? "Non";

  // Only trackers that are actually configured are listed
  const optional = [
    cfg.ga4Id && c.rows.ga,
    cfg.gadsId && c.rows.gads,
    cfg.metaPixelId && c.rows.meta,
  ].filter(Boolean) as [string, string, string][];
  const rows: [string, string, string, string][] = [
    [...c.rows.auth, no],
    [...c.rows.lang, no],
    ...(optional.length ? [[...c.rows.consent, no] as [string, string, string, string]] : []),
    ...(optional.length ? [[...c.rows.attribution, yes] as [string, string, string, string]] : []),
    ...optional.map((r) => [...r, yes] as [string, string, string, string]),
    ...(cfg.plausibleDomain ? [[...c.rows.plausible, no] as [string, string, string, string]] : []),
  ];

  const h2 = "mb-2 text-lg font-bold text-gray-800";
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="container-page max-w-3xl py-12 sm:py-16">
          <h1 className="mb-2 text-3xl font-extrabold text-gray-900">{c.title}</h1>
          <p className="mb-10 text-sm text-gray-500">{c.updated}</p>

          <div className="space-y-8 leading-relaxed text-gray-600">
            {c.sections.map((s) => (
              <section key={s.h}>
                <h2 className={h2}>{s.h}</h2>
                {s.list && (
                  <ul className="list-disc space-y-1 ps-5">
                    {s.list.map((li) => <li key={li}>{li}</li>)}
                  </ul>
                )}
                {s.p?.map((p) => <p key={p} className="mt-2">{p}</p>)}
              </section>
            ))}

            <section>
              <h2 className={h2}>{c.trackersH}</h2>
              <p>{c.trackersIntro}</p>
              {!optional.length && <p className="mt-2">{c.noTrackers}</p>}
              <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-[34rem] text-start text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>{c.cols.map((col) => <th key={col} scope="col" className="px-3 py-2 text-start font-semibold">{col}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r) => (
                      <tr key={r[0]}>
                        {r.map((cell, i) => <td key={i} className="px-3 py-2 align-top">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {optional.length > 0 && (
                <p className="mt-4">
                  <strong className="text-gray-800">{c.changeH}.</strong> {c.changeP}{" "}
                  <CookieSettingsButton className="font-semibold text-orange-600 underline underline-offset-2" />
                </p>
              )}
            </section>

            <section>
              <h2 className={h2}>{c.rightsH}</h2>
              {c.rights.map((p) => <p key={p} className="mt-2">{p}</p>)}
              <p className="mt-2">{c.complaints}</p>
            </section>

            <section>
              <h2 className={h2}>{c.lastH}</h2>
              <p>{c.lastP}</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
