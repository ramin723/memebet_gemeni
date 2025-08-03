# MemeBet - TON Blockchain Betting Platform

A modern betting platform built with Nuxt 4, Vue 3, and TON blockchain integration.

## 🚀 Features

- **TON Wallet Integration**: Connect with TON wallets via TonConnect
- **PostgreSQL Database**: Robust data storage with Sequelize ORM
- **JWT Authentication**: Secure user authentication
- **Modern UI**: Built with Vue 3 and Nuxt 4
- **TypeScript**: Full type safety
- **Pinia State Management**: Reactive state management

## 🛠️ Tech Stack

- **Frontend**: Nuxt 4, Vue 3.5, TypeScript
- **Backend**: Node.js, Express (via Nuxt server routes)
- **Database**: PostgreSQL with Sequelize ORM
- **Blockchain**: TON (The Open Network) with TonConnect
- **Authentication**: JWT (jsonwebtoken)
- **State Management**: Pinia
- **Development**: Nuxt DevTools enabled

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
Create a `.env` file in the root directory and configure your environment variables:

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
│   └── app.vue         # Main app component
├── public/             # Static files
├── .env               # Environment variables (not in git)
├── nuxt.config.ts     # Nuxt 4 configuration
├── package.json       # Dependencies
└── tsconfig.json      # TypeScript configuration
```

## 📚 Important Documentation

### Sequelize Model Configuration
Due to inconsistent `underscored` settings across models, special attention is required when writing queries. See [SEQUELIZE_MODEL_CONFIGURATION.md](./SEQUELIZE_MODEL_CONFIGURATION.md) for detailed guidelines.

**Quick Reference:**
- Models with `underscored: true`: Use `created_at` in `fn()` and `col()`
- Models without `underscored: true`: Use `createdAt` in `fn()` and `col()`
- Always use `createdAt` in `where` clauses (Sequelize handles the mapping)

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

# Generate static site
npm run generate
```

## 📦 Dependencies

### Core
- **Nuxt 4.0.1** - Full-stack Vue framework
- **Vue 3.5.17** - Progressive JavaScript framework
- **TypeScript** - Type safety

### Blockchain
- **@tonconnect/sdk 3.2.0** - TON Connect SDK
- **@tonconnect/ui 2.2.0** - TON Connect UI components

### Database
- **Sequelize 6.37.7** - ORM for Node.js
- **pg 8.16.3** - PostgreSQL client
- **pg-hstore 2.3.4** - PostgreSQL hstore support

### Authentication & State
- **jsonwebtoken 9.0.2** - JWT implementation
- **@pinia/nuxt 0.11.2** - State management

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
