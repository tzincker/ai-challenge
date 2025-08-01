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
      keys: [
        { name: "question", weight: 0.7 },
        { name: "answer", weight: 0.3 }
      ],
      threshold: 0.6, // Más tolerante para mejor búsqueda
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 3,
      shouldSort: true
    });
  }

  /* v8 ignore start */
  _loadKnowledgeData() {
    // Loading the Knowledge Base
    let knowledge = [];
    try {
      const raw = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));
      // Si knowledge.json tiene un array bajo 'faqs', úsalo
      knowledge = Array.isArray(raw.faqs) ? raw.faqs : [];
      return knowledge;
    } catch (err) {
      console.error("No se pudo cargar knowledge.json:", err);
    }
  }

  // Recargar knowledge base y actualizar Fuse
  reloadKnowledge() {
    this.knowledge = this._loadKnowledgeData();
    this.fuse.setCollection(this.knowledge);
    console.log('📚 Knowledge base reloaded:', this.knowledge.length, 'entries');
  }
  /* v8 ignore stop */

  //Retrieve relevant context and build prompts for LLM
  buildPrompt(userQuestion) {
    const result = {
      found: false,
      answer: '',
      prompt: `Context: \n\nYou are a friendly assistant at a Pet Accessories Store. The customer asked: "${userQuestion}". Please provide a helpful response about pet products, accessories, or store services. Be enthusiastic and suggest relevant products when appropriate.`
    };

    // Exact match
    const exactMatch = this.knowledge.find(k => 
      k.question.toLowerCase() === userQuestion.toLowerCase()
    );

    if (exactMatch) {
      result.found = true;
      result.answer = exactMatch.answer;
      result.prompt = `Context: ${exactMatch.answer}\n\nAnswer the customer's question about: "${userQuestion}"`;
      console.log('✓ Exact match found:', userQuestion);
      return result;
    }

    return result;
  }

  // Nuevo método para buscar por palabras clave
  findKeywordMatch(userQuestion) {
    const userWords = userQuestion.toLowerCase().split(/\s+/);
    let bestMatch = null;
    let maxScore = 0;

    for (const item of this.knowledge) {
      const questionWords = item.question.toLowerCase().split(/\s+/);
      const answerWords = item.answer.toLowerCase().split(/\s+/);
      
      // Contar palabras coincidentes
      let score = 0;
      for (const userWord of userWords) {
        if (userWord.length > 2) { // Ignorar palabras muy cortas
          if (questionWords.some(qw => qw.includes(userWord) || userWord.includes(qw))) score += 2;
          if (answerWords.some(aw => aw.includes(userWord) || userWord.includes(aw))) score += 1;
        }
      }
      
      if (score > maxScore && score >= 2) { // Mínimo 2 puntos para considerar
        maxScore = score;
        bestMatch = item;
      }
    }

    return bestMatch;
  }

  // Call the OpenAI LLM
  async callLLM(prompt) {
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
      });

      if (!completion?.choices?.[0]?.message?.content) {
        return "I'm sorry, I'm having trouble processing your request right now. Please try again.";
      }

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      return "I'm sorry, I'm having trouble processing your request right now. Please try asking about our pet products again!";
    }
  }

  isRelevantQuestion(question) {
    if (question === null || question === undefined) {
      throw new TypeError('Question cannot be null or undefined');
    }

    if (typeof question !== 'string') {
      throw new TypeError('Question must be a string');
    }

    if (question.trim() === '') {
      return false;
    }

    const petKeywords = ['pet', 'dog', 'cat', 'collar', 'food', 'toy', 'leash', 'bowl'];
    const irrelevantWords = ['hello', 'hi', 'hey', 'test'];
    
    question = question.toLowerCase();
    
    if (irrelevantWords.some(word => question.includes(word))) {
      return false;
    }
    
    return petKeywords.some(keyword => question.includes(keyword));
  }

  // Add a new question/answer to the knowledge base only if it is relevant and does not already exist.
  async addToKnowledge(question, answer) {
    try {
      if (!this.isRelevantQuestion(question)) {
        console.log('Question is not relevant:', question);
        return false;
      }

      const knowledgeData = JSON.parse(fs.readFileSync(this.knowledgePath, 'utf8'));
      
      // Ensure faqs is an array
      if (!Array.isArray(knowledgeData.faqs)) {
        knowledgeData.faqs = [];
      }

      // Check for duplicates
      const isDuplicate = knowledgeData.faqs.some(item => 
        item.question.toLowerCase() === question.toLowerCase()
      );

      if (isDuplicate) {
        return false;
      }

      // Add new FAQ
      knowledgeData.faqs.push({
        id: "FAQ" + (knowledgeData.faqs.length + 1).toString().padStart(3, "0"),
        question,
        answer,
      });

      fs.writeFileSync(this.knowledgePath, JSON.stringify(knowledgeData, null, 2), "utf8");
      
      // Update Fuse with the new question
      this.fuse.setCollection(knowledgeData.faqs);

      console.log('✅ New FAQ added to knowledge base:', question);
      return true;
    } catch (error) {
      console.error("Error adding to knowledge.json:", error);
      return false;
    }
  }

  // Returns an Express router with the chat endpoint
  /* v8 ignore start */
  getRouter() {
    const router = express.Router();
    
    // Recargar knowledge base al iniciar
    this.reloadKnowledge();
    
    router.post("/", async (req, res) => {
      const { question } = req.body;
      if (!question) {
        return res.json({ answer: "Por favor, escribe una pregunta." });
      }

      console.log(`💬 Pregunta recibida: "${question}"`);

      // Usar la nueva lógica de búsqueda mejorada
      const { prompt, answer, found, matchedQuestion, type } = this.buildPrompt(question);
      
      if (found) {
        // Si encontró coincidencia en knowledge base, responder directamente
        console.log(`✅ Respondiendo desde knowledge base (${type}): ${matchedQuestion}`);
        return res.json({ 
          answer, 
          source: "knowledge_base",
          type: type,
          matched_question: matchedQuestion 
        });
      }

      // Si no encontró nada, usar LLM solo si es relevante
      if (!this.isRelevantQuestion(question)) {
        console.log(`❌ Pregunta no relevante para tienda de mascotas: ${question}`);
        return res.json({ 
          answer: "Hello! I'm a specialized assistant for pet accessories and products. I'd love to help you find something amazing for your furry friend! 🐾 Are you looking for collars, toys, beds, food bowls, or something else for your pet?" 
        });
      }

      // Usar LLM para pregunta relevante
      console.log(`🤖 Consultando LLM para pregunta relevante: ${question}`);
      const aiAnswer = await this.callLLM(prompt);
      
      // Add the new question/answer to the knowledge base
      this.addToKnowledge(question, aiAnswer);
      
      return res.json({ 
        answer: aiAnswer, 
        source: "llm",
        type: "generated" 
      });
    });
    return router;
  }
  /* v8 ignore stop */
}

module.exports = ChatService;
