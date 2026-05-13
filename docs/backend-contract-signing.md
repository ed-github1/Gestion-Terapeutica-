# Contract Signing — Backend Integration Guide

## Context

Professionals must sign a platform usage agreement after their KYC is approved and before they can access the dashboard. The frontend gates this at the route level by checking two fields on the user object returned by `GET /auth/me`.

---

## 1. Schema changes

Add the following fields to the `Professional` (or `User`) document:

```js
contractSigned:    { type: Boolean, default: false },
contractSignedAt:  { type: Date,    default: null  },
contractVersion:   { type: String,  default: null  }, // e.g. "v1.0"
contractIp:        { type: String,  default: null  },
contractPdfUrl:    { type: String,  default: null  }, // S3 / R2 / GridFS URL
```

`contractVersion` is important — when you update the contract text, increment the version so you can re-prompt professionals who signed an older one.

---

## 2. Update `GET /auth/me` response

The frontend reads both fields on every session load. They must be present at the **top level** of the user object:

```json
{
  "_id": "...",
  "nombre": "...",
  "email": "...",
  "kycStatus": "approved",
  "contractSigned": false,
  "contractSignedAt": null,
  "contractVersion": null
}
```

If `contractSigned` is missing, the frontend gate will not trigger and professionals will bypass the signing step.

---

## 3. New endpoint — `POST /professional/contract/sign`

### Why the backend should generate the PDF

The current frontend implementation generates the PDF client-side, which means the document content can be swapped before it reaches the server. For a legally binding agreement, the backend must own the PDF generation so the content is guaranteed.

### What the frontend sends

```
POST /professional/contract/sign
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "signatureDataUrl": "data:image/png;base64,<signature PNG>"
}
```

The professional ID is extracted from the JWT — it must **not** be sent in the body.

### What the backend must do

1. Verify the JWT and resolve the professional's record
2. Return early with `{ success: true }` if already signed (idempotent)
3. Decode the base64 signature PNG from `signatureDataUrl`
4. Generate the PDF server-side (see section 4)
5. Store the PDF (S3, Cloudflare R2, GridFS, or as a buffer)
6. Update the professional's record:
   ```js
   contractSigned:   true
   contractSignedAt: new Date()
   contractVersion:  "v1.0"         // current contract version
   contractIp:       req.ip          // for audit trail
   contractPdfUrl:   "<stored URL>"  // or omit if storing as buffer
   ```
7. Return:
   ```json
   { "success": true }
   ```

### Error responses

| Case | Status | body |
|---|---|---|
| Missing / invalid signature | 400 | `{ "code": "MISSING_SIGNATURE" }` |
| Professional not found | 404 | `{ "code": "NOT_FOUND" }` |
| Already signed | 200 | `{ "success": true }` |

---

## 4. PDF generation (server-side, Node.js)

Use [`pdf-lib`](https://pdf-lib.js.org/) — already a dependency on the frontend, same API on Node.

```js
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const CONTRACT_VERSION = 'v1.0'

const CONTRACT_SECTIONS = [
  {
    title: '1. Uso de la plataforma',
    body: 'TotalMente Gestión Terapéutica es una plataforma digital para profesionales de salud mental habilitados. Al aceptar este contrato, confirmas que cuentas con cédula profesional vigente y que ejercerás tu práctica cumpliendo con la normativa sanitaria aplicable en tu país.',
  },
  {
    title: '2. Responsabilidad clínica',
    body: 'Eres el único responsable del diagnóstico, tratamiento y seguimiento de tus pacientes. TotalMente proporciona herramientas de gestión; en ningún caso sustituye el juicio clínico profesional ni asume responsabilidad por las decisiones terapéuticas que tomes.',
  },
  {
    title: '3. Protección de datos',
    body: 'Te comprometes a manejar la información de tus pacientes con estricta confidencialidad, de acuerdo con la Ley General de Salud y la normativa vigente en materia de protección de datos personales. TotalMente implementa medidas de seguridad técnicas y organizativas para salvaguardar dicha información.',
  },
  {
    title: '4. Condiciones del servicio',
    body: 'El acceso a la plataforma está condicionado al cumplimiento de estos términos y al pago de la suscripción correspondiente según el plan elegido. TotalMente se reserva el derecho de suspender el acceso ante el incumplimiento de cualquiera de estas condiciones.',
  },
]

export async function generateContractPdf({ professionalName, signatureDataUrl, signedAt, ip }) {
  const pdfDoc = await PDFDocument.create()
  const page   = pdfDoc.addPage([595, 842])
  const bold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const normal = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const blue  = rgb(0, 0.46, 0.79)
  const dark  = rgb(0.1, 0.1, 0.1)
  const gray  = rgb(0.45, 0.45, 0.45)
  const white = rgb(1, 1, 1)

  const dateStr = new Date(signedAt).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  // Header
  page.drawRectangle({ x: 0, y: 762, width: 595, height: 80, color: blue })
  page.drawText('TotalMente Gestión Terapéutica',  { x: 30, y: 808, size: 18, font: bold,   color: white })
  page.drawText('Contrato de Uso de la Plataforma', { x: 30, y: 786, size: 10, font: normal, color: rgb(0.8, 0.92, 1) })

  // Title
  page.drawText('CONTRATO DE USO — PROFESIONAL DE SALUD', { x: 30, y: 730, size: 13, font: bold, color: blue })
  page.drawRectangle({ x: 30, y: 722, width: 535, height: 1.5, color: blue })

  // Metadata band
  page.drawRectangle({ x: 30, y: 698, width: 535, height: 18, color: rgb(0.95, 0.95, 0.95) })
  page.drawText(`Versión: ${CONTRACT_VERSION}   ·   Firmado el: ${dateStr}   ·   IP: ${ip}`, {
    x: 38, y: 704, size: 8, font: normal, color: gray,
  })

  // Contract body
  let y = 684
  for (const s of CONTRACT_SECTIONS) {
    y -= 10
    page.drawText(s.title, { x: 30, y, size: 10, font: bold, color: dark })
    y -= 14

    const words = s.body.split(' ')
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (normal.widthOfTextAtSize(test, 9) > 535 && line) {
        page.drawText(line, { x: 30, y, size: 9, font: normal, color: gray })
        y -= 13
        line = word
      } else {
        line = test
      }
    }
    if (line) { page.drawText(line, { x: 30, y, size: 9, font: normal, color: gray }); y -= 13 }
  }

  // Signature
  y -= 20
  page.drawRectangle({ x: 30, y, width: 535, height: 1, color: rgb(0.82, 0.82, 0.82) })
  y -= 14

  const base64   = signatureDataUrl.replace(/^data:image\/png;base64,/, '')
  const sigBytes = Buffer.from(base64, 'base64')
  const sigImg   = await pdfDoc.embedPng(sigBytes)
  const sigDims  = sigImg.scaleToFit(200, 72)

  page.drawImage(sigImg, { x: 30, y: y - sigDims.height, width: sigDims.width, height: sigDims.height })
  y -= sigDims.height + 8

  page.drawText(professionalName, { x: 30, y, size: 10, font: bold,   color: dark })
  y -= 13
  page.drawText(`Firmado el: ${dateStr}  ·  Versión ${CONTRACT_VERSION}`, { x: 30, y, size: 9, font: normal, color: gray })

  // Footer
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 26, color: rgb(0.95, 0.95, 0.95) })
  page.drawText(
    `Firmado digitalmente el ${dateStr} · TotalMente Gestión Terapéutica · ${CONTRACT_VERSION}`,
    { x: 30, y: 9, size: 8, font: normal, color: gray },
  )

  return Buffer.from(await pdfDoc.save())
}
```

---

## 5. Route handler sketch

```js
router.post('/professional/contract/sign', requireAuth, async (req, res) => {
  const professional = await Professional.findOne({ user: req.user._id })
  if (!professional) return res.status(404).json({ code: 'NOT_FOUND' })

  // Idempotent
  if (professional.contractSigned) return res.json({ success: true })

  const { signatureDataUrl } = req.body
  if (!signatureDataUrl) return res.status(400).json({ code: 'MISSING_SIGNATURE' })

  const signedAt = new Date()

  const pdfBuffer = await generateContractPdf({
    professionalName: `${professional.nombre} ${professional.apellido}`,
    signatureDataUrl,
    signedAt,
    ip: req.ip,
  })

  // Store PDF — pick one:
  // Option A: GridFS / MongoDB buffer
  // Option B: upload to S3/R2 and store the URL
  const pdfUrl = await uploadToStorage(pdfBuffer, `contrato_${professional._id}_v1.pdf`)

  await Professional.findByIdAndUpdate(professional._id, {
    contractSigned:   true,
    contractSignedAt: signedAt,
    contractVersion:  'v1.0',
    contractIp:       req.ip,
    contractPdfUrl:   pdfUrl,
  })

  res.json({ success: true })
})
```

---

## 6. Frontend changes after this is live

Once the backend generates the PDF, remove the `buildPdf` function from `ProfessionalContractPage.jsx` and simplify `professionalsService.signContract` back to a plain JSON call:

```js
signContract: (signatureDataUrl) =>
  apiClient.post('/professional/contract/sign', { signatureDataUrl }),
```

---

## 7. Future: contract version bumps

When the contract text changes, increment `CONTRACT_VERSION` on the backend. Add a check in `GET /auth/me` (or the gate middleware) to compare `professional.contractVersion` against the current version — if they differ, set `contractSigned: false` in the response so the frontend re-prompts the professional.
