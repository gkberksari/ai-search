# Company Applicant List - Next.js with GraphQL

A modern web application for managing and filtering company job applicants. Built with Next.js and GraphQL, featuring AI-powered natural language filtering capabilities.

## Features

- 🚀 Built with Next.js 14 App Router
- 🔗 GraphQL integration with Apollo Client
- 🤖 AI-powered filtering with Google's Gemini AI
- 🎨 Modern UI with Tailwind CSS and Shadcn/UI components
- 📱 Fully responsive design
- 🔍 Natural language search capabilities
- ⌨️ Command bar with keyboard shortcuts
- 📊 Advanced data table with sorting and filtering
- 📄 Resume preview functionality

## Tech Stack

- **Frontend:**
  - Next.js 14
  - TypeScript
  - Tailwind CSS
  - Shadcn/UI Components
  - Apollo Client for GraphQL
  - TanStack Table (React Table)
- **AI Integration:**
  - Google Generative AI (Gemini 1.5 Pro)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/ozanisgor/job-applicant-management-app-nextjs-typescript-graphql.git
cd job-applicant-management-app-nextjs-typescript-graphql
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables: Create a `.env.local` file in the root directory with the following variables:

```
# API URL for the application
NEXT_PUBLIC_API_URL=https://your_api_url_here/graphql

# API Token for authentication
NEXT_PUBLIC_API_TOKEN=your_api_token_here

# Gemini AI API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000/talent-pool](http://localhost:3000/talent-pool) with your browser to see the application.

## Features in Detail

### AI-Powered Filtering

The application uses Google's Gemini AI to process natural language queries and convert them into structured filters for the GraphQL API. Users can type queries like:

- "Candidates with a salary expectation between 1,000 and 1,500 Euro/month"
- "Find all applicants from Germany with Salary expectation above 2,000 Euro/month"

### Advanced Data Table

The talent pool features a powerful data table with:

- Sorting functionality
- Multiple filter options
- Infinite scroll / Pagination
- Column visibility toggle
- Mobile-responsive design

### Applicant Profiles

View detailed applicant information including:

- Personal details
- Resume preview
- Salary expectations
- Ratings
- Tags and categories
- Application stage

## Using the Command Bar

Access the AI command bar by:

- Clicking the `⌘+K` button in table toolbar
- Using the keyboard shortcut `⌘+K` (macOS) or `Ctrl+K` (Windows/Linux)

Type natural language queries and the AI will convert them to appropriate filters.
