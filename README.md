# English Drive 🚗

Aprende inglés de bienes raíces americano mientras manejas.  
Metodología ESCUCHAR → REPETIR → GRAMÁTICA con modo manos libres.

---

## Características

- **Fase 1 — Solo Escucha**: Auto-play con voz americana, 3 repeticiones por oración, pantalla grande
- **Fase 2 — Repite Conmigo**: Pronunciación con micrófono, comparación palabra por palabra, algoritmo SM-2
- **Fase 3 — Gramática**: Fill in the blank con explicación de la regla gramatical
- **50 oraciones** de bienes raíces en 5 grupos temáticos
- **SM-2** (SuperMemo 2) para repetición espaciada inteligente
- **Modo manos libres**: botones enormes (80px+), fuente 28px+
- **Progreso en LocalStorage**: racha de días, oraciones dominadas, meta diaria

---

## Instalación local

### Requisitos
- Node.js 18+ 
- npm 9+

### Pasos

```bash
# 1. Entrar a la carpeta
cd english-drive

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abre http://localhost:5173 en Chrome (recomendado para Web Speech API).

---

## Build para producción (Hostinger)

```bash
npm run build
```

Genera la carpeta `dist/` con todos los archivos estáticos.

### Deploy en Hostinger

1. Ejecuta `npm run build`
2. Entra al panel de control de Hostinger → File Manager
3. Navega a `public_html/` (o el directorio raíz de tu dominio)
4. Sube **todo el contenido** de la carpeta `dist/` 
   - `index.html`
   - carpeta `assets/`
5. Listo. La app funciona como sitio estático.

> **Nota**: Si usas un subdirectorio (ej: `tudominio.com/english-drive/`), 
> actualiza `vite.config.js`:
> ```js
> base: '/english-drive/'
> ```
> Luego vuelve a correr `npm run build`.

---

## Compatibilidad del navegador

| Función           | Chrome | Firefox | Safari | Edge |
|-------------------|--------|---------|--------|------|
| Text-to-Speech    | ✅     | ✅      | ✅     | ✅   |
| SpeechRecognition | ✅     | ❌      | ⚠️ iOS | ✅   |
| LocalStorage      | ✅     | ✅      | ✅     | ✅   |

**Recomendado: Google Chrome** (mejor soporte para Web Speech API).  
En Safari iOS, el reconocimiento de voz puede requerir permisos adicionales.

---

## Estructura del proyecto

```
english-drive/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── data/
    │   ├── sentences.js        # 50 oraciones con fonética y traducción
    │   └── grammarQuestions.js # 35 preguntas fill-in-the-blank
    ├── utils/
    │   ├── sm2.js              # Algoritmo SM-2 completo
    │   └── storage.js          # LocalStorage persistence
    └── components/
        ├── HomeScreen.jsx      # Dashboard con estadísticas
        ├── Phase1Listen.jsx    # Modo escucha (manos libres)
        ├── Phase2Speak.jsx     # Pronunciación con micrófono
        └── Phase3Grammar.jsx   # Gramática interactiva
```

---

## Algoritmo SM-2

El SM-2 (SuperMemo 2) calcula cuándo volver a revisar cada oración:

| Botón    | Calidad | Intervalo siguiente         |
|----------|---------|-----------------------------|
| Otra vez | 0       | 1 día (reinicia)            |
| Difícil  | 2       | 1 día (reinicia)            |
| Bien     | 4       | × ease factor               |
| Fácil    | 5       | × ease factor (más largo)   |

Una oración se considera **Dominada** cuando su intervalo supera los 21 días.

---

## Personalización

### Agregar oraciones
Edita `src/data/sentences.js` siguiendo el formato:
```js
{
  id: 51,
  english: "The property has great curb appeal.",
  spanish: "La propiedad tiene muy buena apariencia exterior.",
  phonetic: "ðə PROP-er-tee hæz greit kerb ə-PEEL",
  level: "intermediate",  // basic | intermediate | advanced
  group: 2,
  groupName: "Describir Propiedades",
}
```

### Agregar preguntas de gramática
Edita `src/data/grammarQuestions.js`:
```js
{
  id: 36,
  sentenceId: 51,
  displaySentence: "The property has great curb ___.",
  blank: "appeal",
  options: ["appeal", "appears", "appearance", "appealing"],
  correctIndex: 0,
  rule: "Vocabulario — Curb appeal",
  explanation: "'Curb appeal' es el atractivo visual de una propiedad vista desde la calle.",
}
```

---

## Licencia

MIT — Uso libre para proyectos educativos.
