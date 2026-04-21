const base = "https://next-gear.app";

function pickCookie(setCookieHeaders) {
  const raw = setCookieHeaders.find((value) => value.startsWith("nextgear_session="));
  return raw ? raw.split(";")[0] : "";
}

async function main() {
  const results = [];

  const home = await fetch(`${base}/`);
  results.push({ check: "GET /", status: home.status });

  const unauthVendor = await fetch(`${base}/api/vendor/profile-documents`);
  results.push({ check: "GET /api/vendor/profile-documents (unauth)", status: unauthVendor.status });

  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vendor@nextgear.in", password: "Password@123" }),
  });

  const setCookie = login.headers.getSetCookie?.() ?? [];
  const sessionCookie = pickCookie(setCookie);
  results.push({ check: "POST /api/auth/login vendor", status: login.status, hasSessionCookie: Boolean(sessionCookie) });

  if (!sessionCookie) {
    console.log(JSON.stringify({ ok: false, reason: "No vendor session cookie", results }, null, 2));
    process.exit(1);
  }

  const docsGet = await fetch(`${base}/api/vendor/profile-documents`, {
    headers: { Cookie: sessionCookie },
  });
  results.push({ check: "GET /api/vendor/profile-documents (vendor)", status: docsGet.status });

  const form = new FormData();
  form.set("documentType", "other");
  const pdfContent = new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
  const file = new File([pdfContent], "smoke.pdf", { type: "application/pdf" });
  form.set("file", file);

  const upload = await fetch(`${base}/api/vendor/profile-documents`, {
    method: "POST",
    headers: { Cookie: sessionCookie },
    body: form,
  });

  let uploadJson = null;
  try {
    uploadJson = await upload.json();
  } catch {
    uploadJson = null;
  }

  results.push({
    check: "POST /api/vendor/profile-documents (vendor upload)",
    status: upload.status,
    response: uploadJson,
  });

  const ok = home.status === 200 && login.status === 200 && docsGet.status === 200;
  console.log(JSON.stringify({ ok, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
