## Vercel Deployment Instructions

### Comparison of Deployment Methods

| Deployment Method | Pros | Cons |
|---|---|---|
| One-Click Deploy | Quick and easy, no extra setup needed | Cannot automatically sync updates from the source project |
| Fork and Import | Can track source project updates, easier to maintain | Requires manual fix of the root directory setting on the first deployment to enable Vercel's proxy feature |

### Recommended Method: Fork the Project and Import to Vercel (Recommended)

This method allows you to track project updates, making it easier to sync the latest features and bug fixes later on.

1.  **Fork the project to your own GitHub**
    -   Visit the [prompt-optimizer project](https://github.com/linshenkx/prompt-optimizer)
    -   Click the "Fork" button in the top right corner.
    -   After completing the fork, you will have a copy of this project under your own GitHub account.

2.  **Import the project to Vercel**
    -   Log in to the [Vercel platform](https://vercel.com/)
    -   Click "Add New..." → "Project"
    -   In the "Import Git Repository" section, find the project you forked and click "Import".
    -   Configure the project (**Note**: Although you can set the root directory here, it is ineffective for multi-module projects and still requires a manual fix later).
    -   Click "Deploy" to start the deployment.

    ![Import project to Vercel](../images/vercel/import.png)

3.  **Fix the root directory setting (Strongly Recommended)**
    -   When deploying via import, although the project's `vercel.json` file already contains relevant fixes to make basic functions work,
    -   if you want to enable the **Vercel proxy feature** (a key feature for resolving cross-origin issues), you need to manually fix the root directory:

    a. After the project is deployed, go to the project settings.

    b. Click "Build and Deployment" in the left menu.

    c. In the "Root Directory" section, **clear** the content in the input box.

    d. Click "Save" to save the settings.

    ![Clear root directory setting](../images/vercel/setting.png)

4.  **Configure environment variables (Optional)**
    -   After deployment, go to the project settings.
    -   Click "Environment Variables".
    -   Add the required API keys (e.g., `VITE_OPENAI_API_KEY`).
    -   To add the access restriction feature:
        -   Add an environment variable named `ACCESS_PASSWORD`.
        -   Set a secure password as its value.
    -   Save the environment variable settings.

5.  **Redeploy the project**
    -   After saving the settings, you need to manually trigger a redeployment for the fixes and environment variables to take effect.
    -   Click "Deployments" in the top navigation bar.
    -   On the right side of the latest deployment record, click the "..." button.
    -   Select the "Redeploy" option to trigger a redeployment.

    ![Redeploy the project](../images/vercel/redeploy.png)

6.  **Sync upstream updates**
    -   Open your forked project on GitHub.
    -   If there are updates, it will show "This branch is X commits behind linshenkx:main".
    -   Click the "Sync fork" button to sync the latest changes.
    -   Vercel will automatically detect the code changes and redeploy.

### Alternative Method: One-Click Deploy to Vercel

If you just need a quick deployment and don't care about subsequent updates, you can use the one-click deployment method:

1.  Click the button below to deploy directly to Vercel.
    [![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flinshenkx%2Fprompt-optimizer)

2.  Follow Vercel's guidance to complete the deployment process.

    **Advantage:** With one-click deployment, Vercel can automatically and correctly identify the root directory, so no manual fix is needed, and all features (including the Vercel proxy) will work correctly.

### About the Vercel Proxy Feature

Prompt Optimizer supports using the Edge Runtime proxy to solve cross-origin issues when deployed on Vercel.

1.  **Confirm the proxy feature is available**
    -   If using one-click deployment: The proxy feature should be available directly.
    -   If using import deployment: You need to complete the "Fix the root directory setting" and "Redeploy the project" steps above.
    -   In the application, open "Model Management".
    -   Select the target model -> "Edit". You should now see the "Use Vercel Proxy" option.
    -   If you do not see this option, it means the Vercel Function was not deployed correctly. Please check the root directory settings.

2.  **Enable the proxy feature**
    -   Check the "Use Vercel Proxy" option.
    -   Save the configuration.

3.  **Proxy Principle**
    -   Request flow: Browser → Vercel Edge Runtime → Model Service Provider
    -   This solves the cross-origin restrictions when the browser directly accesses the API.
    -   The proxy feature is implemented based on Vercel Functions and relies on the `/api` path.

4.  **Notes**
    -   Some model service providers may restrict requests from Vercel.
    -   If you encounter restrictions, it is recommended to use a self-hosted API proxy service.

### Password-Protected Access

When the `ACCESS_PASSWORD` environment variable is configured, your site will be password-protected:
-   When accessing the site, a password verification page will be displayed.
-   After entering the correct password, you can access the application.
-   The system will set a cookie to remember the user, so you won't need to re-enter the password for a period of time.

### Common Issues

1.  **Blank page or error after deployment**
    -   Check if the environment variables are configured correctly.
    -   Check the Vercel deployment logs for error reasons.

2.  **Cannot connect to the model API**
    -   Confirm that the API key is configured correctly.
    -   Try enabling the Vercel proxy feature.
    -   Check if the model service provider has restricted requests from Vercel.

3.  **"Use Vercel Proxy" option is not displayed**
    -   If using import deployment: Check if you have cleared the root directory setting and redeployed.
    -   Verify if the `/api/vercel-status` path is accessible (you can test by visiting `your-domain/api/vercel-status` in your browser).
    -   Check the deployment logs for any error messages related to Functions.

4.  **How to update a deployed project**
    -   If imported after forking: Sync the fork and wait for automatic deployment.
    -   If one-click deployed: You need to redeploy the new version (cannot automatically track source project updates).

5.  **How to add a custom domain**
    -   In the Vercel project settings, select "Domains".
    -   Add and verify your domain.
    -   Follow the instructions to configure your DNS records.
