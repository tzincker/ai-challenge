#!/bin/sh

# Inicia el servidor Ollama en segundo plano
ollama serve &

# Espera a que el servidor esté listo (5 segundos)
sleep 5

# Intenta descargar el modelo
ollama pull mistral

# Mantiene el proceso principal vivo
wait
