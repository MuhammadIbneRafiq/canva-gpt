const { ChatPromptTemplate } = require("@langchain/core/prompts");

const chatAgentPrompt = ChatPromptTemplate.fromTemplate(
`You are an expert student assistant coach to help students stay productive
 for exams and planning for course studies.
----------
Here is the chat history up to now:
{history}
----------
{format_instructions}`)


module.exports = {
    chatAgentPrompt,
};