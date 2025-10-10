<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StudySpark - AI Summary Tool</title>
  <script type="module">
    import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

    const API_KEY = "AIzaSyCnwYwvSDGIF4Q9Hcc5W3PF6hiqAuuewsw";
    const genAI = new GoogleGenerativeAI(API_KEY);

    const button = document.getElementById("button");
    const input = document.getElementById("input");
    const output = document.getElementById("output");
    const themeBtn = document.getElementById("theme-btn");

    function toggleTheme() {
      document.documentElement.classList.toggle("dark");
      document.documentElement.classList.toggle("light");
    }

    async function generateSummary() {
      const textInput = input.value.trim();
      if (textInput === "") {
        output.innerHTML =
          '<p class="text-red-500 font-semibold">Provide text input!</p>';
        return;
      }

      button.disabled = true;
      button.textContent = "Generating...";
      button.classList.add("generating-animation");
      output.innerHTML =
        '<p class="text-blue-500">Creating summary... Please wait.</p>';

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Write a concise, well-written summary of the following text:\n\n${textInput}`;
        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        output.innerHTML = `
          <h3 class="font-semibold mb-2 text-accent-primary">Summary:</h3>
          <p class="whitespace-pre-wrap">${summary}</p>
        `;
      } catch (err) {
        output.innerHTML = `<p class="text-red-500 font-semibold">Error occurred: ${err.message}</p>`;
      } finally {
        button.disabled = false;
        button.textContent = "Generate Summary";
        button.classList.remove("generating-animation");
      }
    }

    document.addEventListener("DOMContentLoaded", () => {
      document.getElementById("button").addEventListener("click", generateSummary);
      document
        .getElementById("input")
        .addEventListener("keydown", (e) => {
          if (e.key === "Enter" && e.ctrlKey) generateSummary();
        });
      document
        .getElementById("theme-btn")
        .addEventListener("click", toggleTheme);
    });
  </script>

  <style>
    :root {
      --primary: #2563eb;
      --bg-light: #f9fafb;
      --bg-dark: #111827;
      --text-light: #111827;
      --text-dark: #f9fafb;
    }
    html.light {
      background: var(--bg-light);
      color: var(--text-light);
    }
    html.dark {
      background: var(--bg-dark);
      color: var(--text-dark);
    }
    body {
      font-family: "Poppins", sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 1rem;
      transition: all 0.3s ease;
    }
    h1 {
      font-size: 1.8rem;
      color: var(--primary);
      margin-bottom: 1rem;
    }
    textarea {
      width: 90%;
      max-width: 600px;
      height: 150px;
      padding: 10px;
      border: 2px solid var(--primary);
      border-radius: 10px;
      resize: none;
      font-size: 1rem;
    }
    button {
      margin-top: 10px;
      background-color: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      font-size: 1rem;
      cursor: pointer;
      transition: 0.2s;
    }
    button:hover {
      opacity: 0.9;
    }
    #output {
      margin-top: 20px;
      max-width: 600px;
      text-align: left;
      font-size: 1rem;
      line-height: 1.5;
    }
    .generating-animation {
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    #theme-btn {
      position: absolute;
      top: 15px;
      right: 15px;
      background: transparent;
      border: 2px solid var(--primary);
      color: var(--primary);
      border-radius: 50%;
      padding: 8px;
      cursor: pointer;
    }
  </style>
</head>
<body class="light">
  <button id="theme-btn">🌙</button>
  <h1>✨ StudySpark AI Summary ✨</h1>
  <textarea id="input" placeholder="Write or paste your text here..."></textarea>
  <button id="button">Generate Summary</button>
  <div id="output"></div>
</body>
</html>