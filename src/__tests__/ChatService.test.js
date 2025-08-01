const ChatService = require('../services/ChatService');
const express = require('express');
const fs = require('fs');
const { OpenAI } = require('openai');

jest.mock('openai');
jest.mock('fs');

describe('ChatService', () => {
  let chatService;
  let mockKnowledge;

  beforeEach(() => {
    mockKnowledge = [
      { question: 'What is a dog?', answer: 'A dog is a pet.' },
      { question: 'What is a cat?', answer: 'A cat is a pet.' }
    ];
    fs.readFileSync.mockReturnValue(JSON.stringify({ faqs: mockKnowledge }));
    chatService = new ChatService(mockKnowledge);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      expect(result.prompt).toContain('Context: ');
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
    it('returns false for irrelevant question', () => {
      expect(chatService.isRelevantQuestion('ozymandias arthropod chimera magic drill machine chair table hydrogen')).toBe(false);
    });

    it('returns false for irrelevant very question', () => {
      expect(chatService.isRelevantQuestion('lol x')).toBe(false);
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

    it('should throw an error if it cannot add  to the file', () => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
      const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((path, data) => cb(new Error('fail')))
      chatService.isRelevantQuestion = jest.fn().mockReturnValue(true);
      chatService.addToKnowledge('Q', 'A');
      expect(spy).toHaveBeenCalled();
    });

  });

  describe('getRouter', () => {
    it('returns an express router', () => {
      const router = chatService.getRouter();
      expect(router).toBeInstanceOf(express.Router().constructor);
    });

    it('returns an express router', () => {
      const router = chatService.getRouter();
      expect(router).toBeInstanceOf(express.Router().constructor);
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
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
      OpenAI.prototype.chat = {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('fail'))
        }
      };
      const result = await chatService.callLLM('Prompt');
      expect(result).toMatch(/Lo siento/);
    });
  });
});
