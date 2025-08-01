const fs = require('fs');
const path = require('path');
const express = require('express');
const Fuse = require('fuse.js');
const { OpenAI } = require('openai');
const Ollama = require('ollama');

const knowledgePath = path.join(__dirname, '../knowledge.json');

class ChatService {
  constructor(overrideKnowledge) {
    // Initialize OpenAI
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Initialize Ollama if configured
    if (process.env.OLLAMA_ENABLED === 'true') {
      this.ollama = new Ollama({
        host: process.env.OLLAMA_HOST || 'http://localhost:11434',
      });
    }

    /* v8 ignore start */
    this.knowledge = overrideKnowledge || this._loadKnowledgeData();
    /* v8 ignore stop */

    // Initialize Fuse.js for fuzzy similarity
    this.fuse = new Fuse(this.knowledge, {
      keys: [
        { name: 'question', weight: 0.7 },
        { name: 'answer', weight: 0.3 },
      ],
      threshold: 0.4, // Más estricto para mejor precisión
      distance: 100, // Permite coincidencias en un rango más amplio
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 3,
      shouldSort: true,
      findAllMatches: true,
      useExtendedSearch: true, // Habilita búsqueda avanzada
    });
  }

  /* v8 ignore start */
  _loadKnowledgeData() {
    // Loading the Knowledge Base
    let knowledge = [];
    try {
      const raw = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
      // If Knowledge.json has an array under 'faqs', use it
      knowledge = Array.isArray(raw.faqs) ? raw.faqs : [];
      return knowledge;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Could not load knowledge.json:', err);
    }
  }

  // Recharge the knowledge base and update Fuse
  reloadKnowledge() {
    this.knowledge = this._loadKnowledgeData();
    this.fuse.setCollection(this.knowledge);
    // eslint-disable-next-line no-console
    console.log(
      '📚 Knowledge base reloaded:',
      this.knowledge.length,
      'entries'
    );
  }
  /* v8 ignore stop */

  //Retrieve relevant context and build prompts for LLM
  buildPrompt(userQuestion) {
    const result = {
      found: false,
      answer: '',
      prompt: `Context: \n\nYou are a friendly assistant at a Pet Accessories Store. The customer asked: "${userQuestion}". Please provide a helpful response about pet products, accessories, or store services. Be enthusiastic and suggest relevant products when appropriate.`,
    };

    // Exact match first
    const exactMatch = this.knowledge.find(
      k => k.question.toLowerCase() === userQuestion.toLowerCase()
    );

    if (exactMatch) {
      result.found = true;
      result.answer = exactMatch.answer;
      result.prompt = `Context: ${exactMatch.answer}\n\nAnswer the customer's question about: "${userQuestion}"`;
      // eslint-disable-next-line no-console
      console.log('✓ Exact match found:', userQuestion);
      return result;
    }

    // Try fuzzy matching with improved algorithm
    const fuzzyMatch = this.findKeywordMatch(userQuestion);
    if (fuzzyMatch) {
      result.found = true;
      result.answer = fuzzyMatch.answer;
      result.prompt = `Context: ${fuzzyMatch.answer}\n\nThe customer asked about: "${userQuestion}". Use the context to provide a helpful and relevant response.`;
      // eslint-disable-next-line no-console
      console.log('✓ Fuzzy match found:', fuzzyMatch.question);
      return result;
    }

    // If no match found, try to find partial matches in the knowledge base
    const fuseResults = this.fuse.search(userQuestion);
    if (fuseResults.length > 0) {
      const topMatches = fuseResults
        .slice(0, 2)
        .filter(r => r.score < 0.6)
        .map(r => r.item.answer)
        .join('\n\n');

      if (topMatches) {
        result.found = true;
        result.prompt = `Context: ${topMatches}\n\nThe customer asked: "${userQuestion}". Use the context to provide a helpful response, focusing on the most relevant information.`;
        // eslint-disable-next-line no-console
        console.log('✓ Partial matches found');
      }
    }

    return result;
  }

  // Improved method for keyword matching search
  findKeywordMatch(userQuestion) {
    const userWords = userQuestion
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2);
    if (userWords.length === 0) return null;

    // First try with Fuse.js
    const fuseResults = this.fuse.search(userQuestion);
    if (fuseResults.length > 0 && fuseResults[0].score < 0.4) {
      return fuseResults[0].item;
    }

    // If Fuse.js doesn't find good results, use custom search.
    let bestMatch = null;
    let maxScore = 0;

    for (const item of this.knowledge) {
      const itemText = (item.question + ' ' + item.answer).toLowerCase();
      const questionWords = item.question.toLowerCase().split(/\s+/);

      let score = 0;
      let lastMatchIndex = -1;
      let consecutiveMatches = 0;

      // Evaluate matches of complete words and proximity
      for (const userWord of userWords) {
        // Find exact matches first
        let found = false;
        questionWords.forEach((qWord, index) => {
          if (qWord === userWord) {
            score += 3;
            found = true;

            // Bonus for consecutive words
            if (lastMatchIndex !== -1 && index === lastMatchIndex + 1) {
              consecutiveMatches++;
              score += consecutiveMatches * 2;
            }
            lastMatchIndex = index;
          }
        });

        // If there is no exact match, look for partial matches.
        if (!found) {
          if (itemText.includes(userWord)) {
            score += 2;
          } else {
            // Search for partial matches with a minimum threshold
            const similarWords = questionWords.filter(
              qWord => qWord.includes(userWord) || userWord.includes(qWord)
            );
            if (similarWords.length > 0) {
              score += 1;
            }
          }
        }
      }

      // Bonus for full phrase match
      const phraseBonus = itemText.includes(userQuestion.toLowerCase()) ? 5 : 0;
      score += phraseBonus;

      // Length factor - prefer more specific matches
      score *= 1 + Math.min(userWords.length / 10, 0.5);

      if (score > maxScore) {
        maxScore = score;
        bestMatch = item;
      }
    }

    // Only return if the score is high enough
    return maxScore >= Math.max(2, userWords.length) ? bestMatch : null;
  }

  // Call the LLM with fallback options
  async callLLM(prompt) {
    try {
      // Intentar primero con OpenAI
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant for a pet accessories store.',
            },
            { role: 'user', content: prompt },
          ],
        });
        return completion.choices[0].message.content.trim();
      } catch (openAiError) {
        console.log('OpenAI error:', openAiError.message);

        // Fallback a Ollama si está habilitado
        if (this.ollama && process.env.OLLAMA_ENABLED === 'true') {
          try {
            console.log('Falling back to Ollama');
            const response = await this.ollama.chat({
              model: process.env.OLLAMA_MODEL || 'mistral',
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a helpful assistant for a pet accessories store.',
                },
                {
                  role: 'user',
                  content: prompt,
                },
              ],
            });
            return response.message.content.trim();
          } catch (ollamaError) {
            // eslint-disable-next-line no-console
            console.error('Ollama error:', ollamaError);
          }
        }

        // Si Ollama falla o no está habilitado, usar el matching local con Fuse
        const matches = this.fuse.search(prompt);
        if (matches.length > 0) {
          return matches[0].item.answer;
        }
        return "I'm sorry, I'm having trouble processing your request right now. Please try again.";
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al procesar la pregunta:', error);
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

    const petKeywords = [
      'pet',
      'dog',
      'cat',
      'collar',
      'food',
      'toy',
      'leash',
      'bowl',
    ];
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
        // eslint-disable-next-line no-console
        console.log('Question is not relevant:', question);
        return false;
      }

      const knowledgeData = JSON.parse(
        fs.readFileSync(this.knowledgePath, 'utf8')
      );

      // Ensure faqs is an array
      if (!Array.isArray(knowledgeData.faqs)) {
        knowledgeData.faqs = [];
      }

      // Check for duplicates
      const isDuplicate = knowledgeData.faqs.some(
        item => item.question.toLowerCase() === question.toLowerCase()
      );

      if (isDuplicate) {
        return false;
      }

      // Add new FAQ
      knowledgeData.faqs.push({
        id: 'FAQ' + (knowledgeData.faqs.length + 1).toString().padStart(3, '0'),
        question,
        answer,
      });

      fs.writeFileSync(
        this.knowledgePath,
        JSON.stringify(knowledgeData, null, 2),
        'utf8'
      );

      // Update Fuse with the new question
      this.fuse.setCollection(knowledgeData.faqs);

      // eslint-disable-next-line no-console
      console.log('✅ New FAQ added to knowledge base:', question);
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error adding to knowledge.json:', error);
      return false;
    }
  }

  // Returns an Express router with the chat endpoint
  /* v8 ignore start */
  getRouter() {
    const router = express.Router();

    // Reload knowledge base on startup
    this.reloadKnowledge();

    router.post('/', async (req, res) => {
      const { question } = req.body;
      if (!question) {
        return res.json({ answer: 'Please write a question.' });
      }

      // eslint-disable-next-line no-console
      console.log(`💬 Question received: "${question}"`);

      // Use the new improved search logic
      const { prompt, answer, found, matchedQuestion, type } =
        this.buildPrompt(question);

      if (found) {
        // If a match was found in the knowledge base, respond directly
        // eslint-disable-next-line no-console
        console.log(
          `✅ Responding from knowledge base (${type}): ${matchedQuestion}`
        );
        return res.json({
          answer: answer.replace(/\\n/g, '\n'),
          source: 'knowledge_base',
          type: type,
          matched_question: matchedQuestion,
        });
      }

      // If nothing was found, use LLM only if it is relevant
      if (!this.isRelevantQuestion(question)) {
        // eslint-disable-next-line no-console
        console.log(`❌ Question not relevant for pet store: ${question}`);
        return res.json({
          answer:
            "Hello! I'm a specialized assistant for pet accessories and products. I'd love to help you find something amazing for your furry friend! 🐾 Are you looking for collars, toys, beds, food bowls, or something else for your pet?",
        });
      }

      // Use LLM for relevant question
      // eslint-disable-next-line no-console
      console.log(`🤖 Querying LLM for relevant question: ${question}`);
      const aiAnswer = await this.callLLM(prompt);

      // Add the new question/answer to the knowledge base
      this.addToKnowledge(question, aiAnswer);

      return res.json({
        answer: aiAnswer,
        source: 'llm',
        type: 'generated',
      });
    });
    return router;
  }
  /* v8 ignore stop */
}

module.exports = ChatService;
