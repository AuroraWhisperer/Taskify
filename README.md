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
<a href="https://codecov.io/gh/DataFox0/Taskify"><img src="https://codecov.io/gh/DataFox0/Taskify/branch/main/graph/badge.svg" alt="Codecov coverage"></a>
</p>

## Repository

<h3>Taskify</h3>

Taskify is a task management system for everyday use. It is designed to help users create an account, sign in, and access a dashboard for managing their work.

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
  baseline-standards.md
  flaw-improvements.md
  markup-structure.md
  security.md

package.json
package-lock.json
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

The repository does not include a real `.env` file because it contains private credentials. After cloning the project, create a `.env` file in the project root.

The app can connect to either a local MongoDB database or a MongoDB Atlas cloud database. Choose the database by setting `DB_SOURCE`.

For local MongoDB, use this format:

```env
PORT=3000
DB_SOURCE=local
LOCAL_MONGODB_URI=mongodb://127.0.0.1:27017/taskify
SESSION_SECRET=replace_with_a_long_random_secret
```

For MongoDB Atlas, use this format:

```env
PORT=3000
DB_SOURCE=cloud
CLOUD_MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/taskify?retryWrites=true&w=majority
SESSION_SECRET=replace_with_a_long_random_secret
```

Use your own MongoDB username, password, cluster address, and database name. Do not commit `.env` to GitHub.

`DB_SOURCE=local` uses `LOCAL_MONGODB_URI`. `DB_SOURCE=cloud` uses `CLOUD_MONGODB_URI`. If `DB_SOURCE` is not set, the app asks you to choose local or cloud when it starts in an interactive terminal.

## Manual checks

After starting the app, check these basic flows:

- Sign up with valid account details.
- Log out from the dashboard.
- Log in again with the same account.
- Try invalid signup values and confirm the form shows an error.

## Automated tests

Run the automated tests:

```bash
npm test
```

Run the source-only coverage gate:

```bash
npm run coverage
```

Generate the lcov report used by Codecov:

```bash
npm run coverage:lcov
```

The current tests cover route behavior, form validation, environment configuration, locale handling, error handling, and MongoDB-backed signup/login persistence flows. The coverage gate only includes `src/**/*.js` and fails when line coverage drops below 80%.
