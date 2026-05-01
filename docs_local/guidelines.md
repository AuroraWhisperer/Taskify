Student Guideline: CPT304 
Coursework 1: " Research-Led Software Enhancement"
This guideline is designed to help your group in the transition from a "buggy prototype" to a "production-ready system." 

## 4 Deficiencies vs. 5 Standards
Many students confuse these two categories. Think of them as Problems vs. Benchmarks.
4 Deficiencies: 
•	Specific "broken" parts or "weaknesses" unique to your chosen app
•	You must audit the code to find them (e.g., a security hole)
•	You must cite a research article/paper for each fix
•	To prove you can research and solve technical problems
5 Standards: 
•	Professional features that every project must have to be "responsible."
•	They are already listed in the brief. You just have to build them.
•	You must provide a screenshot/badge as evidence
•	To prove the app is high-quality, legal, and accessible
Hint: Fixing a deficiency (like adding a missing ARIA label) often helps you meet a standard (improving your Lighthouse score).

## Examples of Targeted Deficiencies
When auditing your app, look for these specific issues. You need to identify four:
1.	Security - API Exposure: The backend API key or database password is hard-coded in the frontend.
2.	Security - XSS Vulnerability: A form (like a To-Do input) allows users to inject <script> tags that execute in the browser.
3.	UI/UX - State Persistence: The app loses all data if the user refreshes the page because it isn't using localStorage or a database correctly.
4.	Performance - Massive Image Assets: The app loads a 3MB image for a tiny 50x50 icon, slowing down mobile users.
5.	Accessibility - Keyboard Focus: A user cannot "Tab" through the menu; the focus indicator is invisible or trapped.
6.	Code Quality - Memory Leaks: A timer or event listener doesn't stop when the component is closed, eating up the user's RAM.
7.	UX - Missing Feedback: Clicking "Submit" doesn't show a loading spinner or success message, leaving the user confused.
8.	Logic - Race Conditions: If two buttons are clicked quickly, the app displays incorrect or overlapping data.

## Writing High-Standard Research Findings
For Sections 2–5 of your report, do not just say "I fixed it." Use the Detection-Literature-Implementation framework.
•	Refer to the separate guideline for Detection-Literature-Implementation framework.
________________________________________
## Understanding the Tools & Concepts
To pass this coursework, you must master these four professional tools:
A. Vercel / Render (Deployment)
•	Cloud platforms that host your code so it is accessible via a public URL (e.g., my-project.vercel.app).
•	Goal: You must prove "7 Green Days." This means you cannot finish the project at the last minute; your site must be live and stable for a full week before the deadline.
B. Codecov (Testing Coverage)
•	A tool that analyzes your test suite (Vitest, Jest, etc.) and calculates what percentage of your code is actually "covered" by tests.
•	Goal: You must reach ≥80%. This ensures that if you change one part of the code, your tests will catch if it breaks another part. You will display this as a "badge" in your GitHub README.
C. Lighthouse (Accessibility & Performance)
•	An automated tool built into Google Chrome (DevTools) that audits your website's quality.
•	Goal: You are focusing on the Accessibility category. You must score 90+. It checks for things like font size, screen-reader compatibility, and color contrast.
D. i18n & Privacy (Global Responsibility)
•	Multilingual (i18n): Real software is used globally. You must implement a toggle that swaps all UI text between at least two languages (e.g., English and Chinese) using a library like i18next.
•	GDPR/Privacy: You must include a "Cookie Banner" that asks for consent and a "Privacy Policy" that explains how you handle user data (even if you only use localStorage).
________________________________________
Summary Checklist for Success:
1.	Fork the repo early.
2.	Audit immediately to find your 4 deficiencies.
3.	Research your fixes before you start coding.
4.	Deploy to Vercel to ensure you get your "7 Green Days."
5.	Test until you see that 80% Codecov badge.
