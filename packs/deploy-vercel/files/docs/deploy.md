# Vercel Deploy Checklist

Use this checklist after installing the `deploy-vercel` pack.

## Project setup

- Create or link the Vercel project.
- Confirm the project framework preset is `Next.js`.
- Set `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` locally when using Vercel CLI automation.

## Environment variables

- Add every required pack environment variable to Vercel.
- Keep preview and production values separate when credentials differ.
- Redeploy after changing environment variables.

## Preview deploys

- Enable pull request preview deploys.
- Confirm preview deploys run against non-production services.
- Keep production-only credentials out of preview environments.
