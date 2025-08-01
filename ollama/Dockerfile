FROM ollama/ollama:latest

EXPOSE 11434

# Script para iniciar Ollama y descargar el modelo
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
