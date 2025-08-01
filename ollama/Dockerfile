FROM ollama/ollama:latest

# Pre-descarga el modelo mistral
RUN ollama pull mistral

EXPOSE 11434

CMD ["ollama", "serve"]
