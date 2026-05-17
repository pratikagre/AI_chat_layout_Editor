# Approach Note

## System Architecture
This project implements a Chat-Based Layout Agent by decoupling the visual representation from the underlying logical operations. It consists of:
- A React-based frontend that maintains chat history and renders a wireframe layout in real-time.
- An Express backend that acts as an orchestration layer, taking the user's natural language and mapping it into actionable JSON updates using an LLM.

## LLM Prompt Engineering
The system prompt is the core reasoning block of the agent. I structured it by:
1. **Defining the Agent Role**: Giving the LLM a clear persona as a "layout transformation agent."
2. **Rules for Transformations**: Explaining explicitly the difference between normalized (\`nx\`, \`ny\`, \`nw\`, \`nh\`) and absolute (\`x\`, \`y\`, \`width\`, \`height\`) coordinates.
3. **Semantic Roles Mapping**: Giving the model heuristics (e.g. "Product" means center-focused, large image; "Headline" is the largest text) so it knows what element is being referenced without needing exact IDs from the user.
4. **Constraining Output**: Instructing it to return strictly a JSON object with an \`explanation\` and an \`updatedLayout\` key.

## JSON Transformations Safety
Safety is ensured through backend logic:
- The backend parses the LLM output robustly, looking for JSON blocks inside code markers if the LLM hallucinated markdown format.
- A \`jsonValidator.js\` script confirms that the required \`rootNodes\` and \`nodes\` structures exist.
- Helper functions like \`resizeArtboard\` and \`moveNode\` are available for complex programmatic transformations (e.g. "Convert to 9:16") that shouldn't be left entirely to the LLM's math capabilities. Currently, the LLM is instructed to do the math and layout logic directly, but fallback heuristic helpers are integrated in the backend that could be hooked into tool calls.

## Maintaining Conversation Context
I maintained context by keeping a \`messages\` array in the React frontend. For each API request, I slice the last 6 messages and send them alongside the current \`layout\`. This allows the LLM to process instructions like "Make it smaller" by looking back at the chat context and figuring out what "it" refers to.

## Trade-offs and Future Improvements
1. **LLM Mathematical Limitations**: Currently, the LLM modifies coordinates directly. In a production scenario, I would implement "Function Calling" / "Tools" where the LLM just outputs the *intent* (e.g. \`resizeNode(id, scale)\`) and the exact math is executed by the Node.js backend. This guarantees mathematical precision when resizing a canvas.
2. **Visual Fidelity**: The wireframe uses simple colored \`div\`s. I would implement an HTML5 Canvas or SVG renderer for more precise visualization, especially for texts that span multiple lines or scaled images.
3. **Mock Fallback**: To facilitate testing out-of-the-box, I implemented a mock fallback if no Anthropic key is provided. The mock uses simple regex matches, but an API key is required to use the full features.
