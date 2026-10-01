// Backend minimo para vender "Tu Look Pro" con Stripe.
// Guarda quien pago en licenses.json (para produccion real, usa una base de datos).
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const LIC_PATH = path.join(__dirname, "licenses.json");

app.use(cors());

function leerLicencias() {
  try { return JSON.parse(fs.readFileSync(LIC_PATH, "utf8")); } catch (e) { return {}; }
}
function guardarLicencias(data) {
  fs.writeFileSync(LIC_PATH, JSON.stringify(data, null, 2));
}

// 1) Crear la sesion de pago y mandar al usuario a la pagina de Stripe
app.post("/create-checkout-session", express.json(), async (req, res) => {
  try {
    const email = (req.body && req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Falta el correo" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment", // pago unico ("Pro de por vida"). Cambia a "subscription" si prefieres cobro mensual.
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email,
      success_url: `${process.env.APP_URL}/index.html?pro=exito&email=${encodeURIComponent(email)}`,
      cancel_url: `${process.env.APP_URL}/index.html?pro=cancelado`,
      metadata: { email }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo crear la sesion de pago" });
  }
});

// 2) Webhook: Stripe avisa aqui cuando el pago se completo de verdad
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook invalido:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = (session.customer_email || (session.metadata && session.metadata.email) || "").toLowerCase();
    if (email) {
      const lic = leerLicencias();
      lic[email] = { pro: true, fecha: new Date().toISOString(), sessionId: session.id };
      guardarLicencias(lic);
      console.log("Pro activado para:", email);
    }
  }
  res.json({ recibido: true });
});

// 3) La app pregunta aqui si un correo ya es Pro (al volver del pago o al "restaurar compra")
app.get("/check-status", (req, res) => {
  const email = (req.query.email || "").trim().toLowerCase();
  const lic = leerLicencias();
  res.json({ pro: !!(lic[email] && lic[email].pro) });
});

app.get("/", (req, res) => res.send("Backend de Tu Look Pro funcionando."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor escuchando en puerto " + PORT));
