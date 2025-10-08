# Product Microservice

A microservice for product management.

## Development Setup

### Prerequisites
- Node.js and npm installed
- Prisma CLI

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nestjs-products-microservice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   # Create .env file based on env.template
   cp env.template .env
   ```

4. **Run Prisma migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

## Environment Variables

Configure your `.env` file with the required variables. See `env.template` for reference.

## Tech Stack

- Node.js
- Prisma ORM
- TypeScript
