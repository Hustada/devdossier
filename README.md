# DevDossier

**AI-Powered Developer Resume Builder**

Transform your GitHub profile into a professional resume with AI-powered expertise. DevDossier analyzes your repositories, extracts technical skills, and crafts compelling professional narratives that showcase your development achievements.

## Features

✨ **AI Resume Expert** - Professional resume writer with 10+ years experience  
🔍 **Smart GitHub Analysis** - Automatically analyzes repositories and code quality  
📊 **Impact-Driven Writing** - Transforms code into compelling achievements  
🎯 **ATS Optimization** - Ensures resumes pass Applicant Tracking Systems  
🎨 **Clean Design** - Simple, professional interface with real-time preview  

## Tech Stack

- **Next.js 15** with App Router and Turbopack
- **TypeScript** for type safety
- **Tailwind CSS** with custom black/white/orange theme
- **Shadcn/ui** for polished components
- **Jest & React Testing Library** for comprehensive testing
- **GitHub OAuth** for secure authentication

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Add your GitHub OAuth credentials
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Build for production
npm run build
```

## Architecture

Built with **Test-Driven Development (TDD)** ensuring robust, maintainable code:

- **Components:** Fully tested React components with TypeScript
- **Services:** GitHub API integration with proper error handling
- **AI Integration:** OpenAI GPT-4 for intelligent resume generation
- **Authentication:** Secure GitHub OAuth flow

## Contributing

This project follows TDD principles. Please ensure all new features include comprehensive tests.

---

*Built with ❤️ for developers who want to showcase their skills professionally*
