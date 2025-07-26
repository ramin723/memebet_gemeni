# MemeBet - TON Blockchain Betting Platform

A modern betting platform built with Nuxt 3, Vue.js, and TON blockchain integration.

## 🚀 Features

- **TON Wallet Integration**: Connect with TON wallets via TonConnect
- **PostgreSQL Database**: Robust data storage with Sequelize ORM
- **JWT Authentication**: Secure user authentication
- **Modern UI**: Built with Vue 3 and Nuxt 3
- **TypeScript**: Full type safety

## 🛠️ Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **Backend**: Node.js, Express (via Nuxt server routes)
- **Database**: PostgreSQL with Sequelize ORM
- **Blockchain**: TON (The Open Network)
- **Authentication**: JWT
- **State Management**: Pinia

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/ramin723/memebet_gemeni.git
cd memebet_gemeni
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` and configure your environment variables:

```bash
# PostgreSQL Database Credentials
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASS=your_db_password
DB_HOST=localhost
DB_PORT=5432

# JWT Secret
JWT_SECRET=your_super_secret_key_for_jwt
```

### 4. Database Setup
Create your PostgreSQL database and run migrations (coming soon).

### 5. Start development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
memebet_gemeni/
├── app/                 # Nuxt app directory
├── public/             # Static files
├── .env               # Environment variables
├── nuxt.config.ts     # Nuxt configuration
└── package.json       # Dependencies
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you have any questions or need help, please open an issue on GitHub.
