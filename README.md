# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/88e08118-864d-4752-8e2d-7fc2e342d5fe

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/88e08118-864d-4752-8e2d-7fc2e342d5fe) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

This project can be deployed to Vercel (recommended) or Netlify. It uses Vite for the frontend and serverless endpoints for payments and order fulfillment.

Quick deploy steps (Vercel):

1. Push your branch to GitHub.
2. Import the repository into Vercel and select the `main` branch.
3. Set the following environment variables in Vercel project settings:
	- `VITE_SUPABASE_URL` — your Supabase URL
	- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
	- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
	- `STRIPE_SECRET_KEY` — your Stripe secret key (server-only)
	- `NEXT_PUBLIC_BASE_URL` — your site URL (e.g. `https://your-site.vercel.app`)

4. Deploy.

Notes:
- The repo includes `api/create-checkout-session.ts` and `api/fulfill-order.ts` serverless endpoints used to create Stripe Checkout sessions and persist orders in Supabase after payment. Server endpoints require the service role key and Stripe secret key to be set in the deployment environment.
- For local development, copy `.env.example` to `.env` and fill values. Run `npm i` then `npm run dev`.

## Mobile Money (TZ) — Local testing

This project includes a simple mobile-money scaffold to support Tanzanian providers (Tigo Pesa, Airtel Money, Vodacom/M-Pesa, Halotel). The current implementation uses provider adapters under `api/mobile/providers/` and a generic webhook simulator.

How the flow works (local/dev):

- User places an order via the Checkout page and selects `Mobile Money`.
- The frontend calls `POST /api/orders` to create a pending order.
- The frontend then calls `POST /api/mobile/initiate` with `{ order_id, provider, phone_number }`.
- The server will (a) try to call a provider adapter under `api/mobile/providers/{provider}.ts` to initiate a payment, or (b) return generic human-readable instructions. The response contains `provider_tx_id`.
- The frontend polls `GET /api/mobile/status?provider_tx_id=...` to check `payment_status` until it becomes `paid`.
- To simulate a provider callback during local testing, run:

```bash
curl -X POST http://localhost:5173/api/mobile/callback \
	-H "Content-Type: application/json" \
	-d '{"provider_tx_id":"<PROVIDER_TX_ID>", "status":"success"}'
```

Replace `<PROVIDER_TX_ID>` with the value returned from `/api/mobile/initiate`.

Environment variables

- See `.env.example` for provider credential placeholders (e.g. `MOBILE_TIGO_API_KEY`). Real provider integrations will require API keys/credentials and webhook signing secrets — keep these server-side.

Next steps for production

- Replace the placeholder adapters in `api/mobile/providers/*` with real API calls to the provider.
- Secure `api/mobile/callback` by verifying provider signatures or request authenticity.
- For high-volume apps, implement idempotency and reconciliation (periodic polling or settlement reports from providers).

Provider-specific notes

- Tigo Pesa (Tanzania): requires merchant number/shortcode and API credentials. Sandbox testing typically provides a test merchant number and callback URL. Set `MOBILE_TIGO_MERCHANT_NUMBER`, `MOBILE_TIGO_API_KEY`, and `MOBILE_TIGO_SANDBOX` in `.env`.

- Airtel Money: requires a merchant account, credentials and webhook secret. Set `MOBILE_AIRTEL_MERCHANT_NUMBER`, `MOBILE_AIRTEL_API_KEY`, and `MOBILE_AIRTEL_SANDBOX`.

- Vodacom / M-Pesa (Tanzania): set `MOBILE_VODACOM_MERCHANT_NUMBER`, `MOBILE_VODACOM_API_KEY`, and `MOBILE_VODACOM_SANDBOX`.

- Halotel: set `MOBILE_HALOTEL_MERCHANT_NUMBER`, `MOBILE_HALOPESA_API_KEY`, and `MOBILE_HALOTEL_SANDBOX`.

All real provider integrations will require you to register with the provider to obtain API credentials and a webhook URL. Keep credentials in environment variables and never expose them to the browser.

Example: verifying webhook signatures (developer notes)

1. Providers will POST callbacks to `/api/mobile/callback` with a JSON body containing at least `{ provider_tx_id, status }` where `status` is `success` or `failed`.
2. If you set `MOBILE_*_CALLBACK_SECRET` in your environment, the adapter will attempt to verify a signature included in headers such as `x-provider-signature` or `x-signature`. The HMAC algorithm used in this scaffold is HMAC-SHA256 over the raw JSON body (hex digest). Example (bash):

```bash
BODY='{"provider_tx_id":"abc123","status":"success"}'
SECRET='your_callback_secret'
SIGNATURE=$(printf "%s" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | sed 's/^.* //')

curl -X POST http://localhost:5173/api/mobile/callback \
	-H "Content-Type: application/json" \
	-H "x-provider-signature: $SIGNATURE" \
	-d "$BODY"
```

This will simulate a provider callback and the server will verify the HMAC if the secret is set. In production, use the provider's documented signature method and header.




## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
