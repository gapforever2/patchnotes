# GAP Forever Patchnotes

![GitHub Repo Size](https://img.shields.io/github/repo-size/gapforever2/patchnotes) ![GitHub Code Size](https://img.shields.io/github/languages/code-size/gapforever2/patchnotes) [![GitHub Issues](https://img.shields.io/github/issues/gapforever2/patchnotes)](https://github.com/gapforever2/patchnotes/issues) [![GitHub Last Commit](https://img.shields.io/github/last-commit/gapforever2/patchnotes/master)](https://github.com/gapforever2/patchnotes/commits/master)

[![Prettier](https://img.shields.io/badge/Prettier-1a2b34?logo=prettier)](https://prettier.io/) [![Live Server](https://img.shields.io/badge/Live%20Server-159957?logo=npm)](https://tapiov.net/live-server/)

[![GitHub Pages](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-blue?logo=github)](https://gapforever2.github.io/patchnotes/)

A simple static project hosted on **GitHub Pages**, powered by [live-server](https://www.npmjs.com/package/live-server) for local development and [Prettier](https://prettier.io/) for consistent code formatting. You can view the live version of the project here: [https://gapforever2.github.io/patchnotes/](https://gapforever2.github.io/patchnotes/)

## Requirements for Development

- [Node.js](https://nodejs.org/en/) (v18 or later recommended)
- npm (comes bundled with Node.js)
- [VSCode](https://code.visualstudio.com/) (highly recommended)
- VSCode extensions:
  - [Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)
  - [Spell Checker Russian](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker-russian)

## Other recommended extensions

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) – for code formatting using shortcuts (**Alt + Shift + F** or **Ctrl + Shift + P**, then **Format Document**) and automatic formatting on save.
- [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) – for running a local development server with live reloading using the **Go Live** button in the status bar or by right-clicking on the HTML file and selecting **Open with Live Server**.

## Installation

1. Install Node.js (if not installed)

   - Download from [https://nodejs.org/](https://nodejs.org/)
   - Or use a package manager:

     ```bash
     # For Ubuntu/Debian
     sudo apt install nodejs npm

     # For macOS (with Homebrew)
     brew install node
     ```

2. Clone the repository

   ```bash
   git clone https://github.com/gapforever2/patchnotes.git
   cd patchnotes
   ```

3. Install dependencies

   ```bash
   npm install
   ```

## Development (dev server)

To start a local development server with live reloading:

```bash
npm run dev
```

This will serve the project at: [http://localhost:7700](http://localhost:7700)

Make changes to your HTML/CSS/JS files and they will automatically reload in the browser.

## Formatting

To format all files using [Prettier](https://prettier.io/) with the configured settings:

```bash
npm run format
```

**_NOTE_**: Run whenever you are going to commit the changes to the repository.

## Deployment to GitHub Pages

1. Commit and push your changes to the `master` branch.
2. Go to your repository's settings on GitHub.
3. The site will be available shortly at: `https://gapforever2.github.io/patchnotes/`
