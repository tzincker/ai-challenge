FROM ollama/ollama:latest

# Crear directorio para modelos y establecer permisos
RUN mkdir -p /models && \
    chmod 755 /models

# Instalar herramientas necesarias
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /

ENV OLLAMA_MODELS=/models

# Script para iniciar el servidor y descargar el modelo
COPY <<EOF /start.sh
#!/bin/bash
ollama serve &
sleep 5
ollama pull mistral
wait
EOF

RUN chmod +x /start.sh

EXPOSE 11434

ENTRYPOINT ["/start.sh"]