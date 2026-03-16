# HealthFirstPriority (HFP)

A secure, modern AI chat interface built with Next.js 14+ for healthcare-related conversations and assistance. Features a clinical yet modern UI aesthetic with real-time streaming responses.

## 🌟 Features

- **🔒 Secure Architecture**: Server-side API proxy to protect sensitive credentials
- **🔐 JWT Authentication**: Full Login, Signup, and Forgot Password flows with a Go backend and bcrypt password hashing
- **💬 Real-time Chat**: Streaming AI responses with Server-Sent Events (SSE)
- **📚 Offline PDF Library**: Upload PDFs to a browser-local IndexedDB knowledge base with instant `@document` referencing and zero server processing limits.
- **🎭 Multi-Persona Support**: Switch between specialized clinical nodes or create up to 3 custom system prompts for personalized AI behavior.
- **🤖 EchoAI Widget**: Integrated EchoAI avatar widget for interactive AI assistance
- **🎨 Modern UI**: Clinical design with dark mode support and glassmorphism effects
- **📱 Responsive Design**: Mobile-first approach with adaptive layouts
- **⚙️ Customizable Settings**: Light/Dark/System theme preferences, fine-grained export options, chat history versioning
- **📤 Export Functionality**: Export chat history across multiple formats (TXT, PDF, MD, CSV, JSON)
- **♿ Accessible**: Built with accessibility best practices using Radix UI primitives

## ✨ Key Capabilities

### 📚 Offline PDF Knowledge Base
The application features a production-grade Document Library with dual-flow processing:
- **Local Storage & Extraction**: Uploaded PDFs are parsed locally (`pdfjs-dist`). It extracts text from normal PDFs and **images from scanned PDFs** using the Canvas API.
- **Multimodal Support**: Scanned documents are formatted as `image_url` arrays for compatibility with modern vision LLMs (e.g., Qwen2-VL, GPT-4o).
- **Context Window Optimization**: Text chunks are heavily compressed before injection (medical-aware stopword removal, boilerplate stripping) and scored by relevance against the user's query, saving 30-50% of token usage.
- **Instant Deduplication**: Files are instantly hashed (SHA-256) upon upload. Re-uploading the same file skips processing instantly.
- **`@mention` Context**: Type `@` in the chat to see an autocomplete list of your uploaded PDFs. Selecting one silently injects the document's optimized context into the LLM.
- *For technical implementation details, see [PDF_KNOWLEDGE_README.md](./PDF_KNOWLEDGE_README.md).*

### 🎭 Multi-Persona AI System
- **Built-in Nodes**: Instantly switch between specialized personas (General Practitioner, Pediatrician, Neurologist, etc.).
- **Custom Personas**: Create and save up to 3 Custom Personas with personalized system prompts in Settings.

### 💬 Advanced Chat Interface
- **Message Version History**: When regenerating AI responses, previous versions are saved. Users can paginate through `v1, v2...` of the AI's answers via left/right arrows.
- **Smart Scrolling**: Custom 'scroll-to-bottom' auto-scroll tracking.
- **Export Control**: Export selective chat sessions as JSON, CSV, PDF, Markdown, or TXT.


## 🛠️ Tech Stack

### Core Framework
- **[Next.js](https://nextjs.org/) 16.1.1** - React framework with App Router
- **[React](https://react.dev/) 19.2.3** - UI library
- **[TypeScript](https://www.typescriptlang.org/) 5.x** - Type safety

### UI Components & Styling
- **[Tailwind CSS](https://tailwindcss.com/) 4.x** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library (New York style)
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
  - Dialog, Dropdown Menu, Label, Popover, Radio Group
  - Scroll Area, Select, Slot
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library
- **[tw-animate-css](https://www.npmjs.com/package/tw-animate-css)** - Animation utilities
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme management (Light/Dark/System)

### Utilities
- **[class-variance-authority](https://cva.style/)** - CVA for component variants
- **[clsx](https://github.com/lukeed/clsx)** - Conditional className utility
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Merge Tailwind classes
- **[cmdk](https://cmdk.paco.me/)** - Command menu for React
- **[react-markdown](https://remarkjs.github.io/react-markdown/)** - Markdown rendering
- **[uuid](https://github.com/uuidjs/uuid)** - Unique ID generation
- **[zustand](https://zustand-demo.pmnd.rs/)** - State management

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **npm** or **yarn** or **pnpm**
- **Git** (for cloning the repository)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HealthFirstPriorty
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env` or `.env.local` file in the root directory with the following variables:

```env
# AI Chat API
HFP_API_BASE_URL=https://ai.nomineelife.com

# Authentication API (Go orchestrator on production server)
AUTH_API_BASE_URL=https://dev-ai.nomineelife.com/api/auth

# Local development fallback (used when Go brain runs locally)
NEXT_PUBLIC_API_URL=http://localhost:8095/api/auth
```

> **Important**: Never commit `.env` files to version control. The `.gitignore` file already excludes them.

#### Environment Variables Explained

| Variable | Purpose | Example |
| :--- | :--- | :--- |
| `HFP_API_BASE_URL` | Base URL for the AI chat API endpoint | `https://ai.nomineelife.com` |
| `AUTH_API_BASE_URL` | Production auth API URL (checked first) | `https://dev-ai.nomineelife.com/api/auth` |
| `NEXT_PUBLIC_API_URL` | Local dev fallback for auth API | `http://localhost:8095/api/auth` |

The auth proxy (`src/app/api/auth/[...path]/route.ts`) checks variables in this priority order: `AUTH_API_BASE_URL` → `NEXT_PUBLIC_API_URL` → `HFP_API_BASE_URL` → `http://localhost:8095`.

> **Note**: Server-side environment variables are only accessible through API routes (`/api/chat`, `/api/auth/*`), ensuring credentials are never exposed to the client.

## 🏃 Running the Application

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

Build the application for production:

```bash
npm run build
```

### Start Production Server

After building, start the production server:

```bash
npm run start
```

### Linting

Run ESLint to check code quality:

```bash
npm run lint
```

## 📁 Project Structure

```
HealthFirstPriorty/
├── public/                     # Static assets
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...path]/
│   │   │   │       └── route.ts   # Auth API proxy (login, signup, etc.)
│   │   │   ├── chat/
│   │   │   │   └── route.ts       # Chat API proxy
│   │   │   └── nodes/
│   │   │       └── route.ts       # Node info API
│   │   ├── globals.css        # Global styles, themes & widget overrides
│   │   ├── layout.tsx         # Root layout (includes EchoAI widget)
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   │   └── AuthModal.tsx  # Login/Signup/Forgot Password modal
│   │   ├── chat/              # Chat-related components
│   │   │   ├── ChatArea.tsx   # Message display area
│   │   │   ├── ChatHeader.tsx # Header with node selector
│   │   │   ├── ChatInput.tsx  # Message input field
│   │   │   ├── ChatInterface.tsx  # Main chat interface
│   │   │   ├── ChatMessage.tsx    # Individual message component
│   │   │   └── NodeSelector.tsx   # Node selection dropdown
│   │   ├── layout/            # Layout components
│   │   │   ├── AppShell.tsx   # Main app shell
│   │   │   └── Sidebar.tsx    # Navigation sidebar
│   │   ├── settings/          # Settings components
│   │   │   └── SettingsDialog.tsx # Settings modal
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   │   ├── useChatStore.ts    # Chat state management
│   │   └── useUIStore.ts      # UI state management
│   ├── lib/                   # Utility libraries
│   │   ├── api.ts             # Auth API functions (login, signup, etc.)
│   │   ├── api-client.ts      # Chat API client
│   │   ├── export-utils.ts    # Export functionality
│   │   └── utils.ts           # General utilities
│   ├── store/
│   │   └── authStore.ts       # Zustand auth state (JWT, user)
│   └── types/                 # TypeScript type definitions
├── backendLogicForLogin/       # Server deployment files
│   └── server_files/
│       ├── Caddyfile           # Caddy reverse proxy config
│       └── orchestrator.go     # Go auth backend
├── .env                       # Environment variables (gitignored)
├── auth_documentation.md      # Auth architecture documentation
├── components.json            # shadcn/ui configuration
├── next.config.ts             # Next.js configuration
├── package.json               # Project dependencies
└── README.md                  # This file
```

## 🎨 Theming & Customization

### Color Palette

The application features a refined dual-theme system defined in `src/app/globals.css`:

- **Perfect White Theme** (Light Mode):
  - **Background**: Pure white (`hsl(0 0% 100%)`)
  - **Foreground**: Deep slate text (`hsl(222.2 84% 4.9%)`)
  - **Primary**: HFP Teal (`hsl(199 89% 48%)`)

- **HFP Navy Theme** (Dark Mode):
  - **Background**: Deep Navy (`hsl(222.2 47.4% 11.2%)`)
  - **Foreground**: Light gray text (`hsl(210 40% 98%)`)
  - **Card**: Slightly lighter navy (`hsl(224 40% 16%)`)

### Theme Management

The application supports robust theme switching powered by `next-themes`:
- **Light Mode**: Clean, high-contrast clinical white interface.
- **Dark Mode**: Comfortable, low-light navy interface.
- **System**: Automatically syncs with the user's operating system preference.
- **Persistence**: Remembers user choice across sessions via localStorage.

### Tailwind Configuration

Tailwind v4 is configured using `@theme inline` in `globals.css` with custom:
- Color variables
- Border radius scales
- Typography settings

## 🔒 Security Features

### API Proxy Pattern

All API requests are routed through a server-side proxy (`/api/chat`):

1. **Client → Frontend API** (`/api/chat`)
2. **Frontend API → External AI API** (with credentials)
3. **Response streams back** to client

This ensures:
- ✅ API keys never reach the client
- ✅ CORS protection
- ✅ Request validation
- ✅ Error handling

### Implementation

```typescript
// Frontend: src/lib/api-client.ts
await fetch('/api/chat', { /* ... */ })

// Backend: src/app/api/chat/route.ts
// Uses process.env.HFP_API_KEY securely
```

## 🧩 Key Components

### ChatInterface
Main chat component orchestrating the conversation flow.

### ChatMessage
Renders individual messages with:
- Code syntax highlighting (via react-markdown)
- Copy functionality
- Timestamp display
- Role-based styling (user/assistant)

### NodeSelector
Dropdown for selecting different AI conversation contexts/nodes.

### Settings Dialog
Configuration panel for:
- Theme preferences (light/dark mode)
- Export options
- Application settings

## 📦 Adding New Components

This project uses shadcn/ui. To add new components:

```bash
npx shadcn@latest add <component-name>
```

For example:
```bash
npx shadcn@latest add avatar
npx shadcn@latest add card
npx shadcn@latest add tabs
```

## 🌐 Deployment

### Self-Hosted (Current Setup)

The application runs on a server with Caddy as the reverse proxy:

1. Build the Next.js app: `npm run build`
2. Start with PM2: `pm2 start npm --name hfp -- start`
3. Caddy serves traffic on `dev-ai.nomineelife.com`
4. Go orchestrator handles auth on port `8095`

Required environment variables on the server:
- `HFP_API_BASE_URL` — AI chat API base URL
- `AUTH_API_BASE_URL` — Auth API URL
- `JWT_SECRET` — Must be a strong random string in production

### Vercel (Alternative)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `HFP_API_BASE_URL`
   - `AUTH_API_BASE_URL`
4. Deploy

### Other Platforms

The application can be deployed to any platform supporting Next.js:
- **Netlify**
- **AWS Amplify**
- **Railway**
- **Docker** (create a Dockerfile)

Ensure environment variables are properly configured on your chosen platform.

## 🧪 Development Tips

### Hot Reload
The development server supports hot module replacement (HMR). Changes will reflect immediately.

### Type Checking
Run TypeScript type checking:
```bash
npx tsc --noEmit
```

### Component Development
- All UI components are in `src/components/ui/`
- Chat-specific logic is in `src/components/chat/`
- Use the existing component pattern for consistency

### State Management
- Local component state uses React hooks
- Global state uses Zustand (if needed)
- Server state via API routes

## 🐛 Troubleshooting

### Build Errors

**Issue**: Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

**Issue**: TypeScript errors
```bash
npm run lint
npx tsc --noEmit
```

### Runtime Issues

**Issue**: API requests failing
- Verify environment variables are set correctly
- Check `.env` file exists and has correct values
- Ensure API endpoint is accessible

**Issue**: Dark mode not persisting
- Check browser's localStorage is enabled
- Clear browser cache and reload

### Environment Variables Not Working

**Development**:
- Ensure `.env` or `.env.local` exists
- Restart development server after adding variables

**Production** (Vercel):
- Add variables in Vercel dashboard
- Redeploy after adding variables

## 📝 License

[Add your license information here]

## 👥 Contributing

[Add contribution guidelines if applicable]

## 📧 Support

For issues and questions:
- Create an issue in the repository
- Contact: [Add contact information]

---

Built with ❤️ using Next.js and shadcn/ui