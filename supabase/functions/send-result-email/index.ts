
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const SMTP_USER = "biosalud.lcb@gmail.com";
const SMTP_PASS = "nmbs zvma jfaj digv";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
    }

    try {
        const { to, subject, patientName, testName, resultValues, pdfBase64 } = await req.json();

        const client = new SmtpClient();
        await client.connectSmtp({
            hostname: "smtp.gmail.com",
            port: 465,
            username: SMTP_USER,
            password: SMTP_PASS,
        });

        const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #2c3e50;">Laboratorio Clínico BioSalud</h2>
        <p>Estimado/a <strong>${patientName}</strong>,</p>
        <p>Adjunto encontrará los resultados de su examen: <strong>${testName}</strong>.</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
          <pre style="white-space: pre-wrap; font-size: 14px;">${resultValues}</pre>
        </div>
        <p style="font-size: 12px; color: #7f8c8d; margin-top: 20px;">
          Este es un correo automático. Por favor no responda a este mensaje.
        </p>
      </div>
    `;

        await client.send({
            from: SMTP_USER,
            to,
            subject: subject || `Resultados de Laboratorio - ${patientName}`,
            content: htmlBody,
            html: htmlBody,
        });

        await client.close();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
});
