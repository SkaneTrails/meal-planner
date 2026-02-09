# Meal Planner

A free, open-source meal planning app for families and households — built entirely on GCP free tier. Import recipes from the web, enhance and translate them with AI, plan your weekly meals, and generate grocery lists.

Fork this repo, create a GCP project, and follow the [infrastructure guide](docs/INFRASTRUCTURE.md) — you'll have your own meal planner running for free.

## What It Does

### 🔗 Recipe Import

Paste a recipe URL from any of 400+ supported sites and the app extracts ingredients, instructions, cooking times, and photos automatically. Works with ICA.se, GialloZafferano, HelloFresh (all regions), AllRecipes, BBC Good Food, and hundreds more.

### 🤖 AI Enhancement & Translation

Imported recipes can be enhanced and translated using Google Gemini, adapted to your household's preferences:

- **Translation** — recipes are translated to your household's configured language
- **Dietary substitutions** — configure allergies and preferences (gluten-free, dairy-free, vegetarian, nut-free, low-sodium, etc.) and the AI adjusts ingredients accordingly
- **Equipment optimization** — tell the app what you have (airfryer, sous vide, stand mixer, pizza stone, etc.) and the AI adapts recipes to use them
- **Spice blend expansion** — replaces branded spice mixes with individual ingredients
- **Timeline formatting** — multi-step recipes get a coordinated cooking timeline

Each household configures its own preferences (dietary restrictions, available equipment, language), and the AI can adapt recipes accordingly.

### 📅 Weekly Meal Planning

Organize recipes into a weekly calendar. Everyone in the household sees the same meal plan.

### 🛒 Grocery Lists

Generate a combined shopping list from your planned meals, with ingredients grouped by category.

### 👨‍👩‍👧‍👦 Households & Sharing

Create a household and invite family members. Recipes, meal plans, and grocery lists are shared within the household. Recipes can also be made public and shared with other households.

## Fully Automated Pipeline

Everything from testing to deployment is automated. Push to `main` and the pipeline takes care of the rest:

| What          | How                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------- |
| **Testing**   | Pre-commit hooks, pytest (API), Vitest (mobile), security scans — all run on every PR           |
| **Building**  | Docker image built and pushed to Artifact Registry                                              |
| **Deploying** | Terraform applies infrastructure changes, deploys API to Cloud Run, web app to Firebase Hosting |
| **Patching**  | [Renovate](https://docs.renovatebot.com/) keeps all dependencies up to date automatically       |

Renovate auto-merges minor, patch, and digest updates after a 3-day stability window. Major version bumps get a PR for manual review. See [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) for Renovate setup instructions.

## Free Tier

The entire stack runs within GCP's always-free tier:

| Service           | Free limit                  |
| ----------------- | --------------------------- |
| Firestore         | 1 GB storage, 50K reads/day |
| Cloud Run         | 2M requests/month           |
| Cloud Functions   | 2M invocations/month        |
| Cloud Storage     | 5 GB                        |
| Artifact Registry | 500 MB                      |
| Secret Manager    | 6 active versions           |

No credit card surprises — the Terraform configuration is designed to stay within these limits. The main bottleneck is Firestore's 50K reads/day, which comfortably supports around a dozen households. This is a personal/family-scale app, not a multi-tenant SaaS.

## Architecture

| Platform       | Stack                 | Purpose                             |
| -------------- | --------------------- | ----------------------------------- |
| Mobile + Web   | React Native, Expo    | iOS, Android, and web app           |
| API            | FastAPI, Python       | REST backend                        |
| Scraper        | Google Cloud Function | Serverless recipe extraction        |
| Infrastructure | Terraform, GCP        | Firestore, Cloud Run, Cloud Storage |

## AI-Assisted Development

The project includes [GitHub Copilot](https://github.com/features/copilot) configuration to assist with development. Custom instructions, domain-specific skills, and coding conventions are defined in `.github/` — but none of it is required to contribute. It's there to help, not gatekeep. The configuration has been developed and tested with Claude Opus 4.6; other models may not follow the instructions as reliably.

## Documentation

| Document                                         | What's inside                                     |
| ------------------------------------------------ | ------------------------------------------------- |
| [CONTRIBUTING.md](CONTRIBUTING.md)               | Git workflow, code style, testing                 |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)       | Local setup, environment variables, API endpoints |
| [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) | GCP bootstrap, Terraform, CI/CD, Renovate         |

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
