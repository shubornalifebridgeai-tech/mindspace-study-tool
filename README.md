
import { GoogleGenerativeAI } from "shubornalifebridgeai-tech/study_spark";

const API_KEY = "AIzaSyB_agA1jJn52FKxd0hUeWvbv9ZGYMloOXI";

const genAI = new GoogleGenerativeAI(API_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('generateBtn');
    const input = document.getElementById('textInput');
    const output = document.getElementById('output');

    button.addEventListener('click', async () => {
        const text = input.value.trim();
        if (!text) {
            output.innerHTML = '<p class="error">Provide text input!</p>';
            return;
        }

        button.disabled = true;
        button.textContent = 'Generating...';
        output.innerHTML = '<p class="loading">Creating summary... Please wait.</p>';

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `Write a concise, well-written summary of the following text (in one paragraph): ${text}`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const summary = response.text();

            output.innerHTML = `<h3>Summary:</h3><p>${summary}</p>`;
        } catch (error) {
            console.error("Error:", error);
            output.innerHTML = `<p class="error">Error occurred: ${error.message}. Check API key or internet.</p>`;
        } finally {
            button.disabled = false;
            button.textContent = 'Generate Summary';
        }
    });
});
