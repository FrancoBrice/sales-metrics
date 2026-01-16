// Script de prueba para verificar la API de Gemini
import { config } from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Cargar variables de entorno
config();

// Función para probar modelos conocidos
async function testAvailableModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    console.error("❌ GEMINI_API_KEY no está configurada");
    return null;
  }

  const modelsToTest = [
    "gemini-pro",
    "gemini-pro-vision",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.0-pro"
  ];

  console.log("🔍 Probando modelos disponibles...");

  for (const modelName of modelsToTest) {
    try {
      console.log(`  🧪 Probando ${modelName}...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100, // Pequeño para probar
        },
      });

      // Hacer una llamada de prueba pequeña
      const result = await model.generateContent("Hello, just testing if this model works. Reply with 'OK'");
      const response = await result.response;
      const text = response.text();

      if (text && text.trim()) {
        console.log(`  ✅ ${modelName} funciona correctamente`);
        return modelName;
      }
    } catch (error) {
      console.log(`  ❌ ${modelName} no disponible: ${error.message.split('.')[0]}`);
    }
  }

  console.log("❌ Ningún modelo funcionó");
  return null;
}

// Texto de ejemplo del CSV (Carlos Perez)
const sampleTranscript = "Gracias por la reunion. En nuestra empresa, que se enfoca en servicios financieros, hemos notado que la carga de trabajo en el area de atencion al cliente ha incrementado significativamente desde que expandimos nuestras operaciones internacionales. No fue hasta que un colega menciono Vambe en una conferencia de tecnologia que consideramos automatizar parte del proceso. Nuestro equipo actual se enfrenta a cerca de 500 interacciones semanales, principalmente consultas repetitivas que creemos podrían ser automáticas. Esta posible solucion no solo reduciria la carga operativa, sino que tambien mejoraria la experiencia del cliente, ya que las respuestas serian mas rapidas y precisas.";

const EXTRACTION_PROMPT = `Eres un experto en análisis de reuniones de ventas B2B. Analiza la siguiente transcripción de una reunión de ventas y extrae información estructurada.

La empresa Vambe ofrece soluciones de automatización de atención al cliente mediante IA conversacional.

Transcripción:
{transcript}

Extrae la siguiente información en formato JSON:

1. **industry**: La industria del cliente potencial. Valores posibles: SERVICIOS_FINANCIEROS, ECOMMERCE, SALUD, EDUCACION, TECNOLOGIA, LOGISTICA, TURISMO, ALIMENTOS, MODA, EVENTOS, CONSULTORIA, LEGAL, INMOBILIARIA, MARKETING, ARQUITECTURA, CONSTRUCCION, ENERGIA, AGRICULTURA, ONG, OTRO

2. **businessModel**: Modelo de negocio del cliente. Valores posibles: B2B, B2C

3. **jtbdPrimary**: Jobs-to-be-done principales que el cliente quiere resolver (array). Valores posibles: AUTOMATIZAR_ATENCION, REDUCIR_TIEMPOS, ESCALAR_OPERACIONES, MEJORAR_EXPERIENCIA, LIBERAR_EQUIPO, MULTIIDIOMA

4. **painPoints**: Puntos de dolor mencionados (array). Valores posibles: VOLUMEN_ALTO, RESPUESTAS_LENTAS, SOBRECARGA_EQUIPO, CONSULTAS_REPETITIVAS, GESTION_MANUAL, PICOS_DEMANDA

5. **leadSource**: Cómo conoció el cliente a Vambe. Valores posibles: LINKEDIN, REFERIDO, CONFERENCIA, GOOGLE, WEBINAR, REDES_SOCIALES, ARTICULO, EVENTO_NETWORKING, EMAIL, OTRO

6. **processMaturity**: Nivel de madurez de sus procesos actuales. Valores posibles: MANUAL, SEMI_AUTOMATIZADO, AUTOMATIZADO, OPTIMIZADO

7. **toolingMaturity**: Nivel de herramientas tecnológicas que usan. Valores posibles: HERRAMIENTAS_BASICAS, HERRAMIENTAS_AVANZADAS, SISTEMAS_INTEGRADOS, PLATAFORMA_PROPIA

8. **knowledgeComplexity**: Complejidad del conocimiento requerido para responder consultas. Valores posibles: BAJA, MODERADA, ALTA, MUY_ALTA

9. **riskLevel**: Nivel de riesgo percibido en la implementación. Valores posibles: BAJO, MEDIO, ALTO, MUY_ALTO

10. **integrations**: Integraciones mencionadas o necesarias (array). Valores posibles: CRM, ERP, ECOMMERCE, WHATSAPP, EMAIL, CHATBOT, API_REST, BASE_DE_DATOS, SISTEMA_CITAS, REDES_SOCIALES

11. **urgency**: Nivel de urgencia del cliente. Valores posibles: BAJA, MEDIA, ALTA, CRITICA

12. **successMetrics**: Métricas de éxito mencionadas (array). Valores posibles: TIEMPO_RESPUESTA, SATISFACCION_CLIENTE, REDUCCION_COSTOS, AUMENTO_VENTAS, REDUCCION_ERRORES, MEJORA_EFICIENCIA

13. **objections**: Objeciones o preocupaciones mencionadas (array). Valores posibles: COSTO_ELEVADO, COMPLEJIDAD_IMPLEMENTACION, PRIVACIDAD_DATOS, RESISTENCIA_CULTURAL, INTEGRACION_DIFICIL, SOPORTE_LIMITADO

14. **sentiment**: Sentimiento general del cliente hacia Vambe. Valores posibles: POSITIVO, NEUTRAL, NEGATIVO

15. **volume**: Objeto con:
    - quantity: número de interacciones mencionadas (null si no se menciona)
    - unit: unidad de tiempo. Valores posibles: POR_DIA, POR_SEMANA, POR_MES, POR_HORA
    - isPeak: boolean indicando si es volumen pico o normal

16. **confidence**: Tu nivel de confianza en la extracción (0.0 a 1.0)

Responde SOLO con el JSON, sin explicaciones adicionales.`;

async function testGeminiAPI() {
  // Verificar que hay API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    console.error("❌ GEMINI_API_KEY no está configurada");
    console.error("Valor actual:", apiKey);
    console.log("Por favor configura tu API key real en el archivo .env:");
    console.log('GEMINI_API_KEY="tu-api-key-real-aqui"');
    return;
  }

  console.log("🔑 API Key encontrada");

  // Encontrar un modelo que funcione
  const workingModel = await testAvailableModels();
  if (!workingModel) {
    console.error("❌ No se encontró ningún modelo disponible");
    return;
  }

  console.log(`✅ Usando modelo: ${workingModel}`);
  console.log("📝 Texto de prueba:", sampleTranscript.substring(0, 100) + "...");
  console.log("🤖 Probando llamada completa a Gemini API...");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: workingModel,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 2048,
      },
    });

    const prompt = EXTRACTION_PROMPT.replace("{transcript}", sampleTranscript);
    console.log("📋 Prompt preparado (longitud:", prompt.length, "caracteres)");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Respuesta recibida de Gemini");
    console.log("📄 Longitud de respuesta:", text.length, "caracteres");

    // Intentar parsear JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      console.log("🔍 JSON encontrado en respuesta");
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("✅ JSON parseado correctamente");
        console.log("📊 Resultado de extracción:");
        console.log(JSON.stringify(parsed, null, 2));
      } catch (parseError) {
        console.error("❌ Error parseando JSON:", parseError.message);
        console.log("📄 Respuesta cruda:", text);
      }
    } else {
      console.error("❌ No se encontró JSON en la respuesta");
      console.log("📄 Respuesta completa:", text);
    }

  } catch (error) {
    console.error("❌ Error en la llamada a Gemini API:");
    console.error("Tipo de error:", error.constructor.name);
    console.error("Mensaje:", error.message);

    if (error.response) {
      console.error("Status code:", error.response.status);
      console.error("Respuesta:", error.response.data);
    }
  }
}

// Ejecutar la prueba
testGeminiAPI();