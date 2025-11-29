# Guía de Instalación para Windows

## 🐛 Problema: Error con better-sqlite3

Si ves este error al ejecutar `npm install`:

```
gyp ERR! find VS could not find a version of Visual Studio 2017 or newer to use
```

Es porque `better-sqlite3` necesita compilar código nativo.

## ✅ Soluciones

### Solución 1: Instalar Visual Studio Build Tools (Recomendado para Producción)

#### Método A: Instalador Gráfico

1. **Descargar**: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

2. **Ejecutar instalador** y seleccionar:
   - ✓ Desktop development with C++
   - ✓ MSVC v143 - VS 2022 C++ x64/x86 build tools
   - ✓ Windows 10/11 SDK

3. **Reiniciar terminal** y ejecutar:
   ```bash
   npm install
   ```

#### Método B: Chocolatey (Automático)

PowerShell **como Administrador**:

```powershell
# Instalar Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar Build Tools
choco install visualstudio2022buildtools -y --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"

# Cerrar y abrir nueva terminal
npm install
```

#### Método C: windows-build-tools (Deprecado pero funciona)

PowerShell **como Administrador**:

```powershell
npm install --global windows-build-tools
```

### Solución 2: Usar sql.js (Sin compilación - Recomendado para Desarrollo Rápido)

**Ventajas:**
- ✅ No requiere Visual Studio
- ✅ Instalación instantánea
- ✅ SQLite completo en JavaScript/WASM
- ✅ Compatible con el código existente

**Desventajas:**
- ⚠️ Ligeramente más lento que better-sqlite3
- ⚠️ Requiere guardar manualmente (ya implementado en el código)

**Pasos:**

Ya está configurado en el proyecto. Solo ejecuta:

```bash
npm install
```

El proyecto detectará automáticamente si usar `better-sqlite3` o `sql.js`.

### Solución 3: Usar PostgreSQL (Para Producción Grande)

Si planeas tener muchas reglas y alto tráfico:

```bash
# Instalar PostgreSQL
choco install postgresql -y

# Actualizar package.json para usar pg
npm install pg
```

Luego modifica `web/database/database.ts` para usar PostgreSQL.

## 🚀 Verificación

Después de instalar, verifica:

```bash
# Limpiar caché
npm cache clean --force

# Reinstalar
npm install

# Debe ver: "added X packages" sin errores
```

## 🔍 Troubleshooting

### Error: "EPERM: operation not permitted"

```bash
# Cerrar VS Code y otras apps que puedan estar bloqueando archivos
# Ejecutar como Administrador:
npm install --force
```

### Error: "Python not found"

```bash
# Instalar Python 3.x
choco install python -y

# Verificar
python --version
```

### Error: "node-gyp rebuild failed"

```bash
# Opción 1: Instalar node-gyp globalmente
npm install -g node-gyp

# Opción 2: Usar versión específica de Node.js
nvm install 20.10.0
nvm use 20.10.0
```

### Limpiar todo y empezar de nuevo

```bash
# Eliminar node_modules
rm -rf node_modules
rm -rf web\frontend\node_modules

# Eliminar package-lock
rm package-lock.json
rm web\frontend\package-lock.json

# Reinstalar
npm install
cd web\frontend
npm install
```

## 📋 Checklist de Instalación

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] Python 3.x instalado (para node-gyp)
- [ ] Visual Studio Build Tools instalado **O** usando sql.js
- [ ] `npm install` completado sin errores
- [ ] `cd web\frontend && npm install` completado
- [ ] Archivo `.env` creado
- [ ] Backend arranca: `npm run dev`
- [ ] Frontend arranca: `cd web\frontend && npm run dev`

## 💡 Recomendación

Para desarrollo local inicial:
- **Usar sql.js** (ya configurado) - instalación inmediata

Para producción:
- **Instalar Build Tools** y usar better-sqlite3 - mejor performance

## 🆘 Si nada funciona

Contacta al equipo con:
1. Versión de Node: `node --version`
2. Versión de npm: `npm --version`
3. Sistema operativo: `winver`
4. Log completo del error

