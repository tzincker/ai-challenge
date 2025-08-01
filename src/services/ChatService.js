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
    console.log(`📚 Knowledge base recargado: ${this.knowledge.length} entradas`);
  }
  /* v8 ignore stop */

  //Retrieve relevant context and build prompts for LLM
  buildPrompt(userQuestion) {
    // Find exact match (ignoring case)
    let context = "";
    let answer = "";
    let matchedQuestion = "";
    
    // 1. Buscar coincidencia exacta
    const exactMatch = this.knowledge.find(
      (item) =>
        item.question.trim().toLowerCase() === userQuestion.trim().toLowerCase()
    );
    
    if (exactMatch) {
      context = exactMatch.answer;
      answer = exactMatch.answer;
      matchedQuestion = exactMatch.question;
      console.log(`✅ Coincidencia exacta encontrada: ${exactMatch.question}`);
      return { prompt: "", answer, found: true, matchedQuestion, type: "exact" };
    }

    // 2. Buscar con Fuse.js (búsqueda difusa)
    const fuseResults = this.fuse.search(userQuestion);
    if (fuseResults.length > 0) {
      const bestMatch = fuseResults[0].item;
      context = bestMatch.answer;
      answer = bestMatch.answer;
      matchedQuestion = bestMatch.question;
      console.log(`🔍 Coincidencia difusa encontrada: ${bestMatch.question} (score: ${fuseResults[0].score})`);
      return { prompt: "", answer, found: true, matchedQuestion, type: "fuzzy" };
    }

    // 3. Buscar palabras clave en preguntas y respuestas
    const keywordMatch = this.findKeywordMatch(userQuestion);
    if (keywordMatch) {
      context = keywordMatch.answer;
      answer = keywordMatch.answer;
      matchedQuestion = keywordMatch.question;
      console.log(`🔑 Coincidencia por palabras clave encontrada: ${keywordMatch.question}`);
      return { prompt: "", answer, found: true, matchedQuestion, type: "keyword" };
    }

    // 4. Si no encuentra nada, construir prompt para LLM
    const prompt = `You are a friendly assistant at a Pet Accessories Store. The customer asked: "${userQuestion}". Please provide a helpful response about pet products, accessories, or store services. Be enthusiastic and suggest relevant products when appropriate.`;
    console.log(`❓ No se encontró coincidencia, usando LLM para: ${userQuestion}`);
    return { prompt, answer: "", found: false, matchedQuestion: "", type: "llm" };
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
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful and friendly assistant for a Pet Accessories Store. Always respond in English. Be enthusiastic about pets and helpful in finding the right products. Use emojis occasionally to make responses more engaging. Keep responses concise but informative."
          },
          { role: "user", content: prompt },
        ],
      });
      return completion.choices[0].message.content.trim();
    } catch (err) {
      console.error("Error calling OpenAI:", err);
      return "I'm sorry, I'm having trouble processing your request right now. Please try asking about our pet products again, or feel free to browse our selection of collars, toys, and accessories! 🐾";
    }
  }

  // Determine if the question is relevant to the pet store
  isRelevantQuestion(question) {
    const q = question.toLowerCase();
    
    // Greeting words - these are always relevant and handled by knowledge base
    const greetings = [
      "hello", "hi", "hey", "good morning", "good afternoon", "good evening",
      "hola", "buenos días", "buenas tardes", "buenas noches", "saludos"
    ];
    
    // Courtesy words - these are always relevant
    const courtesy = [
      "help", "thank you", "thanks", "goodbye", "bye", "what can you help",
      "about your store", "contact", "ayuda", "gracias", "adiós", "tienda"
    ];
    
    // Keywords for products, pets, shopping, shipping, etc.
    const keywords = [
      "mascota", "perro", "gato", "collar", "juguete", "accesorio", "envío",
      "producto", "tienda", "comprar", "venta", "alimento", "comida", "cama",
      "transportadora", "arnés", "correa", "pelota", "rascador", "plato",
      "bebedero", "ropa", "hueso", "premio", "snack", "limpieza", "baño",
      "cepillo", "antipulgas", "veterinario", "seguridad", "entrega", "pedido",
      "stock", "oferta", "descuento", "marca", "tamaño", "material", "animal",
      "pet", "dog", "cat", "order", "shipping", "delivery", "store",
      "accessory", "toy", "food", "bed", "leash", "harness", "bowl", "treat",
      "vet", "brand", "size", "material", "safe", "wash", "clean",
      "machine washable", "durable", "reflective", "nylon", "cuero",
      "personalizado", "personalizada"
    ];
    
    // Check if it contains greetings, courtesy, or product keywords
    if (greetings.some((g) => q.includes(g))) return true;
    if (courtesy.some((c) => q.includes(c))) return true;
    if (keywords.some((k) => q.includes(k))) return true;
    
    // If it is too short or generic, not relevant
    if (q.length < 3) return false;
    
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
      console.error("No se pudo agregar a knowledge.json:", err);
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
