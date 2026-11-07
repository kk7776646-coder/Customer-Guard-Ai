# Clario — A Customer Churn Prediction Platform

Clario is a customer intelligence dashboard for exploring customer data, estimating churn risk, and reviewing retention insights. The repository contains a React/TypeScript frontend, an Express API, a TypeScript-based prediction calculation, and Supabase authentication/profile integration.

> **Implementation note:** The current repository does not contain the Kaggle CSV, a model-training notebook or script, a serialized `.pkl` model, or a `model_comparison.csv` file. The live prediction calculation is implemented in TypeScript using coefficients and preprocessing values embedded in `src/data/churnModelData.ts`. See [Machine Learning Workflow](#machine-learning-workflow) and [Model Evaluation](#model-evaluation) for the distinction between the documented project workflow and the artifacts currently present in GitHub.

## Live Application

- **Live Demo:** [https://customer-guard-ai-1.onrender.com](https://customer-guard-ai-1.onrender.com)
- **GitHub Repository:** [https://github.com/kk7776646-coder/Customer-Guard-Ai](https://github.com/kk7776646-coder/Customer-Guard-Ai)

## Project Overview

Customer churn occurs when customers stop using a company's products or services. Clario brings customer information and churn-risk estimates into one interface so a retention team can inspect accounts, identify customers who may need attention, and explore possible retention actions.

The application includes a dashboard, customer list, risk calculator, customer-level analytics, revenue and profitability views, dataset import, model comparison screens, prediction history, account settings, and user profile management.

## Problem Statement

Customer information is often spread across datasets and operational reports. Without a consistent way to review customer characteristics and potential churn risk, teams may struggle to prioritize retention activity.

Clario addresses this by providing a single workspace to:

- Import and inspect customer records.
- Calculate a churn probability from customer attributes.
- Group customers into configurable risk levels.
- Review customer and dataset-level trends.
- Explore suggested retention actions and model benchmark information.

The prediction output is an analytical estimate, not a guarantee that a customer will churn.

## Key Features

- **Customer dashboard:** Summary cards, churn trends, risk distribution, and priority accounts.
- **Customer data import:** Upload CSV data, parse customer rows, identify duplicate IDs, and track missing total-charge values.
- **Risk calculator:** Calculate a churn probability from customer and subscription attributes.
- **Risk segmentation:** Classify predictions using configurable medium- and high-risk thresholds.
- **Customer analytics:** Inspect an individual customer's risk timeline and compare potential retention scenarios.
- **Model comparison:** View the benchmark values and model options defined in the application.
- **Revenue and profitability views:** Explore the revenue-oriented dashboard sections.
- **Prediction history:** Review predictions created during the current application session and persisted browser state.
- **Authentication:** Email/password sign-up, sign-in, email verification flow, password recovery, and password updates through Supabase Auth.
- **User profile:** Read and update profile information using Supabase Auth metadata and the `profiles` table.
- **Theme options:** Light, dark, and system theme modes.
- **Responsive interface:** Navigation and dashboard layouts adapt to different screen sizes.

## Machine Learning Workflow

### Project workflow

The project workflow described for Clario involved collecting a customer churn dataset from Kaggle in CSV format, exploring and cleaning the data, preprocessing customer attributes, training a machine learning model, connecting prediction functionality to the web application, and deploying the application.

### What is present in this repository

The checked-in implementation provides the following runtime flow:

1. **Customer input:** The application accepts customer attributes such as tenure, charges, contract, internet service, payment method, and optional service features.
2. **CSV parsing:** `parseCustomerCsv` in `src/utils/customerAnalytics.ts` reads uploaded CSV text, maps recognized column names, skips repeated customer IDs, and derives fallback values for some missing fields.
3. **Numeric transformation:** `computeChurnPrediction` in `src/data/churnModelData.ts` applies embedded scaling means and scales to numeric features.
4. **Categorical contributions:** The function adds categorical feature weights from the same TypeScript module.
5. **Probability calculation:** A sigmoid function converts the combined score into a percentage, which is clamped to the configured output range.
6. **Risk label:** The Express API maps the returned probability to Low Risk, Medium Risk, or High Risk using thresholds of 35 and 65.
7. **Frontend integration:** The frontend attempts the backend prediction API and uses its local TypeScript calculation if the API does not return a usable result.

### Important implementation boundary

Although the source defines the artifact name `churnguard_model.pkl` and includes values labelled as preprocessing statistics and model coefficients, that binary artifact is not in the repository and is not loaded by the server. There is also no checked-in Python/scikit-learn training pipeline. The named alternative model choices in the UI currently adjust the shared TypeScript score with simple rule-based changes; they are not separate Gradient Boosting, Random Forest, Extra Trees, or Decision Tree model implementations in this codebase.

For reproducibility, the original dataset, training notebook/script, fitted pipeline, and evaluation output would need to be added to the repository or linked from a documented artifact location.

## Technology Stack

| Area | Technologies found in the repository |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS 4, custom CSS |
| Charts and visualization | Recharts |
| Icons | Lucide React |
| Backend | Node.js, Express 5, TypeScript |
| Development/runtime tooling | tsx, TypeScript |
| Authentication and profile data | Supabase Auth, Supabase JavaScript client |
| Deployment configuration | Render Blueprint (`render.yaml`) |

The repository does not declare Python or scikit-learn as application dependencies. The prediction logic currently executed by this application is TypeScript.

## Project Architecture

Clario is organized as a Vite-powered React single-page application with an Express server.

- **Frontend entry point:** `src/main.tsx` mounts the application and wraps it in the authentication provider.
- **Application interface:** `src/App.tsx` contains the main workspace, navigation, dashboard pages, data handling, and prediction interactions.
- **Prediction and analytics:** `src/data/churnModelData.ts` contains embedded coefficients, benchmark constants, sample customer data, and the prediction function. `src/utils/customerAnalytics.ts` contains CSV parsing and customer analysis helpers.
- **Backend API:** `server.ts` exposes health, prediction, and model metadata routes. It can serve the built frontend in production or attach Vite middleware during development.
- **Authentication:** `src/context/AuthContext.tsx` manages Supabase sessions and profile operations; `src/components/auth/AuthPage.tsx` provides the authentication interface.
- **Database schema:** `supabase/migrations/20261107_clario_schema.sql` defines profile, dataset, and saved-prediction tables with row-level security policies.

### Request flow

1. A user enters customer details or imports a CSV file in the React application.
2. The frontend calculates a local prediction and attempts to request the Express prediction endpoint.
3. The server normalizes the request fields and calls the shared TypeScript prediction function.
4. The API returns a probability, risk label, model key, and timestamp.
5. If the remote API request fails or does not return a usable probability, the frontend retains its local calculation.

## Complete Original Project Folder Structure

The following tree is extracted from the repository's `main` branch. It lists tracked source and configuration files and excludes generated or dependency directories.

```text
Customer-Guard-Ai/
├── .env.example
├── .gitignore
├── README.md
├── index.html
├── metadata.json
├── package.json
├── render.yaml
├── server.ts
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── BackNavigation.tsx
│   │   ├── GlobalHeaderSearch.tsx
│   │   ├── RevenueProfitabilitySection.tsx
│   │   ├── auth/
│   │   │   └── AuthPage.tsx
│   │   └── ui.tsx
│   ├── config/
│   │   └── api.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── data/
│   │   └── churnModelData.ts
│   ├── index.css
│   ├── lib/
│   │   └── supabase.ts
│   ├── main.tsx
│   ├── utils/
│   │   └── customerAnalytics.ts
│   └── vite-env.d.ts
├── supabase/
│   └── migrations/
│       └── 20261107_clario_schema.sql
├── tsconfig.json
└── vite.config.ts
```

## Backend API Documentation

The Express application in `server.ts` exposes the following routes. Unless configured otherwise, the frontend API client uses `https://customer-guard-ai.onrender.com` as its backend base URL; this is distinct from the Live Demo URL listed above.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health`, `/health` | Returns service status, service name, backend URL, configured artifact filename, and timestamp. |
| POST | `/api/predict`, `/predict` | Calculates a churn probability and returns its risk classification. |
| GET | `/api/models` | Returns the configured artifact filename and the benchmark constants defined in the application. |

### Prediction request

The prediction endpoint accepts a JSON object containing customer attributes. The frontend request type defines these fields:

| Field | Type | Required by frontend request type |
| --- | --- | --- |
| `tenure` | number | Yes |
| `internet` | string | Yes |
| `contract` | string | Yes |
| `payment` | string | Yes |
| `monthlyCharges` | number | Yes |
| `totalCharges` | number | Yes |
| `customerId`, `customerName` | string | No |
| `gender`, `partner`, `dependents` | string | No |
| `seniorCitizen` | number | No |
| `phoneService`, `multipleLines` | string | No |
| `onlineSecurity`, `onlineBackup`, `deviceProtection` | string | No |
| `techSupport`, `streamingTV`, `streamingMovies` | string | No |
| `paperlessBilling` | string | No |
| `modelKey` | string | No |

The server also applies defaults to several omitted attributes. The accepted field names and normalization logic are implemented in `evaluateChurnPipeline` in `server.ts`.

### Prediction response

A successful response includes:

| Property | Description |
| --- | --- |
| `probability` | Calculated churn probability as a percentage. |
| `riskLevel` | `Low Risk`, `Medium Risk`, or `High Risk`. |
| `logit` | Combined score before sigmoid conversion. |
| `modelKey` | Model option key supplied in the request or defaulted by the server. |
| `artifact` | Artifact filename constant; the file itself is not included in this repository. |
| `timestamp` | Server-generated ISO timestamp. |

Invalid prediction processing returns HTTP 400 with an error label and message. The server currently enables CORS for all origins and accepts JSON request bodies up to 10 MB.

## Model Evaluation

The application contains a static comparison array named `MODEL_COMPARISON_BENCHMARKS` in `src/data/churnModelData.ts`. The following values are hard-coded in that file:

| Model key shown in application | Accuracy | Precision | Recall | F1-score | ROC-AUC |
| --- | ---: | ---: | ---: | ---: | ---: |
| `logistic-regression-pkl` | 73.81% | 50.43% | 78.34% | 61.36% | 84.16% |
| `gradient-boosting-nb` | 80.41% | 67.38% | 50.80% | 57.93% | 84.52% |
| `random-forest-nb` | 78.35% | 62.11% | 47.33% | 53.72% | 82.27% |
| `extra-trees-nb` | 76.72% | 57.19% | 48.93% | 52.74% | 78.92% |
| `decision-tree-nb` | 73.17% | 49.46% | 48.66% | 49.06% | 65.37% |

**How to interpret this table:** These are values displayed by the current application, not metrics recalculated during a build or prediction request. The repository does not include the test split, evaluation script, training artifacts, or source report needed to independently verify them. In addition, the model keys currently share the same coefficient-based TypeScript calculation with small rule-based adjustments. Treat the table as application-provided reference data rather than proof of five independently implemented and evaluated estimators.

## Installation and Setup

### Prerequisites

- Node.js and npm
- A Supabase project for account authentication and profile storage
- Git

### 1. Clone the repository

```bash
git clone https://github.com/kk7776646-coder/Customer-Guard-Ai.git
cd Customer-Guard-Ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and set the values for your environment. Do not commit `.env` or any file containing private credentials.

### 4. Configure Supabase

1. Create or select a Supabase project.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your local environment.
3. Run the SQL migration at `supabase/migrations/20261107_clario_schema.sql` in the Supabase SQL Editor.
4. Configure the Supabase email confirmation and password recovery settings for the URLs where the application will run.

The migration defines `profiles`, `user_datasets`, and `saved_predictions` tables with row-level security policies. In the current frontend source, Supabase database calls are implemented for the `profiles` table; dataset and prediction workspace state is handled in browser-side application state/local storage rather than being wired to the other two tables.

### 5. Start the development server

```bash
npm run dev
```

The development script runs `server.ts` with tsx. The Express server attaches Vite middleware for the frontend. The configured default port is `3000`.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express server with Vite development middleware. |
| `npm run build` | Build the frontend into `dist/`. |
| `npm start` | Start the Express server. In production, it serves `dist/` when the directory exists. |
| `npm run preview` | Run the Vite preview server on port 3000. |
| `npm run lint` | Run the TypeScript compiler without emitting files. |

## Environment Variables

The following names are present in `.env.example`:

| Variable | Purpose | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend base URL used by the frontend API client. | Defaults in source to `https://customer-guard-ai.onrender.com` when unset. |
| `PORT` | Port used by the Express server. | Defaults to `3000`. |
| `NODE_ENV` | Runtime environment. | Set to `production` for production behavior. |
| `VITE_SUPABASE_URL` | Supabase project URL. | Used by the browser-side Supabase client. |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anonymous client key. | Used by the browser-side Supabase client; protect data with Supabase RLS policies. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase service-role key placeholder in the example file. | The current application source does not read this variable. Never expose a service-role key in frontend code or a `VITE_` variable. |

Variables prefixed with `VITE_` are included in the client build and must not contain private secrets. The current Supabase client module also contains fallback project configuration; replace or remove those fallback values when configuring the application for your own Supabase project.

## Deployment Information

The repository includes a Render Blueprint in `render.yaml` with two services:

| Service | Render type | Build command | Publish/start configuration |
| --- | --- | --- | --- |
| `customer-guard-ai` | Node web service | `npm install && npm run build` | Starts with `npm start`; health check path is `/api/health`. |
| `clario-frontend` | Static site | `npm install && npm run build` | Publishes `./dist` and rewrites routes to `/index.html`. |

The Node service is configured with `NODE_ENV=production` and `PORT=3000`. The frontend API client uses `VITE_API_BASE_URL` when supplied at build time and otherwise falls back to the backend URL defined in `src/config/api.ts`.

The Blueprint describes the deployment configuration in the repository; it does not by itself confirm the current operational status of each Render service. Use the Live Demo link at the top of this document to open the application.


## Future Improvements

- Add the original Kaggle dataset reference and a reproducible data-cleaning and preprocessing notebook.
- Include the actual training and evaluation scripts, fitted model artifact, and dependency/version details.
- Replace the model-option score adjustments with separately trained and serialized estimators if those algorithms are intended to be selectable.
- Generate evaluation metrics from a documented hold-out test set and include the evaluation report.
- Connect dataset and saved-prediction operations to the existing Supabase tables with appropriate ownership checks and RLS policies.
- Add automated tests for CSV parsing, prediction calculations, API validation, and authentication flows.
- Review API CORS settings and add request validation and operational monitoring for production.

## Author

**GitHub:** [@kk7776646-coder](https://github.com/kk7776646-coder)

---

*Clario — Customer Intelligence, Made Clear.*
