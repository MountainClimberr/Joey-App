import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { complete } from "./llm.js";
import { buildSystemPrompt } from "./prompt.js";

// create input/output interface for command line
const rl = readline.createInterface({ input, output });
const history = [{ 
  role: "system", 
  content: buildSystemPrompt({
    firstName: "John",
    recentMoods: ["uncomfortable", "uncomfortable", "uncomfortable"],
  })
}];

while (true) {
  const text = await rl.question("You: ");
  if (text == "exit") break;

  history. push({ role: "user", content: text });
  try {
    const reply = await complete(history);
    history.push({ role: "assistant", content: reply });
    console.log("Joey: " + reply, "\n");
  } catch (error) {
    history.pop();
    console.error("Error:", error.status,error.message, "\n");
  }
}
rl.close();