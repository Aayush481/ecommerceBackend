import nodemailer from 'nodemailer';

// Helper to get SMTP transporter
async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log('[EmailService] Using custom SMTP server config.');
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  // Fallback to Ethereal dummy SMTP for sandbox dev testing
  console.log('[EmailService] SMTP credentials missing. Initializing Ethereal sandbox test mailer...');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
}

export async function sendQueryEmail(name: string, email: string, subject: string, message: string) {
  try {
    const transporter = await getTransporter();
    
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: 'aayush6b12@gmail.com',
      subject: `[Casa dei Regali Query] ${subject}`,
      text: `Hai ricevuto una nuova richiesta da:
Nome: ${name}
Email: ${email}

Messaggio:
${message}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px;">
          <h2 style="color: #B35C37; border-bottom: 2px solid #B35C37; padding-bottom: 10px;">Nuova Richiesta di Contatto</h2>
          <p><strong>Da:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
          <p><strong>Oggetto:</strong> ${subject}</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin-top: 15px; border-left: 4px solid #B35C37; font-style: italic;">
            "${message}"
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Contact inquiry email dispatched. ID: ${info.messageId}`);
    
    // Log preview link if using Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] Test email preview URL: ${previewUrl}`);
    }
    return true;
  } catch (error) {
    console.error('[EmailService] Error dispatching query email:', error);
    return false;
  }
}

export async function sendOrderEmail(customerEmail: string, items: any[], total: number) {
  try {
    const transporter = await getTransporter();

    const itemsListHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0;"><img src="${item.image}" alt="${item.name}" width="50" style="border-radius: 4px; object-cover: cover;" /></td>
        <td style="padding: 10px 0;"><strong>${item.name}</strong><br/><small>Size: ${item.size} | SKU: ${item.sku}</small></td>
        <td style="padding: 10px 0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right; font-weight: bold;">€${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: '"Casa dei Regali Orders" <orders@casadeiregali.it>',
      to: 'aayush6b12@gmail.com',
      cc: customerEmail,
      subject: `[Casa dei Regali Order] Nuova Richiesta d'Ordine - €${total.toFixed(2)}`,
      text: `Nuova richiesta d'ordine da parte di: ${customerEmail}
Totale: €${total.toFixed(2)}
Controlla il pannello amministrativo per maggiori dettagli.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; color: #232B28;">
          <h2 style="color: #B35C37; border-bottom: 2px solid #B35C37; padding-bottom: 10px; font-family: serif;">Nuovo Ordine Ricevuto</h2>
          <p><strong>Cliente Email:</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="border-bottom: 2px solid #eee; text-align: left; font-size: 12px; color: #888; text-transform: uppercase;">
                <th style="padding-bottom: 8px;">Prodotto</th>
                <th style="padding-bottom: 8px;">Dettagli</th>
                <th style="padding-bottom: 8px; text-align: center;">Qtà</th>
                <th style="padding-bottom: 8px; text-align: right;">Prezzo</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; text-align: right; font-size: 16px;">
            <strong>Totale Ordine:</strong> 
            <span style="color: #B35C37; font-size: 20px; font-weight: bold; margin-left: 10px;">€${total.toFixed(2)}</span>
          </div>

          <div style="margin-top: 30px; background-color: #fafafa; padding: 15px; border-radius: 6px; font-size: 11px; text-align: center; color: #888;">
            Nota: Questo ordine è stato generato in modalità di test (simulata). Nessun pagamento reale è stato processato.
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Order notification email dispatched. ID: ${info.messageId}`);
    
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EmailService] Test order email preview URL: ${previewUrl}`);
    }
    return true;
  } catch (error) {
    console.error('[EmailService] Error dispatching order email:', error);
    return false;
  }
}
