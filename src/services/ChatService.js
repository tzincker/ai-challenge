const fs = require("fs");
const path = require("path");

const express = require("express");

const Fuse = require("fuse.js");
const { OpenAI } = require("openai");

const knowledgePath = path.join(__dirname, "../knowledge.json");

class ChatService {

  constructor(overrideKnowledge) {

    // Initialize OpenAI
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    /* v8 ignore start */
    this.knowledge = overrideKnowledge || this._loadKnowledgeData();
    /* v8 ignore stop */
    // Initialize Fuse.js for fuzzy similarity
    this.fuse = new Fuse(this.knowledge, {
      keys: ["question"],
      threshold: 0.4, // Adjust for more/less tolerance
    });
  }

  /* v8 ignore start */
  _loadKnowledgeData() {
    // Loading the Knowledge Base
    let knowledge = [];
    try {
      const raw = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));
      // If Knowledge.json has an array under 'faqs', use it
      knowledge = Array.isArray(raw.faqs) ? raw.faqs : [];
      return knowledge;
    } catch (err) {
      console.error("Could not load knowledge.json:", err);
    }
  }
  /* v8 ignore stop */

  //Retrieve relevant context and build prompts for LLM
  buildPrompt(userQuestion) {
    // Find exact match (ignoring case)
    let context = "";
    let answer = "";
    let matchedQuestion = "";
    const match = this.knowledge.find(
      (item) =>
        item.question.trim().toLowerCase() === userQuestion.trim().toLowerCase()
    );
    if (match) {
      context = match.answer;
      answer = match.answer;
      matchedQuestion = match.question;
    }
    // Build contextual prompt
    const prompt = `Context: ${context}\nUser: ${userQuestion}\nAI:`;
    return { prompt, answer, found: !!context, matchedQuestion };
  }

  // Call the OpenAI LLM
  async callLLM(prompt) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant for a pet accessories store.",
          },
          { role: "user", content: prompt },
        ],
      });
      return completion.choices[0].message.content.trim();
    } catch (err) {
      console.error("Error calling OpenAI:", err);
      return "Sorry, I don't have an answer for that question."; 
    }
  }

  // Determine if the question is relevant to the pet store
  isRelevantQuestion(question) {
    const q = question.toLowerCase();
    // Keywords for products, pets, shopping, shipping, etc.
    const keywords = [
      "pet",
      "dog",
      "cat",
      "order",
      "shipping",
      "delivery",
      "store",
      "accessory",
      "toy",
      "food",
      "bed",
      "leash",
      "harness",
      "bowl",
      "treat",
      "vet",
      "brand",
      "size",
      "material",
      "safe",
      "wash",
      "clean",
      "machine washable",
      "durable",
      "reflective",
      "nylon",
      "cuero",
      "personalized"
    ];
    // Words of courtesy or greetings
    const greetings = [
      "hi",
      "hey",
      "thank you",
      "thanks",
      "bye",
    ];
    // If it contains any product/pet keywords, it is relevant
    if (keywords.some((k) => q.includes(k))) return true;
    // If it's just a greeting/courtesy, it's not relevant.
    if (greetings.some((g) => q.includes(g))) return false;
    // If it is too short or generic, neither
    if (q.length < 10) return false;
    // By default, not relevant
    return false;
  }

  // Add a new question/answer to the knowledge base only if it is relevant and does not already exist.
  addToKnowledge(question, answer) {
    if (!this.isRelevantQuestion(question)) {
      // Do not add irrelevant questions
      return;
    }
    try {
      const raw = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));
      const faqs = Array.isArray(raw.faqs) ? raw.faqs : [];
      // Check if the question already exists (exact, ignoring case)
      const exists = faqs.some(
        (faq) =>
          faq.question.trim().toLowerCase() === question.trim().toLowerCase()
      );
      if (exists) return;
      faqs.push({
        id: "FAQ" + (faqs.length + 1).toString().padStart(3, "0"),
        question,
        answer,
      });
      raw.faqs = faqs;
      fs.writeFileSync(knowledgePath, JSON.stringify(raw, null, 2), "utf8");
      // Update Fuse with the new question
      this.fuse.setCollection(faqs);
    } catch (err) {
      console.error("Could not add to knowledge.json:", err);
    }
  }

  // Returns an Express router with the chat endpoint
  /* v8 ignore start */
  getRouter() {
    const router = express.Router();
    router.post("/", async (req, res) => {
      const { question } = req.body;
      if (!question) {
        return res.json({ answer: "Please write a question." });
      }
      // Search for exact match in the knowledge base
      const match = knowledge.find(
        (item) =>
          item.question.trim().toLowerCase() === question.trim().toLowerCase()
      );
      if (match) {
        // If it exists, always respond with the response from the base
        return res.json({ answer: match.answer });
      }
      // If it does not exist, build prompt and consult the LLM
      const { prompt } = this.buildPrompt(question);
      const aiAnswer = await this.callLLM(prompt);
      // Add the new question/answer to the knowledge base
      this.addToKnowledge(question, aiAnswer);
      return res.json({ answer: aiAnswer });
    });
    return router;
  }
  /* v8 ignore stop */
}

module.exports = ChatService;
