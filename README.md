 <script type="module">
    import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

    const API_KEY = "AIzaSyCnwYwvSDGIF4Q9Hcc5W3PF6hiqAuuewsw";
    const genAI = new GoogleGenerativeAI(API_KEY);

    const button = document.getElementById("button");
    const input = document.getElementById("input");
    const output = document.getElementById("output");

    function toggleTheme() {
        const html = document.documentElement;
        html.classList.toggle('light');
        html.classList.toggle('dark');
    }

    async function generateSummary() {
        const textInput = input.value.trim();
        if (textInput === "") {
            output.innerHTML = '<p class="text-red-500 font-semibold">Provide text input!</p>';
            return;
        }

        button.disabled = true;
        button.textContent = "Generating...";
        button.classList.add('generating-animation');
        output.innerHTML = '<p class="text-blue-500">Creating summary... Please wait.</p>';

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Write a concise, well-written summary of the following text: ${textInput}`;
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const summary = await response.text();

            output.innerHTML = `<h3 class="font-semibold mb-2 text-accent-primary">Summary:</h3><p class="whitespace-pre-wrap">${summary}</p>`;
        } catch (err) {
            output.innerHTML = `<p class="text-red-500 font-semibold">Error occurred: ${err.message}</p>`;
        } finally {
            button.disabled = false;
            button.textContent = "Generate Summary";
            button.classList.remove('generating-animation');
        }
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) generateSummary();
    });
</script>
