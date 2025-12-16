// Backend service for sending video call notifications
// Add this to your backend

import nodemailer from 'nodemailer';
// Optional: import twilio for SMS
// import twilio from 'twilio';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER, // your email
    pass: process.env.SMTP_PASS, // your email password or app password
  },
});

// SMS configuration (optional)
// const twilioClient = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

export const sendVideoCallNotification = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { patientName, videoLink, appointmentTime } = req.body;

    // Get patient info from database
    // const appointment = await Appointment.findById(appointmentId).populate('patient');
    // const patientEmail = appointment.patient.email;
    // const patientPhone = appointment.patient.telefono;

    // For demo, using data from request
    const patientEmail = req.body.patientEmail || 'patient@example.com';

    // Send Email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📹 Videollamada Médica Programada</h1>
          </div>
          <div class="content">
            <p>Hola ${patientName},</p>
            <p>Tu cita de videollamada ha sido programada.</p>
            
            <div class="info">
              <strong>📅 Fecha y Hora:</strong><br>
              ${appointmentTime}
            </div>

            <p>Haz clic en el botón de abajo para unirte a la videollamada:</p>
            
            <center>
              <a href="${videoLink}" class="button">
                Unirse a la Videollamada
              </a>
            </center>

            <p>O copia este enlace en tu navegador:</p>
            <p style="background: #e9e9e9; padding: 10px; border-radius: 5px; word-break: break-all;">
              ${videoLink}
            </p>

            <p><strong>Recomendaciones:</strong></p>
            <ul>
              <li>✓ Verifica tu cámara y micrófono antes de la cita</li>
              <li>✓ Asegúrate de tener una buena conexión a internet</li>
              <li>✓ Busca un lugar privado y tranquilo</li>
              <li>✓ Ten a mano tus documentos médicos si es necesario</li>
            </ul>

            <p>Si tienes problemas para unirte, contacta con nosotros.</p>
            
            <p>Saludos,<br><strong>Equipo Médico</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Centro Médico" <${process.env.SMTP_USER}>`,
      to: patientEmail,
      subject: '📹 Videollamada Médica - Enlace de Acceso',
      html: emailHtml,
    });

    // Optional: Send SMS
    // if (patientPhone) {
    //   await twilioClient.messages.create({
    //     body: `Hola ${patientName}, tu videollamada médica está programada para ${appointmentTime}. Enlace: ${videoLink}`,
    //     from: process.env.TWILIO_PHONE_NUMBER,
    //     to: patientPhone
    //   });
    // }

    res.json({
      success: true,
      message: 'Notificación enviada exitosamente'
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar la notificación'
    });
  }
};

// Add this route to your backend:
// router.post('/appointments/:appointmentId/send-video-link', sendVideoCallNotification);

// Environment variables needed:
/*
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional for SMS:
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
*/
