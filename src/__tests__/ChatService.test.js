const ChatService = require('../services/ChatService');
const express = require('express');
const fs = require('fs');
const { OpenAI } = require('openai');

jest.mock('openai');
jest.mock('fs');

describe('ChatService', () => {
  let chatService;
  let mockKnowledge;
  let consoleErrorSpy;

  beforeEach(() => {
    mockKnowledge = [
      { question: 'What is a dog?', answer: 'A dog is a pet.' },
      { question: 'What is a cat?', answer: 'A cat is a pet.' }
    ];
    fs.readFileSync.mockReturnValue(JSON.stringify({ faqs: mockKnowledge }));
    chatService = new ChatService(mockKnowledge);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('buildPrompt', () => {
    it('returns correct prompt and answer for exact match', () => {
      const result = chatService.buildPrompt('What is a dog?');
      expect(result.found).toBe(true);
      expect(result.answer).toBe('A dog is a pet.');
      expect(result.prompt).toContain('Context: A dog is a pet.');
    });

    it('returns prompt with empty context for no match', () => {
      const result = chatService.buildPrompt('Unknown question');
      expect(result.found).toBe(false);
      expect(result.answer).toBe('');
      expect(result.prompt).toContain('Context:');
    });

    it('handles case insensitive matching', () => {
      const result = chatService.buildPrompt('WHAT IS A DOG?');
      expect(result.found).toBe(true);
      expect(result.answer).toBe('A dog is a pet.');
    });

    it('handles partial matches in knowledge base', () => {
      const result = chatService.buildPrompt('dog');
      expect(result.prompt).toContain('Context:');
    });
  });

  describe('isRelevantQuestion', () => {
    it('returns true for relevant keywords', () => {
      expect(chatService.isRelevantQuestion('How to buy a dog collar?')).toBe(true);
    });

    it('returns false for greetings', () => {
      expect(chatService.isRelevantQuestion('Hello!')).toBe(false);
    });

    it('returns false for short/generic', () => {
      expect(chatService.isRelevantQuestion('Hi')).toBe(false);
    });

    it('returns false for irrelevant question', () => {
      expect(chatService.isRelevantQuestion('ozymandias')).toBe(false);
    });

    it('returns false for complex irrelevant question', () => {
      expect(chatService.isRelevantQuestion('ozymandias arthropod chimera magic drill machine chair table hydrogen')).toBe(false);
    });

    it('returns false for very short irrelevant question', () => {
      expect(chatService.isRelevantQuestion('lol x')).toBe(false);
    });

    it('returns true for pet-related questions', () => {
      expect(chatService.isRelevantQuestion('What food should I give my pet?')).toBe(true);
      expect(chatService.isRelevantQuestion('How to train a dog?')).toBe(true);
      expect(chatService.isRelevantQuestion('Cat behavior problems')).toBe(true);
    });

    it('handles empty or null input', () => {
      expect(chatService.isRelevantQuestion('')).toBe(false);
      expect(() => chatService.isRelevantQuestion(null)).toThrow(TypeError);
      expect(() => chatService.isRelevantQuestion(undefined)).toThrow(TypeError);
    });
  });

  describe('addToKnowledge', () => {
    it('does not add irrelevant questions', () => {
      chatService.isRelevantQuestion = jest.fn().mockReturnValue(false);
      chatService.addToKnowledge('Hi', 'Hello!');
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
    it('adds but faqs is not an array', () => {
      chatService.isRelevantQuestion = jest.fn().mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ faqs: { name: "perro"} }));
      fs.writeFileSync.mockClear();
      chatService.addToKnowledge('What is a leash?', 'A leash is...');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    it('adds relevant and non-existing question', () => {
      chatService.isRelevantQuestion = jest.fn().mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ faqs: [] }));
      fs.writeFileSync.mockClear();
      chatService.addToKnowledge('What is a leash?', 'A leash is...');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    it('does not add duplicate question', () => {
      chatService.isRelevantQuestion = jest.fn().mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({ faqs: [{ question: 'Q', answer: 'A' }] }));
      chatService.addToKnowledge('Q', 'A');
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should throw an error if it cannot read the file', () => {
      const spy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File read failed');
      });
      chatService.isRelevantQuestion = jest.fn().mockReturnValue(true);
      chatService.addToKnowledge('Q', 'A');
      expect(spy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding to knowledge.json:', expect.any(Error));
      spy.mockRestore();
    });

  });

  describe('getRouter', () => {
    it('returns an express router', () => {
      const router = chatService.getRouter();
      expect(router).toBeInstanceOf(express.Router().constructor);
    });

    it('router has correct routes configured', () => {
      const router = chatService.getRouter();
      expect(router.stack).toBeDefined();
      expect(router.stack.length).toBeGreaterThan(0);
    });
  });

  describe('callLLM', () => {
    it('returns AI answer from OpenAI', async () => {
      const mockContent = 'AI response.';
      OpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: mockContent } }]
          })
        }
      };
      const result = await chatService.callLLM('Prompt');
      expect(result).toBe(mockContent);
    });

    it('returns fallback on error', async () => {
      OpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('API failed'))
        }
      };
      const result = await chatService.callLLM('Prompt');
      expect(result).toMatch(/I'm sorry/);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error calling OpenAI:', expect.any(Error));
    });

    it('handles empty response from OpenAI', async () => {
      OpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: []
          })
        }
      };
      const result = await chatService.callLLM('Prompt');
      expect(result).toMatch(/I'm sorry/);
    });

    it('handles malformed response from OpenAI', async () => {
      OpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: null }]
          })
        }
      };
      const result = await chatService.callLLM('Prompt');
      expect(result).toMatch(/I'm sorry/);
    });
  });

  // Nuevas pruebas para casos edge y integración
  describe('Integration and Edge Cases', () => {
    it('should handle constructor with empty knowledge', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({ faqs: [] }));
      const emptyChatService = new ChatService();
      expect(emptyChatService.knowledge).toEqual([]);
    });

    it('should handle malformed knowledge.json file', () => {
      fs.readFileSync.mockReturnValue('invalid json');
      expect(() => new ChatService()).not.toThrow();
    });

    it('should handle missing faqs property in knowledge.json', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({ otherProperty: 'value' }));
      const chatService = new ChatService();
      expect(chatService.knowledge).toEqual([]);
    });

    it('should normalize questions for better matching', () => {
      const result1 = chatService.buildPrompt('what is a dog?');
      const result2 = chatService.buildPrompt('What Is A Dog?');
      const result3 = chatService.buildPrompt('WHAT IS A DOG?');
      
      expect(result1.found).toBe(result2.found);
      expect(result2.found).toBe(result3.found);
    });

    it('should handle very long questions', () => {
      const longQuestion = 'a'.repeat(1000) + ' dog ' + 'b'.repeat(1000);
      const result = chatService.isRelevantQuestion(longQuestion);
      expect(typeof result).toBe('boolean');
    });

    it('should prevent duplicate entries in knowledge base', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({ faqs: [{ question: 'Test Q', answer: 'Test A' }] }));
      chatService.isRelevantQuestion = jest.fn().mockReturnValue(true);
      
      chatService.addToKnowledge('Test Q', 'Test A');
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });
});
