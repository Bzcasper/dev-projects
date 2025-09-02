# Prompt Optimizer Desktop User Manual

## 1. Welcome

Welcome to the Prompt Optimizer Desktop Edition! This application provides a seamless, barrier-free prompt optimization experience, allowing you to focus on creating high-quality prompts without dealing with network configuration issues.

The biggest difference from the web version is that the desktop version **does not require any proxy or complex setup to directly call the APIs of major AI service providers**.

## 2. Installation and Startup

### System Requirements

- Windows 10/11, macOS, or Linux
- A stable internet connection (for API calls)

### Installation Steps

1.  Download the installation package (.exe for Windows users) compatible with your operating system from the specified release page.
2.  Double-click the installation package and follow the on-screen prompts to complete the installation.
3.  Once the installation is complete, find the "Prompt Optimizer" icon on your desktop or in your applications list and launch it.

## 3. Initial Configuration: Connect Your AI Services

For the application to function, you need to provide at least one API key from an AI service provider.

1.  After starting the application, click the **"Model Management"** icon in the sidebar.
2.  On the model management page, you will see a list of models. Select the service provider you want to use (such as OpenAI, DeepSeek, etc.).
3.  Enter your **API Key** in the corresponding input field.
4.  Click the **"Test Connection"** button. If the key is valid and your network is stable, you will see a "Connection successful" prompt.
5.  Ensure the **"Enable"** switch next to the model you want to use is turned on.

## 4. Basic Usage Instructions

1.  **Input Content**: Enter the original prompt or text you want to optimize in the "Content to Optimize" input box on the left.
2.  **Select Template**: Choose an optimization strategy from the "Optimization Template" dropdown menu above. "General Optimization" is a good starting point for most situations.
3.  **Click Optimize**: Click the **"Optimize"** button in the middle.
4.  **View Results**: The "Optimization Results" area on the right will display the AI-generated optimized prompt.

## 5. FAQ (Frequently Asked Questions)

**Q1: After clicking "Optimize," there is no response or an error message appears. What should I do?**

**A:** Please follow these steps to troubleshoot:
1.  Ensure your computer is connected to the internet.
2.  Go to the "Model Management" page and click "Test Connection" again to confirm your API key is still valid.
3.  Confirm that the optimization template you chose corresponds to an enabled and correctly configured model.

**Q2: The application interface appears blank.**

**A:** This may be due to a failure in loading application resources. Please try to completely close the application and restart it. If the problem persists, consider reinstalling the application.

**Q3: Can I use multiple AI service providers simultaneously?**

**A:** Yes. You can configure and enable multiple service providers and models in "Model Management." During use, you can select specific models for optimization in the "Optimization Template" or related settings.

**Q4: Are my API keys secure?**

**A:** Yes. In the desktop version, your API keys are stored only on your local computer and are sent directly to the corresponding AI service provider only when you initiate an optimization request. They do not pass through any third-party servers.
