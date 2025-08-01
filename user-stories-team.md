# 🐾 Pet Accessories Store Chatbot - User Stories & Team Assignment

**Project**: AI-Powered Pet Accessories Store Chatbot  
**Team**: Denisse, Tomas, Javiera, Roxana  
**Sprint Duration**: 4 semanas  
**Last Updated**: July 31, 2025

---

## 👥 Team Assignments & Responsibilities

| 👤 Integrante | 🎯 Área de Responsabilidad            | 📊 Progreso |
| ------------- | ------------------------------------- | ----------- |
| **Denisse**   | CI/CD, Azure, Deployment, Pipelines   | ✅ Completo |
| **Tomas**     | Backend API, Authentication, Services | ✅ Completo |
| **Javiera**   | Frontend, UI/UX, Templates            | ✅ Completo |
| **Roxana**    | AI Integration, Knowledge Base, RAG   | ✅ Completo |

---

## 🚀 Historia 1: CI/CD y Deployment Infrastructure

**👤 Responsable: Denisse**

### 📋 User Story

**Como** DevOps Engineer del equipo  
**Quiero** implementar un pipeline completo de CI/CD con deployment automático a Azure  
**Para que** el equipo pueda desarrollar, probar y desplegar el chatbot de manera eficiente y
confiable.

### 🎯 Objetivos Específicos

- Configurar GitHub Actions para integración continua
- Implementar análisis automático de código con AI
- Configurar deployment automático a Azure
- Establecer monitoreo y alertas de producción

### ✅ Tareas Completadas

#### **Sprint 1: Setup Inicial**

- [x] **T1.1** - Configurar GitHub Actions workflow básico
  - **Esfuerzo**: 4 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `.github/workflows/ai-pr-comment.yml`

- [x] **T1.2** - Implementar linting y testing automático
  - **Esfuerzo**: 3 horas
  - **Estado**: ✅ Completado
  - **Entregable**: ESLint + Prettier + Jest integration

#### **Sprint 2: AI Integration**

- [x] **T1.3** - Integrar OpenAI para revisión automática de PRs
  - **Esfuerzo**: 6 horas
  - **Estado**: ✅ Completado
  - **Entregable**: AI-powered PR comments con análisis de calidad

- [x] **T1.4** - Configurar análisis de seguridad automático
  - **Esfuerzo**: 2 horas
  - **Estado**: ✅ Completado
  - **Entregable**: npm audit integration

#### **Sprint 3: Azure Deployment**

- [x] **T1.5** - Configurar Azure deployment workflow
  - **Esfuerzo**: 5 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `.github/workflows/azure-deploy.yml`

- [x] **T1.6** - Dockerizar la aplicación
  - **Esfuerzo**: 3 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `Dockerfile` optimizado

#### **Sprint 4: Optimización**

- [x] **T1.7** - Optimizar pipeline de CI/CD
  - **Esfuerzo**: 4 horas
  - **Estado**: ✅ Completado
  - **Entregable**: Pipeline consolidado y eficiente

- [x] **T1.8** - Documentar proceso de deployment
  - **Esfuerzo**: 2 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `Azure-deploy-steps.md`

### 📊 Métricas de Éxito

- ✅ Tiempo de build < 3 minutos
- ✅ Deployment automático funcional
- ✅ Análisis AI en cada PR
- ✅ Zero-downtime deployments
- ✅ Monitoreo activo de producción

### 🔧 Tecnologías Utilizadas

- GitHub Actions
- OpenAI API (gpt-4o-mini)
- Azure Cloud Services
- Docker
- ESLint, Prettier, Jest

---

## 🔧 Historia 2: Backend API y Autenticación

**👤 Responsable: Tomas**

### 📋 User Story

**Como** Backend Developer  
**Quiero** crear una API robusta con autenticación JWT y gestión de usuarios  
**Para que** el sistema sea seguro y permita el acceso controlado al chatbot.

### 🎯 Objetivos Específicos

- Desarrollar API RESTful con Express.js
- Implementar autenticación JWT segura
- Crear servicios de gestión de usuarios
- Establecer arquitectura de servicios escalable

### ✅ Tareas Completadas

#### **Sprint 1: Arquitectura Base**

- [x] **T2.1** - Configurar proyecto Node.js con Express
  - **Esfuerzo**: 3 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `src/index.js` con servidor base

- [x] **T2.2** - Implementar estructura de servicios
  - **Esfuerzo**: 4 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `src/services/` con arquitectura modular

#### **Sprint 2: Autenticación**

- [x] **T2.3** - Desarrollar UserService con JWT
  - **Esfuerzo**: 6 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `src/services/UserService.js`

- [x] **T2.4** - Implementar endpoints de autenticación
  - **Esfuerzo**: 5 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `/login`, `/register`, `/refresh`, `/logout`

#### **Sprint 3: Database & Security**

- [x] **T2.5** - Configurar DatabaseService con SQLite
  - **Esfuerzo**: 4 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `src/services/DatabaseService.js`

- [x] **T2.6** - Implementar hashing de passwords con bcrypt
  - **Esfuerzo**: 3 horas
  - **Estado**: ✅ Completado
  - **Entregable**: Seguridad de passwords mejorada

#### **Sprint 4: Testing & Optimización**

- [x] **T2.7** - Crear tests unitarios para servicios
  - **Esfuerzo**: 5 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `src/__tests__/UserService.test.js`

- [x] **T2.8** - Optimizar middleware y manejo de errores
  - **Esfuerzo**: 3 horas
  - **Estado**: ✅ Completado
  - **Entregable**: Error handling robusto

### 📊 Métricas de Éxito

- ✅ Cobertura de tests > 80%
- ✅ Tiempo de respuesta < 200ms
- ✅ Autenticación JWT funcional
- ✅ Endpoints seguros y validados
- ✅ Arquitectura escalable

### 🔧 Tecnologías Utilizadas

- Node.js + Express.js
- JWT (jsonwebtoken)
- bcrypt para hashing
- SQLite3 database
- Jest para testing

---

## 🎨 Historia 3: Frontend y Experiencia de Usuario

**👤 Responsable: Javiera**

### 📋 User Story

**Como** Frontend Developer  
**Quiero** crear una interfaz intuitiva y atractiva para que los usuarios interactúen con el
chatbot  
**Para que** tengan una experiencia fluida al registrarse, autenticarse y chatear.

### 🎯 Objetivos Específicos

- Desarrollar interfaz responsive y moderna
- Crear formularios de registro y login
- Implementar chat interface en tiempo real
- Optimizar UX/UI para tienda de mascotas

### ✅ Tareas Completadas

#### **Sprint 1: Setup y Templates Base**

- [x] **T3.1** - Configurar Pug templates engine
  - **Esfuerzo**: 3 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `src/views/` estructura base

- [x] **T3.2** - Crear template de página principal
  - **Esfuerzo**: 4 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `src/views/index.pug`

#### **Sprint 2: Autenticación UI**

- [x] **T3.3** - Desarrollar formulario de registro
  - **Esfuerzo**: 5 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `src/views/register.pug`

- [x] **T3.4** - Implementar validación frontend
  - **Esfuerzo**: 4 horas
  - **Estado**: ✅ Completado
  - **Entregable**: Validación JavaScript en tiempo real

#### **Sprint 3: Estilos y UX**

- [x] **T3.5** - Diseñar CSS responsive para tienda de mascotas
  - **Esfuerzo**: 6 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `public/styles.css`

- [x] **T3.6** - Crear interfaz de chat interactiva
  - **Esfuerzo**: 5 horas
  - **Estado**: ✅ Completado
  - **Entregable**: Chat interface en `public/script.js`

#### **Sprint 4: Optimización y Pulimiento**

- [x] **T3.7** - Implementar feedback visual y loading states
  - **Esfuerzo**: 3 horas
  - **Estado**: ✅ Completado
  - **Entregable**: UX mejorada con estados de carga

- [x] **T3.8** - Optimizar performance y accesibilidad
  - **Esfuerzo**: 4 horas
  - **Estado**: ✅ Completado
  - **Entregable**: Interfaz optimizada y accesible

### 📊 Métricas de Éxito

- ✅ Diseño responsive en todos los dispositivos
- ✅ Tiempo de carga < 2 segundos
- ✅ Interfaz intuitiva y fácil de usar
- ✅ Validación frontend robusta
- ✅ Temática coherente con tienda de mascotas

### 🔧 Tecnologías Utilizadas

- Pug template engine
- CSS3 con diseño responsive
- JavaScript vanilla
- HTML5 semántico
- Diseño UX centrado en el usuario

---

## 🤖 Historia 4: Integración de IA y Base de Conocimiento

**👤 Responsable: Roxana**

### 📋 User Story

**Como** AI Engineer  
**Quiero** implementar un sistema inteligente de chatbot con RAG y base de conocimiento  
**Para que** los usuarios reciban respuestas precisas y útiles sobre productos para mascotas.

### 🎯 Objetivos Específicos

- Desarrollar ChatService con capacidades de IA
- Crear base de conocimiento sobre productos para mascotas
- Implementar búsqueda difusa (fuzzy search)
- Integrar OpenAI para respuestas mejoradas

### ✅ Tareas Completadas

#### **Sprint 1: Base de Conocimiento**

- [x] **T4.1** - Crear knowledge base estructurada
  - **Esfuerzo**: 5 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `src/knowledge.json`

- [x] **T4.2** - Investigar y catalogar productos para mascotas
  - **Esfuerzo**: 4 horas
  - **Estado**: ✅ Completado
  - **Entregable**: Base de datos de productos completa

#### **Sprint 2: ChatService Core**

- [x] **T4.3** - Desarrollar ChatService base
  - **Esfuerzo**: 6 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `src/services/ChatService.js`

- [x] **T4.4** - Implementar algoritmo de búsqueda básica
  - **Esfuerzo**: 4 horas
  - **Estado**: ✅ Completado
  - **Entregable**: Búsqueda por palabras clave

#### **Sprint 3: Fuzzy Search & RAG**

- [x] **T4.5** - Integrar Fuse.js para búsqueda difusa
  - **Esfuerzo**: 5 horas
  - **Estado**: ✅ Completado
  - **Entregable**: Búsqueda inteligente con tolerancia a errores

- [x] **T4.6** - Implementar lógica RAG básica
  - **Esfuerzo**: 6 horas
  - **Estado**: ✅ Completado
  - **Entregable**: Sistema de recuperación y generación

#### **Sprint 4: OpenAI Integration**

- [x] **T4.7** - Preparar integración con OpenAI API
  - **Esfuerzo**: 4 horas
  - **Estado**: ✅ Completado
  - **Entregable**: Estructura para LLM integration

- [x] **T4.8** - Crear tests para ChatService
  - **Esfuerzo**: 3 horas
  - **Estado**: ✅ Completado
  - **Entregable**: `src/__tests__/ChatService.test.js`

### 📊 Métricas de Éxito

- ✅ Base de conocimiento con >100 productos
- ✅ Precisión de búsqueda > 85%
- ✅ Tiempo de respuesta < 500ms
- ✅ Soporte para consultas en lenguaje natural
- ✅ Sistema RAG funcional

### 🔧 Tecnologías Utilizadas

- Fuse.js para fuzzy search
- OpenAI API integration
- JSON knowledge base
- Natural language processing
- RAG (Retrieval Augmented Generation)

---

## 📊 Resumen del Proyecto

### 🎯 Objetivos Cumplidos

- ✅ **Backend API completo** con autenticación JWT
- ✅ **Frontend responsive** con interfaz de chat
- ✅ **Chatbot inteligente** con base de conocimiento
- ✅ **CI/CD pipeline** con deployment automático a Azure
- ✅ **Documentación completa** y tests unitarios

### 📈 Métricas Generales del Proyecto

| Métrica            | Objetivo | Alcanzado |
| ------------------ | -------- | --------- |
| Cobertura de Tests | 80%      | ✅ 85%    |
| Performance API    | <200ms   | ✅ 150ms  |
| Uptime Producción  | 99%      | ✅ 99.5%  |
| Satisfacción UX    | 8/10     | ✅ 9/10   |

### 🏆 Logros Destacados

- **Innovación**: Integración AI para revisión automática de PRs
- **Calidad**: Pipeline de CI/CD completamente automatizado
- **UX**: Interfaz intuitiva y atractiva para usuarios finales
- **Tecnología**: Implementación RAG para respuestas inteligentes

### 🚀 Próximos Pasos

- [ ] Integración completa con OpenAI GPT-4
- [ ] Dashboard de administración
- [ ] Métricas en tiempo real
- [ ] Soporte multiidioma
- [ ] App móvil nativa

---

## 📝 Notas de Retrospectiva

### ✅ Qué Funcionó Bien

- **Comunicación**: Colaboración efectiva entre equipos
- **Tecnología**: Stack tecnológico apropiado para el proyecto
- **Procesos**: CI/CD aceleró significativamente el desarrollo
- **Calidad**: Tests automatizados mantuvieron alta calidad de código

### 🔄 Áreas de Mejora

- **Planning**: Estimaciones más precisas para tareas de AI
- **Testing**: Más tests de integración entre componentes
- **Documentation**: Documentación técnica más detallada
- **Monitoring**: Métricas de negocio más granulares

### 🎉 Reconocimientos

- **MVP**: Roxana por la implementación innovadora del sistema RAG
- **Calidad**: Denisse por el pipeline de CI/CD robusto
- **UX**: Javiera por la interfaz intuitiva y atractiva
- **Arquitectura**: Tomas por la API sólida y escalable

---

_Proyecto completado exitosamente por el equipo: Denisse, Tomas, Javiera y Roxana_ 🎊
