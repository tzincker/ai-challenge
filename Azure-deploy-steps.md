# Paso a Paso: Desplegar Proyecto desde GitHub a Azure con Docker y Azure Web App

Esta guía te ayudará a desplegar tu proyecto desde GitHub hasta Azure usando Docker y Azure Web App.
Sigue cada paso cuidadosamente.

---

## 1. Conectar al cliente de Azure

Abre tu terminal y ejecuta el siguiente comando para iniciar sesión en Azure:

```bash
az login --user <username> --password <password>
```

---

## 2. Crear una Identidad Administrada Asignada por Usuario (User Assigned Managed Identity)

Puedes crear la identidad desde el portal de Azure o usando la CLI, según tu arquitectura. Esta
identidad se usará para asignar permisos a los recursos.

---

## 3. Crear la Entidad de Servicio (Service Principal) con permisos

Ejecuta en la consola:

```bash
az ad sp create-for-rbac --name IArg70Cluster --role "Contributor" --scope /subscriptions/e40e28d8-f53d-43b8-898b-2c93dc9ef814/resourceGroups/rg_grupo70 --sdk-auth --output json
```

Guarda el JSON que te devuelve este comando.

Luego, ve a tu repositorio en GitHub:

- Navega a **Settings > Secrets and variables > Actions > New repository secret**.
- Crea el secreto llamado `AZURE_CREDENTIALS` y pega el JSON guardado.

---

## 4. Crear la Web App en Azure Portal

Desde el portal de Azure:

1. Ve a **App Services**.
2. Haz clic en **Create** y selecciona **Web App**.
3. En la configuración:
   - Selecciona **Publish: Docker Container (Select from containers)**.
   - Escoge tu suscripción, grupo de recursos, región y un nombre para la Web App (sin guiones).
   - Agrega asignación de rol: crea una asignación con rol **Contributor**.
   - Selecciona la **Managed Identity** creada en el paso anterior.

---

## 5. Crear Azure Container Registry (ACR)

Ejecuta los siguientes comandos para crear y verificar tu registro de contenedores:

```bash
az acr create --resource-group rg_grupo70 --name iapocchallenge --sku Basic
az acr list --resource-group rg_grupo70 --output table
```

---

## 6. Crear variables de ambiente en GitHub

En tu repositorio de GitHub, ve a **Settings > Secrets and variables > Actions** y crea las
siguientes variables:

- `AZURE_RESOURCE_GROUP` → con tu grupo de recursos (ejemplo: `rg_grupo70`)
- `AZURE_CREDENTIALS` → con el JSON del Service Principal (paso 3)

---

## 7. Crear archivo GitHub Actions workflow

Crea el archivo `.github/workflows/workflow.yml` con el siguiente contenido. Este workflow construye
tu imagen Docker, la sube a ACR y actualiza tu Web App en Azure automáticamente cuando haces push a
la rama `main`.

```yaml
name: Build and Deploy

on:
  push:
    branches:
      - main

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v3

      - name: Login to Azure
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Build Docker image
        run: |
          docker build -t iapocchallenge.azurecr.io/myapp:${{ github.sha }} .
        working-directory: ./hello-world-api

      - name: Login to Azure Container Registry
        run: az acr login --name iapocchallenge

      - name: Push Docker image to ACR
        run: |
          docker push iapocchallenge.azurecr.io/myapp:${{ github.sha }}

      - name: Configure Azure Web App to use Docker image
        run: |
          az webapp config container set \
            --name IArg70Cluster \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --docker-custom-image-name iapocchallenge.azurecr.io/myapp:${{ github.sha }}

      - name: Restart Azure Web App
        run: |
          az webapp restart \
            --name IArg70Cluster \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }}
```

---

## 8. Agregar el puerto en la WebApp

IR a webapp: IACHALLENGE70 Ir a setting: Ir a Environment variables Agregar WEBSITES_PORT y el
puerto de escucha (3000) o el 8080
