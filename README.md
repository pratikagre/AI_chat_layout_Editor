# Chat-Based Layout Agent

This is a full-stack chat-based layout agent built using React, Vite, Express, and Tailwind CSS. It allows users to modify a layout JSON design using natural language.

## Prerequisites
- Node.js v18 or newer
- An Anthropic API Key (or OpenAI API Key if adapted). If no API key is provided, the backend will use a basic mock fallback.

## Setup Instructions

1. **Clone the repository:**
   \`\`\`bash
   git clone <repository_url>
   cd layout-agent
   \`\`\`

2. **Backend Setup:**
   \`\`\`bash
   cd server
   npm install
   \`\`\`
   - Create a \`.env\` file in the \`server\` directory:
     \`\`\`env
     PORT=3001
     ANTHROPIC_API_KEY=your_anthropic_api_key_here
     \`\`\`
   - Start the backend server:
     \`\`\`bash
     npm start # or node index.js
     \`\`\`

3. **Frontend Setup:**
   \`\`\`bash
   cd client
   npm install
   \`\`\`
   - Start the Vite development server:
     \`\`\`bash
     npm run dev
     \`\`\`

## How to Use

1. Open \`http://localhost:5173\` in your browser.
2. The initial layout will be displayed in the JSON viewer and the wireframe preview.
3. Type a command in the chat input, for example:
   - "Convert this design to 9:16"
   - "Keep the product large"
   - "Move the headline to the top"
   - "Move the offer badge higher"
   - "Make the headline smaller"
4. The system will use the LLM to update the JSON layout and return the updated version. The wireframe will immediately reflect the changes.

## Tech Stack
- **Frontend**: React + Vite
- **Styling**: Tailwind CSS v4
- **Backend**: Node.js + Express
- **LLM Integration**: Anthropic SDK (Claude 3 Opus)
- **State Management**: React \`useState\`
- **HTTP Client**: Axios
