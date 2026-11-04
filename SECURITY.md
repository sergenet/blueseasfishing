# Credential handling

This repository must not contain live credentials.

Configure secrets in the deployment environment, outside the web root:

- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`
- `OPENAI_API_KEY`
- `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT`

Any credential previously committed or copied into this directory must be
treated as compromised and rotated with its provider.
