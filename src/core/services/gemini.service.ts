
import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    // Safe access to process.env
    const apiKey = (typeof process !== 'undefined' && process.env) ? process.env['API_KEY'] : '';
    
    if (apiKey) {
        this.ai = new GoogleGenAI({ apiKey: apiKey });
    }
  }

  async interpretLabResults(testName: string, values: string, patientHistory: string): Promise<string> {
    if (!this.ai) return "Servicio de IA no disponible (Falta API Key).";

    const prompt = `
      Actúa como un patólogo clínico senior.
      Historial del Paciente: ${patientHistory}
      Prueba: ${testName}
      Valores: ${values}
      
      Provee una interpretación clínica concisa de estos resultados en ESPAÑOL. 
      Marca cualquier valor crítico. 
      Sugiere siguientes pasos o pruebas de seguimiento si es necesario.
      Mantén un tono profesional y médico.
      Máximo 100 palabras.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      return response.text;
    } catch (e) {
      console.error(e);
      return "Servicio de IA no disponible temporalmente.";
    }
  }

  async generateDoctorEmail(doctorName: string, stats: any): Promise<string> {
    if (!this.ai) return "Servicio de IA no disponible (Falta API Key).";

    const prompt = `
      Escribe un correo profesional de CRM al Dr. ${doctorName} en ESPAÑOL.
      Contexto: Envió ${stats.referralsLastMonth} derivaciones el mes pasado.
      Estado: ${stats.status}.
      
      Objetivo: Agradecer su confianza. Si el estado es 'En Riesgo' (bajas derivaciones), recuérdale gentilmente nuestros nuevos tiempos de respuesta rápidos. Si es 'Activo', ofrece una mejora de servicio premium para sus pacientes VIP.
      Manténlo corto, educado y profesional.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      return response.text;
    } catch (e) {
      return "Servicio de IA no disponible.";
    }
  }

  async analyzeBusinessHealth(appointments: any[]): Promise<string> {
      if (!this.ai) return "Servicio de IA no disponible (Falta API Key).";
      
      const dataSummary = JSON.stringify(appointments.slice(0, 20)); // Limit data
      const prompt = `
        Analiza estos datos de citas para un laboratorio clínico: ${dataSummary}
        Identifica 2 tendencias clave (ej. horas pico, tipos de pruebas populares) y 1 recomendación para mejorar la eficiencia.
        Responde en ESPAÑOL.
        Formato con viñetas (bullet points).
      `;

      try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
      } catch (e) {
          return "Análisis de IA no disponible.";
      }
  }

  async generateReport(prompt: string): Promise<string> {
    if (!this.ai) return "Servicio de IA no disponible (Falta API Key).";

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      return response.text;
    } catch (e) {
      console.error(e);
      return "Análisis de IA no disponible.";
    }
  }
}
