
  # GoldenTale Mobile Web App

  This is a code bundle for the GoldenTale Mobile Web App. The original project is available at https://www.figma.com/design/XIbyxmhOicdCjGGp2tQFIi/StoryCircle-Mobile-Web-App.

  ## Running the code

  ### 1. Install dependencies

  Run `npm i` in the repo root to install the frontend dependencies.

  The backend is a FastAPI app managed with Poetry. To install its dependencies, run:

  ```bash
  cd backend
  poetry install
  cd ..
  ```

  ### 2. Start backend + frontend together

  The recording flow and guided assistant need the backend running on port `8000` so the frontend can call `/conversations/token` (and `/stories`, `/admin`) through the Vite dev proxy.

  From the repo root, run:

  ```bash
  npm run dev:full
  ```

  This script:

  - starts the FastAPI backend on `http://localhost:8000`
  - then starts the Vite dev server on `http://localhost:3000`

  Open `http://localhost:3000` in your browser and use the “Tell your story” flow; the “start conversation” button will call the backend to obtain a conversation token.

  ### 3. Running only the frontend (no backend)

  If you just want to see the UI without backend calls, you can still run:

  ```bash
  npm run dev
  ```

  In this mode, `/conversations/token` will fail because no backend is listening on port `8000`, and the recording button will show an error message when you try to start the guided assistant.

  ### 4. ElevenLabs configuration

  For live conversations (not just the UI), export these environment variables before starting the backend or place them in a `.env` file at the **repo root** (next to the `backend` folder):

  - `STORYCIRCLE_ELEVENLABS_API_KEY` – your ElevenLabs API key
  - `STORYCIRCLE_ELEVENLABS_AGENT_ID` – the agent ID used for conversations

  The backend reads these with the `STORYCIRCLE_` prefix from the root `.env` file. Without a valid API key it will return a development token and the UI will show a message asking you to configure these values.
  
