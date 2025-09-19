# Retirement Calculator
### 2800-202510-BBY14

## Overview

RCalculator is a dynamic financial tracking application designed to help users manage and monitor their progress towards long-term financial goals, particularly retirement. It moves beyond simple calculations by providing personalized insights, tracking actual performance against planned targets, and offering a clear view of your financial journey towards achieving your desired future.

---

## Features

- **Personalized Financial Profile:** Users complete a comprehensive questionnaire to build a financial profile, enabling tailored guidance and projections.
- **Comprehensive Asset Management:** Add, track, and manage various types of assets including savings, stocks, real estate, and other investments for a holistic view of net worth.
- **Strategic Goal Planning:** Define long-term financial objectives (e.g., retirement, home purchase, education) and create detailed plans with actionable steps.
- **Clear Financial Projections:** Visualize potential investment growth and assess the feasibility of financial plans through easy-to-understand projections and charts.
- **User-Friendly Dashboard:** An intuitive dashboard provides an at-a-glance overview of financial health, asset allocation, and progress towards goals.
- **Secure User Authentication:** Robust authentication system to protect sensitive financial data, including secure registration and login processes.
- **Dynamic Currency Conversion:** (If applicable) Utilizes geolocation to provide relevant currency information and conversion rates for international users or assets.

---

## Technologies Used

- **Frontend:** EJS (Embedded JavaScript templates), Tailwind CSS, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** express-session for session management, bcrypt for password hashing.
- **Data Validation:** Joi for schema validation.
- **APIs:** Google Gemini API for generating financial advice. **Geolocation API** for currency conversion.

---

## Prerequisites

1. You'll need to setup an instance of MongoDB. You can use the cloud platform, MongoDB Atlas, or create your own instance locally.  
  i.  [Create your MongoDB Altas instance.](https://www.mongodb.com/docs/manual/tutorial/getting-started/)  
  ii. [Create your local MongoDB server instance.](https://www.mongodb.com/docs/manual/administration/install-community/)  

    After this, you'll need to get your MongoURI from your database instance, as well as your database name for later configuration in the `.env` file.

## Usage

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JoaquinPar/2800-202510-BBY14.git
   cd 2800-202510-BBY14
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   This will install Express, express-session, EJS, dotenv, and any other required packages listed in `package.json`.

3. **Create and configure the environment file:**
   - Create a file named `.env` in the root directory of the project.
   - Add the necessary environment variables to this file.

4. **Run the application:**
   ```bash
   node app.js
   ```
   The application should now be running, typically on `http://localhost:3000` (or the port specified in your `.env` file).

---
## Project Structure

```
retirementCalculator/
├── src/
│   ├── auth/                 # Authentication logic (e.g., passport setup, strategies)
│   ├── database/             # MongoDB connection, schemas, models
│   ├── public/               # Static assets
│   │   ├── images/           # Site images and icons
│   │   ├── scripts/          # Client-side JavaScript files
│   │   └── svgs/             # SVG icons
│   ├── router/               # Express route definitions
│   ├── util/                 # Utility functions (e.g., calculations, helpers)
│   └── views/                # EJS templates
│       └── partials/         # Reusable EJS partials (headers, footers, nav)
│
├── .env.example              # Example environment variables file
├── .gitignore                # Specifies intentionally untracked files that Git should ignore
├── app.js                    # Main application entry point
├── CONTRIBUTING.md           # Guidelines for contributing to the project
├── LICENSE                   # Project license information
├── package-lock.json         # Records exact versions of dependencies
├── package.json              # Project metadata and dependencies
└── README.md                 # This file
```

---

## Contributors
- **[Braeden Sowinski](https://github.com/SowinskiBraeden)** - BCIT CST Student with a passion for back-end development.
- **[Joaquin Paredes](https://github.com/JoaquinPar)** - BCIT CST Student with the aspiration of becoming a game developer in the future.
- **[Nicolas Agostini](https://github.com/nicoagostini)** - BCIT CST Student with a passion for technology and AI.
- **[Mitchell Schaeffer](https://github.com/knighthawk4227)** - BCIT CST Student with a passion for technology.

---

## Limitations and Future Work

### Limitations

- **Generalized Advice:** The application provides financial guidance based on user input and common models; it does not substitute professional financial advisory services.
- **Market Volatility:** Projections are based on assumed rates of return and do not account for all potential market fluctuations or unforeseen economic events.
- **Manual Data Entry:** Asset information and updates currently require manual input.
- **Single User Focus:** Primarily designed for individual financial planning.

### Future Work

- **Third-Party API Integrations:** Connect with financial institutions (e.g., Plaid) for automated asset tracking and transaction importing.
- **Advanced Reporting:** Implement more detailed financial reports, customizable charts, and data export options (e.g., PDF, CSV).
- **Enhanced Security Features:** Implement Two-Factor Authentication (2FA) and advanced security audits.
- **Educational Resources:** Integrate a section with articles, tips, and resources on financial literacy and planning.

---

## License

[MIT LICENSE](/LICENSE)
