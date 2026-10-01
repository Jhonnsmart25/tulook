# Backend de Tu Look Pro (Stripe)

## 1. Crear el producto en Stripe
1. Entra a https://dashboard.stripe.com (usa el modo "Test" mientras pruebas).
2. Products -> Add product -> nombre "Tu Look Pro", precio unico (ej. $99 MXN).
3. Copia el "Price ID" (empieza con price_...).
4. En Developers -> API keys, copia tu "Secret key" (sk_test_...).

## 2. Configurar el .env
Copia .env.example a .env y llena:
- STRIPE_SECRET_KEY: tu clave secreta.
- STRIPE_PRICE_ID: el price_... del paso anterior.
- APP_URL: el link de tu PWA publicada (ej. https://tulook.netlify.app), SIN slash final.
- STRIPE_WEBHOOK_SECRET: lo obtienes en el paso 4.

## 3. Subir el backend a un hosting gratis
Recomendado: Render.com (plan gratis) o Railway.app.
- Sube esta carpeta a un repositorio de GitHub.
- En Render: New -> Web Service -> conecta el repo -> Build command "npm install", Start command "npm start".
- Agrega las variables de entorno del .env en el panel de Render (Environment).
- Al desplegar te da una URL, por ejemplo https://tulook-backend.onrender.com

## 4. Conectar el webhook
1. En Stripe: Developers -> Webhooks -> Add endpoint.
2. URL: https://tulook-backend.onrender.com/webhook
3. Evento a escuchar: checkout.session.completed
4. Copia el "Signing secret" (whsec_...) y ponlo como STRIPE_WEBHOOK_SECRET en Render, luego reinicia el servicio.

## 5. Conectar el frontend
En index.html de la PWA, al inicio del script, cambia:
  const BACKEND_URL = "https://tulook-backend.onrender.com";
por la URL real que te dio Render.

## Probar sin pagar de verdad
En modo Test de Stripe, usa la tarjeta 4242 4242 4242 4242, cualquier fecha futura y CVC.

## Cuando quieras cobrar de verdad
Activa el modo "Live" en Stripe, crea el producto ahi tambien, y usa las llaves que empiezan con sk_live_ y whsec_ del modo Live.
