import ngrok from "@ngrok/ngrok";
import dotenv from "dotenv";

dotenv.config();

async function startNgrok() {
  try {
    // Create tunnel (returns a Listener object)
    const listener = await ngrok.forward({
      addr: 3000, // your backend port
      authtoken: process.env.NGROK_AUTHTOKEN,
    });

    // Get the URL from the listener
    console.log("🚀 Ngrok tunnel running at:", listener.url());

    // Keep the process alive (optional, prevents script from exiting immediately)
    process.stdin.resume(); 
  } catch (error) {
    console.error("❌ Error starting ngrok:", error);
  }
}

startNgrok();