# HealthFirstPriority (HFP)

A secure, modern AI chat interface built with Next.js 14+ for healthcare-related conversations and assistance. Features a clinical yet modern UI aesthetic with real-time streaming responses.

## 🌟 Features

- **🔒 Secure Architecture**: Server-side API proxy to protect sensitive credentials
- **💬 Real-time Chat**: Streaming AI responses with Server-Sent Events (SSE)
- **🎨 Modern UI**: Clinical design with dark mode support and glassmorphism effects
- **📱 Responsive Design**: Mobile-first approach with adaptive layouts
- **🎯 Node Selection**: Multi-node support for different AI conversation contexts
- **⚙️ Customizable Settings**: Light/Dark/System theme preferences, export options
- **📤 Export Functionality**: Export chat history and data
- **♿ Accessible**: Built with accessibility best practices using Radix UI primitives

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
# API Configuration
HFP_API_BASE_URL=<your-api-base-url>
HFP_API_KEY=<your-api-key>

# Optional: Additional configuration
# NODE_ENV=development
```

> **Important**: Never commit `.env` files to version control. The `.gitignore` file already excludes them.

#### Environment Variables Explained

- `HFP_API_BASE_URL`: The base URL for your AI API endpoint
- `HFP_API_KEY`: Your API authentication key for secure access

> **Note**: These environment variables are only accessible server-side through the `/api/chat` route, ensuring your API credentials are never exposed to the client.

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
│   │   │   └── chat/
│   │   │       └── route.ts   # Server-side API proxy
│   │   ├── globals.css        # Global styles & theme variables
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── chat/              # Chat-related components
│   │   │   ├── ChatArea.tsx   # Message display area
│   │   │   ├── ChatHeader.tsx # Header with node selector
│   │   │   ├── ChatInput.tsx  # Message input field
│   │   │   ├── ChatInterface.tsx  # Main chat interface
│   │   │   ├── ChatMessage.tsx    # Individual message component
│   │   │   └── NodeSelector.tsx   # Node selection dropdown
│   │   ├── layout/            # Layout components
│   │   │   └── AppShell.tsx   # Main app shell
│   │   ├── settings/          # Settings components
│   │   │   └── SettingsDialog.tsx # Settings modal
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   └── sheet.tsx
│   │   └── ThemeInitializer.tsx  # Dark mode initializer
│   ├── hooks/                 # Custom React hooks
│   │   └── useTheme.ts        # Theme management hook
│   ├── lib/                   # Utility libraries
│   │   ├── api-client.ts      # Frontend API client
│   │   ├── export-utils.ts    # Export functionality
│   │   └── utils.ts           # General utilities
│   └── types/                 # TypeScript type definitions
├── .env                       # Environment variables (gitignored)
├── .gitignore                 # Git ignore rules
├── components.json            # shadcn/ui configuration
├── eslint.config.mjs          # ESLint configuration
├── next.config.ts             # Next.js configuration
├── package.json               # Project dependencies
├── postcss.config.mjs         # PostCSS configuration
├── tsconfig.json              # TypeScript configuration
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

### Vercel (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `HFP_API_BASE_URL`
   - `HFP_API_KEY`
4. Deploy

### Environment Variables on Vercel

> **Critical**: Ensure `HFP_API_BASE_URL` and `HFP_API_KEY` are set in your Vercel project settings under **Settings → Environment Variables** before deploying.

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