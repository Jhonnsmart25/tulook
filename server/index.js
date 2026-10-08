// Backend minimo para vender "Tu Look Pro" con Stripe.
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

// Webhook debe ir ANTES de express.json()
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook invalido:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = (
      session.customer_email ||
      (session.metadata && session.metadata.email) ||
      ""
    ).toLowerCase();
    if (email) {
      const lic = leerLicencias();
      lic[email] = { pro: true, fecha: new Date().toISOString(), sessionId: session.id };
      guardarLicencias(lic);
      console.log("Pro activado para:", email);
    }
  }
  res.json({ recibido: true });
});

// Middleware para procesar JSON en el resto de las rutas
app.use(express.json());

function leerLicencias() {
  try {
    return JSON.parse(fs.readFileSync(LIC_PATH, "utf8"));
  } catch (e) {
    return {};
  }
}

function guardarLicencias(data) {
  fs.writeFileSync(LIC_PATH, JSON.stringify(data, null, 2));
}

// 1) Crear la sesion de pago
app.post("/create-checkout-session", async (req, res) => {
  try {
    const email = req.body?.email || "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: "price_1UNNgnCbi64Bdt4ED6Husqb2",
          quantity: 1,
        },
      ],
      customer_email: email || undefined,
      success_url: `https://sparkly-dolphin-4b54e8.netlify.app/index.html?pro=exito&email=${encodeURIComponent(email)}`,
      cancel_url: `https://sparkly-dolphin-4b54e8.netlify.app/index.html?pro=cancelado`,
      metadata: { email: email },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("Error al crear sesión de checkout:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2) Consultar estado de usuario
app.get("/check-status", (req, res) => {
  const email = (req.query.email || "").trim().toLowerCase();
  const lic = leerLicencias();
  res.json({ pro: !!(lic[email] && lic[email].pro) });
});

app.get("/", (req, res) => res.send("Backend de Tu Look Pro funcionando."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor escuchando en puerto " + PORT));
