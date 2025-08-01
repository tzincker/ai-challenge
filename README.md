# 🐾 Pet Accessories Store Chatbot API

[![GitHub Copilot-Style AI Review](https://github.com/tzincker/ai-challenge/workflows/GitHub%20Copilot-Style%20AI%20PR%20Review/badge.svg)](https://github.com/tzincker/ai-challenge/actions)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A modern web service with an intelligent chatbot for an online pet accessories store. The chatbot
provides product information and assistance, accessible only to registered and authenticated users.

## 🚀 Quick Start

### Development Mode

```bash
npm start
```

### Using Node directly

```bash
node --env-file .env .\src\index.js
```

### Run Tests

```bash
npm test
```

---

## 🛠️ Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git** for version control

---

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/tzincker/ai-challenge.git
   cd ai-challenge
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Generate ACCESS_TOKEN_SECRET**

   Use Node.js console to generate a secure token:

   ```javascript
   require('crypto').randomBytes(64).toString('hex');
   ```

   Add the generated token to your `.env` file:

   ```
   ACCESS_TOKEN_SECRET=your_generated_token_here
   ```

---

## 🏗️ Project Structure

```
ai-challenge/
├── 📁 .github/
│   └── workflows/           # GitHub Actions CI/CD
│       ├── ai-pr-comment.yml # AI-powered PR review workflow
│       └── azure-deploy.yml  # Azure deployment workflow
├── 📁 public/              # Static web assets
│   ├── script.js           # Frontend JavaScript
│   └── styles.css          # Frontend styles
├── 📁 src/                 # Main application source
│   ├── 📁 __tests__/       # Test files
│   │   ├── ChatService.test.js
│   │   └── UserService.test.js
│   ├── 📁 data/            # Data layer
│   │   └── users.js        # User data management
│   ├── 📁 requests/        # API request examples
│   │   ├── authenticated_test.request.http
│   │   ├── chat.request.http
│   │   ├── index.request.http
│   │   ├── login.request.http
│   │   ├── logout.request.http
│   │   ├── refresh_token.request.http
│   │   └── register.request.http
│   ├── 📁 services/        # Business logic layer
│   │   ├── ChatService.js  # Chatbot logic & AI integration
│   │   ├── DatabaseService.js # Database operations
│   │   └── UserService.js  # User management
│   ├── 📁 views/           # Template views
│   │   ├── index.pug       # Home page template
│   │   └── register.pug    # Registration page template
│   ├── index.js            # Main application entry point
│   └── knowledge.json      # Knowledge base for chatbot
├── 📄 .env                 # Environment variables (create from .env.example)
├── 📄 .env.example         # Environment variables template
├── 📄 .eslintrc.js         # ESLint configuration
├── 📄 .eslintignore        # ESLint ignore patterns
├── 📄 .gitignore           # Git ignore patterns
├── 📄 .prettierrc          # Prettier configuration
├── 📄 Azure-deploy-steps.md # Azure deployment guide
├── 📄 CONTRIBUTING.md      # Contribution guidelines
├── 📄 Dockerfile           # Container configuration
├── 📄 jest.config.js       # Jest testing configuration
├── 📄 LICENSE              # ISC License
├── 📄 package.json         # Project dependencies and scripts
├── 📄 package-lock.json    # Locked dependency versions
├── 📄 README.md           # Project documentation
└── 📄 user-stories.md      # User stories and team assignments
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# JWT Authentication
ACCESS_TOKEN_SECRET=your_64_char_secret_token_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Database (if using external DB)
# DATABASE_URL=your_database_url_here

# OpenAI API (for enhanced chatbot features)
# OPENAI_API_KEY=your_openai_api_key_here
```

---

## ✨ Key Features

### 🔐 Authentication & Security

- **JWT-based authentication** with secure token generation
- **Password hashing** using bcrypt for security
- **Protected routes** requiring valid authentication
- **Token refresh** mechanism for extended sessions

### 🤖 Intelligent Chatbot

- **RAG-powered responses** using knowledge base
- **Product information** and recommendations
- **Context-aware conversations**
- **Fuzzy search** capabilities for flexible queries
- **OpenAI integration** ready for enhanced AI features

### 🚀 Modern Development Stack

- **Node.js + Express** backend architecture
- **SQLite** database for lightweight data storage
- **Pug templates** for server-side rendering
- **Jest testing** framework with comprehensive coverage
- **ESLint + Prettier** for code quality
- **GitHub Actions** for CI/CD automation

### 📡 RESTful API Endpoints

- `POST /users/register` - User registration
- `POST /users/login` - User authentication
- `POST /users/logout` - User logout
- `POST /users/refresh` - Token refresh
- `POST /chat` - Protected chatbot interaction
- `GET /` - Home page with registration form

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Test Structure

- **Unit Tests**: Service layer testing
- **Integration Tests**: API endpoint testing
- **Coverage Reports**: Comprehensive code coverage analysis

---

## 📚 API Documentation

### Authentication Flow

1. **Register a new user**

   ```http
   POST /users/register
   Content-Type: application/json

   {
     "email": "user@example.com",
     "password": "securePassword123"
   }
   ```

2. **Login**

   ```http
   POST /users/login
   Content-Type: application/json

   {
     "email": "user@example.com",
     "password": "securePassword123"
   }
   ```

   Response:

   ```json
   {
     "accessToken": "jwt_token_here",
     "refreshToken": "refresh_token_here"
   }
   ```

3. **Chat with the bot** (requires authentication)

   ```http
   POST /chat
   Authorization: Bearer jwt_token_here
   Content-Type: application/json

   {
     "message": "What products do you have for dogs?"
   }
   ```

### Example Requests

Check the `src/requests/` directory for complete HTTP request examples that you can use with tools
like:

- **VS Code REST Client** extension
- **Postman**
- **curl** commands

---

## 🐳 Docker Support

### Build and Run with Docker

```bash
# Build the image
docker build -t pet-chatbot .

# Run the container
docker run -p 3000:3000 --env-file .env pet-chatbot
```

---

## 🚀 Deployment

### Automated Azure Deployment

The project includes automated deployment to Azure using GitHub Actions:

- **Workflow**: `.github/workflows/azure-deploy.yml`
- **Manual Guide**: `Azure-deploy-steps.md`

### Environment Setup for Production

```env
NODE_ENV=production
PORT=80
ACCESS_TOKEN_SECRET=your_production_secret
DATABASE_URL=your_production_database_url
```

### CI/CD Pipeline

The project includes two GitHub Actions workflows:

1. **GitHub Copilot-Style AI Review** (`.github/workflows/ai-pr-comment.yml`) - Intelligent code
   quality analysis with:
   - **Smart script detection** - Only runs available npm scripts
   - **Comprehensive analysis** - ESLint, tests, security audit, formatting
   - **AI-powered reviews** - GitHub Copilot-style feedback
   - **Fallback system** - Ensures reviews even when OpenAI API is unavailable
2. **Azure Deployment** (`.github/workflows/azure-deploy.yml`) - Automated deployment to Azure cloud
   services

---

## 🛠️ Development

### Code Quality Tools

- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **GitHub Actions**: Automated CI/CD pipeline

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Start with file watching (development)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Validate code quality (lint + test)
npm run validate

# Docker commands
npm run docker:build
npm run docker:run
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 🙋‍♂️ Support

If you have any questions or need help:

1. Check the [Issues](https://github.com/tzincker/ai-challenge/issues) page
2. Create a new issue with detailed information
3. Review the API request examples in `src/requests/`

---

## 🗺️ Roadmap

- [ ] Enhanced AI integration with OpenAI GPT models
- [ ] Real-time chat with WebSocket support
- [ ] Admin dashboard for content management
- [ ] Multi-language support
- [ ] Advanced product recommendation engine
- [ ] Integration with external pet store APIs

---

_Built with ❤️ for pet lovers everywhere_
