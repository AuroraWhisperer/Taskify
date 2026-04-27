<div align="center">
  <h1>Welcome to Taskify</h1>
  <h3>Task management system built with Node.js, Express, EJS, and MongoDB</h3>
</div>

<br>

<p align="center">
<img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white">
<img src="https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white">
<img src="https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white">
<img src="https://img.shields.io/badge/EJS-B4CA65?style=flat">
</p>

## Repository

<h3>Taskify</h3>

Taskify is a task management system for everyday use. It is designed to help users create an account, sign in, and access a protected dashboard for managing their work.

This version also includes several security updates, including CSRF protection, rate limiting on authentication routes, stricter input validation, security headers, and centralized error handling.

## Project Goal

The goal of this project is to provide a simple task management web application with a clear login and dashboard flow. The project is kept small enough for coursework review, while still showing the main parts of a typical Express and MongoDB application.

## Tech Stacks

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

<br>

### Node

- #### Node installation on Windows

  Go to the [official Node.js website](https://nodejs.org/) and download the installer.
  After installation, make sure `node` and `npm` are available in your terminal.
- #### Node installation on Ubuntu

  You can install Node.js and npm with apt:


  ```bash
  sudo apt install nodejs
  sudo apt install npm
  ```
- #### Other Operating Systems

  More installation details are available on the [official Node.js website](https://nodejs.org/) and the [official npm website](https://npmjs.org/).

If the installation was successful, these commands should print version numbers:

```bash
node --version
npm --version
```

## Folder Structure

Folder structure of this project for your reference:

```text
src/
  cloudinary/
  db/
  middleware/
  models/
  routes/
  utilities/
  app.js

static/
  assets/
  js/
  styles/
    partials/

views/
  dashboard/
  partials/

docs/
  security.md

package.json
package-lock.json
.env.example
```

## Installation

Install the project dependencies:

```bash
npm install
```

## Running the project

Start the application:

```bash
npm start
```

For development with nodemon:

```bash
npm run server
```

The app runs at:

```text
http://localhost:3000
```

## Configure environmental variables

Create a `.env` file, then edit it with your own settings. You can use `.env.example` as the starting point.

Required values:

```env
PORT=3000
SESSION_SECRET=your_secret_key_here
LOCAL_MONGODB_URI=mongodb://localhost:27017/taskify
CLOUD_MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/taskify?retryWrites=true&w=majority
MONGODB_URI=mongodb://localhost:27017/taskify
```

Optional value for choosing the database source:

```env
DB_SOURCE=local
```

Use `DB_SOURCE=local` for local MongoDB or `DB_SOURCE=cloud` for MongoDB Atlas. If this value is not set, the app asks which database to use when it starts in an interactive terminal.

## Security updates

This version includes the following security-related changes:

- CSRF tokens for signup, login, logout, and account deletion forms.
- Logout changed from a GET link to a POST request.
- Rate limiting on login and signup routes.
- Server-side validation for username, email, and password.
- Security headers, including Content Security Policy.
- Centralized error handling and audit-style logging.

For more details, see [docs/security.md](docs/security.md).

## Manual checks

After starting the app, check these basic flows:

- Sign up with a valid username, email, and password.
- Log out from the dashboard.
- Log in again with the same account.
- Try invalid signup values and confirm the form shows an error.
- Submit a POST request without a CSRF token and confirm it returns `403`.
- Repeat failed login attempts and confirm the route eventually returns `429`.
