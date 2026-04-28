import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#f9fafb" }}>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem",
        }}>
          <div style={{ fontSize: "4rem", fontWeight: 800, color: "#f97316" }}>404</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", margin: "0.5rem 0" }}>
            Page introuvable · Page not found
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
            La page que vous cherchez n&apos;existe pas.
            <br />
            The page you are looking for does not exist.
          </p>
          <Link
            href="/fr"
            style={{
              background: "#f97316",
              color: "white",
              padding: "0.75rem 2rem",
              borderRadius: "0.75rem",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </body>
    </html>
  );
}
