// Prueba simple de Gemini API
import { config } from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    console.error("❌ GEMINI_API_KEY no configurada");
    return;
  }

  console.log("🔑 API Key encontrada");
  console.log("🤖 Probando Gemini API...");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Intentar diferentes modelos disponibles
    const modelsToTry = ["gemini-1.0-pro", "gemini-pro", "gemini-pro-vision"];

    for (const modelName of modelsToTry) {
      try {
        console.log(`🧪 Probando modelo: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 100,
          },
        });

        const result = await model.generateContent("Hola, solo probando que funciona. Responde con 'OK'");
        const response = await result.response;
        const text = response.text();

        console.log("✅ ¡Funciona!");
        console.log("📄 Respuesta:", text);
        console.log(`🎉 Gemini API operativo con modelo: ${modelName}`);
        return; // Salir si uno funciona

      } catch (modelError) {
        console.log(`❌ ${modelName} falló: ${modelError.message.split('.')[0]}`);

        // Mostrar más detalles del error
        if (modelError.response) {
          console.log(`   Status: ${modelError.response.status}`);
          console.log(`   StatusText: ${modelError.response.statusText}`);
        }

        // Si es el último modelo, mostrar diagnóstico completo
        if (modelName === "gemini-pro-vision") {
          console.log("\n🔍 DIAGNÓSTICO:");
          console.log("1. API Key parece válida (se conecta)");
          console.log("2. Error sugiere problema de autenticación o quota");
          console.log("3. Posibles soluciones:");
          console.log("   - Verificar API key en https://aistudio.google.com/");
          console.log("   - Activar billing si es necesario");
          console.log("   - Verificar restricciones regionales");
        }
      }
    }

    throw new Error("Ningún modelo funcionó");

    const result = await model.generateContent("Hola, solo probando que funciona. Responde con 'OK'");
    const response = await result.response;
    const text = response.text();

    console.log("✅ ¡Funciona!");
    console.log("📄 Respuesta:", text);
    console.log("🎉 Gemini API está operativo");

  } catch (error) {
    console.error("❌ Error:");
    console.error("Tipo:", error.constructor.name);
    console.error("Mensaje:", error.message);

    if (error.message.includes("429")) {
      console.log("💰 Solución: Activar billing en Google AI Studio");
    } else if (error.message.includes("403")) {
      console.log("🔑 Solución: Verificar API key en Google AI Studio");
    }
  }
}

testGemini();