# Yohu AI Construction Assistant

## Deployment on Vercel

To deploy this project to Vercel:
1. Ensure `serverless-http` and other dependencies are in `package.json`.
2. Push your repository to GitHub.
3. Import the project in Vercel.
4. Vercel will automatically detect `vercel.json` and deploy the Express server as a Serverless Function.

### Environment Variables
Ensure the following are set in Vercel:
- `ADMIN_CODE`: Comma-separated list of admin codes.
- `GEMINI_API_KEY`: API Key.
- `GOOGLE_SHEETS_GAS_URL`: URL for Google Sheets.
- `FIREBASE_SERVICE_ACCOUNT`: The Firebase Admin JSON credential string (required for Vercel).
