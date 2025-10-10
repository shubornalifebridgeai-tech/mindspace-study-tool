 <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StudySpark - Secure AI Summary</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f9fafb;
            color: #111;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        textarea {
            width: 90%;
            max-width: 600px;
            height: 150px;
            padding: 10px;
            border: 2px solid #2563eb;
            border-radius: 8px;
            resize: none;
            font-size: 1rem;
        }
        button {
            margin-top: 10px;
            background-color: #2563eb;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 20px;
            font-size: 1rem;
            cursor: pointer;
        }
        #output {
            margin-top: 20px;
            max-width: 600px;
            text-align: left;
        }
    </style>
</head>
<body>
    <h1>✨ StudySpark AI Summary (Secure) ✨</h1>
    <textarea id="input" placeholder="Write or paste your text..."></textarea>
    <button id="button">Generate Summary</button>
    <div id="output"></div>

    <script>
        const input = document.getElementById("input");
        const button = document.getElementById("button");
        const output = document.getElementById("output");

        button.addEventListener("click", async () => {
            const text = input.value.trim();
            if (!text) {
                output.innerHTML = "<p>Please enter some text!</p>";
                return;
            }
            output.innerHTML = "<p>Generating summary...</p>";

            try {
                // TODO: Replace 'http://localhost:5000/api/summary' with your deployed backend URL
                // e.g., 'https://your-backend-domain.com/api/summary'
                const res = await fetch("http://localhost:5000/api/summary", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ text })
                });
                const data = await res.json();
                if (data.summary) {
                    output.innerHTML = `<p><strong>Summary:</strong><br>${data.summary}</p>`;
                } else {
                    output.innerHTML = `<p>${data.error}</p>`;
                }
            } catch (err) {
                output.innerHTML = `<p>Error: ${err.message}</p>`;
                // Common deployment fix: If backend is not on localhost, update the URL above.
            }
        });
    </script>
</body>
</html>