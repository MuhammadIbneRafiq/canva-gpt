const { chatAgentPrompt } = require("./prompts.js");
const { StructuredOutputParser } = require("@langchain/core/output_parsers");
const { ChatGroq } = require("@langchain/groq");
const readline = require("readline");
const dotenv = require("dotenv");

dotenv.config();

class Agent {
    constructor() {
        this._model = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: "llama3-70b-8192",
        });
    }

    async replyToChat(chatHistory, canvasContext = '') {
        const prompt = `
            You are an AI assistant helping students interact with assignments or other course-related details from Canvas LMS.
            Relevant information from Canvas:
            ${canvasContext}

            Chat history:
            ${chatHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}

            Please provide a helpful response based on the chat history and Canvas information.
        `;

        const parser = StructuredOutputParser.fromNamesAndDescriptions({
            content: "Next message to the conversation",
            is_final: `For a message to be final, the client confirmed that the project summary is correct. In case your current message is the project summary, set this field to 'True'. 
              
              However if the user is sending another message after the project summary, set this to 'false'
              
              This field is a boolean. It can be 'true' or 'false'`,
            search_needed:
              "If there is a need to search for a project set this field to 'true', this field must be boolean only. If it is not needed, set this field to 'false'.",
        });

        const chain = chatAgentPrompt.pipe(this._model).pipe(parser);

        // Invoke the chain and ensure we return all expected properties
        const output = await chain.invoke({
            history: prompt,
            format_instructions: parser.getFormatInstructions(),
        });

        // Return the response with all necessary fields explicitly set
        return {
            content: output.content || "",
            is_final: output.is_final !== undefined ? output.is_final : false,
            search_needed: output.search_needed !== undefined ? output.search_needed : false,
        };
    }
}

async function getUserPrompt() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question("Enter your question about the assignment: ", (userInput) => {
            rl.close();
            resolve(userInput);
        });
    });
}

async function main() {
    const agent = new Agent();
    
    const canvasContext = `
    Assignment Name: Homework 4,mn
    Description: The homework problems are described here: Submit your solution as a PDF (preferably, typeset) by the posted deadline.
    Due Date: 2025-03-16
    Points Possible: 10
    Assignment Link: https://canvas.tue.nl/courses/29099/assignments/130854
    `;

    while (true) {
        const userPrompt = await getUserPrompt();
        if (userPrompt.toLowerCase() === 'exit') break;

        const chatHistory = [{ sender: "user", content: userPrompt }];
        const output = await agent.replyToChat(chatHistory, canvasContext);

        console.log('AI Assistant:', output.content);
    }
}

// Call the main function
main().catch(error => {
    console.error('Error in main function:', error);
});