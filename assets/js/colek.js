// The site is static, so the form hands the message to the visitor's own mail app.
const form = document.getElementById("colek-form");

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const jenis = data.getAll("jenis").join(", ") || "-";
  const body = [
    `Nama: ${data.get("nama")}`,
    `Email: ${data.get("email")}`,
    `Mau bikin: ${jenis}`,
    `Buat: ${data.get("tujuan") || "-"}`,
    "",
    data.get("cerita"),
  ].join("\n");
  const subject = `Colekan dari ${data.get("nama")}`;
  location.href = `mailto:heyneko@nekomade.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
