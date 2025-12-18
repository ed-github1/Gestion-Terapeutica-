import React from 'react'

/**
 * SMSAuthDemo - Demo component showing the SMS authentication flow
 * Use this component to understand how the SMS auth works
 */
const SMSAuthDemo = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-800">SMS Authentication Flow</h1>
          <p className="text-gray-600">Visual guide to understanding the SMS login process</p>
        </div>

        {/* Flow Diagram */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Authentication Flow</h2>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start space-x-4">
              <div className="shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">User Enters Phone Number</h3>
                <p className="text-gray-600 text-sm">Frontend: SMSLoginPage.jsx</p>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                  POST /api/auth/login/sms<br />
                  Body: &#123; phoneNumber: "1234567890" &#125;
                </div>
              </div>
            </div>

            <div className="ml-5 border-l-2 border-gray-300 h-8"></div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4">
              <div className="shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">Backend Sends SMS Code</h3>
                <p className="text-gray-600 text-sm">Backend: routes/auth.js → services/twilio.js</p>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Validates phone number</li>
                    <li>Checks if user exists</li>
                    <li>Generates 6-digit OTP</li>
                    <li>Sends SMS via Twilio</li>
                    <li>Stores OTP in database</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="ml-5 border-l-2 border-gray-300 h-8"></div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4">
              <div className="shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">User Receives SMS</h3>
                <p className="text-gray-600 text-sm">Twilio → User's Phone</p>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  📱 "Tu código de verificación es: 123456. Válido por 10 minutos."
                </div>
              </div>
            </div>

            <div className="ml-5 border-l-2 border-gray-300 h-8"></div>

            {/* Step 4 */}
            <div className="flex items-start space-x-4">
              <div className="shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">User Enters Code</h3>
                <p className="text-gray-600 text-sm">Frontend: SMSLoginPage.jsx</p>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                  POST /api/auth/login/sms/verify<br />
                  Body: &#123; phoneNumber: "1234567890", code: "123456", rememberMe: true &#125;
                </div>
              </div>
            </div>

            <div className="ml-5 border-l-2 border-gray-300 h-8"></div>

            {/* Step 5 */}
            <div className="flex items-start space-x-4">
              <div className="shrink-0 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">Backend Verifies Code</h3>
                <p className="text-gray-600 text-sm">Backend: routes/auth.js</p>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Validates code against stored OTP</li>
                    <li>Checks expiration (10 minutes)</li>
                    <li>Checks attempt limit (5 max)</li>
                    <li>Finds user by phone number</li>
                    <li>Generates JWT token</li>
                    <li>Returns user data + token</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="ml-5 border-l-2 border-gray-300 h-8"></div>

            {/* Step 6 */}
            <div className="flex items-start space-x-4">
              <div className="shrink-0 w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold">
                6
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">User Logged In</h3>
                <p className="text-gray-600 text-sm">Frontend: Stores token and redirects</p>
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  ✅ Token stored in localStorage/sessionStorage<br />
                  ✅ User data stored<br />
                  ✅ Redirected to dashboard based on role
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">API Endpoints</h2>

          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-bold text-gray-800">POST /api/auth/login/sms</h3>
              <p className="text-sm text-gray-600 mb-2">Send SMS code to user's phone</p>
              <div className="bg-gray-50 rounded p-3 font-mono text-xs">
                <div className="text-gray-600">Request:</div>
                &#123; "phoneNumber": "1234567890" &#125;
                <div className="text-gray-600 mt-2">Response:</div>
                &#123;<br />
                &nbsp;&nbsp;"success": true,<br />
                &nbsp;&nbsp;"message": "Código enviado exitosamente",<br />
                &nbsp;&nbsp;"data": &#123; "phoneNumber": "+11234567890" &#125;<br />
                &#125;
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-gray-800">POST /api/auth/login/sms/verify</h3>
              <p className="text-sm text-gray-600 mb-2">Verify code and authenticate user</p>
              <div className="bg-gray-50 rounded p-3 font-mono text-xs">
                <div className="text-gray-600">Request:</div>
                &#123;<br />
                &nbsp;&nbsp;"phoneNumber": "1234567890",<br />
                &nbsp;&nbsp;"code": "123456",<br />
                &nbsp;&nbsp;"rememberMe": true<br />
                &#125;
                <div className="text-gray-600 mt-2">Response:</div>
                &#123;<br />
                &nbsp;&nbsp;"success": true,<br />
                &nbsp;&nbsp;"message": "Inicio de sesión exitoso",<br />
                &nbsp;&nbsp;"data": &#123;<br />
                &nbsp;&nbsp;&nbsp;&nbsp;"token": "eyJhbGciOiJIUzI1NiIs...",<br />
                &nbsp;&nbsp;&nbsp;&nbsp;"user": &#123; "id": "...", "nombre": "...", ... &#125;<br />
                &nbsp;&nbsp;&#125;<br />
                &#125;
              </div>
            </div>
          </div>
        </div>

        {/* Database Models */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Database Models</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-2">OTP Model</h3>
              <div className="bg-gray-50 rounded p-4 font-mono text-xs">
                &#123;<br />
                &nbsp;&nbsp;phoneNumber: String,<br />
                &nbsp;&nbsp;code: String,<br />
                &nbsp;&nbsp;expiresAt: Date,<br />
                &nbsp;&nbsp;verified: Boolean,<br />
                &nbsp;&nbsp;attempts: Number,<br />
                &nbsp;&nbsp;maxAttempts: Number<br />
                &#125;
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-2">User Model (Updated)</h3>
              <div className="bg-gray-50 rounded p-4 font-mono text-xs">
                &#123;<br />
                &nbsp;&nbsp;...,<br />
                &nbsp;&nbsp;phoneNumber: String,<br />
                &nbsp;&nbsp;phoneVerified: Boolean,<br />
                &nbsp;&nbsp;...<br />
                &#125;
              </div>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🔐 Security Features</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Frontend Security</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Phone number validation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Secure token storage</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>401 automatic redirect</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Loading states prevent double-submit</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Backend Security</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>OTP expiration (10 minutes)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Maximum attempts (5)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Rate limiting (recommended)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>JWT authentication</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Phone number formatting</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-linear-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">📚 Documentation</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-bold mb-2">Quick Start</h3>
              <p className="text-sm opacity-90">SMS_QUICK_START.md</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-bold mb-2">Backend Guide</h3>
              <p className="text-sm opacity-90">TWILIO_SMS_AUTHENTICATION.md</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-bold mb-2">Frontend Docs</h3>
              <p className="text-sm opacity-90">SMS_AUTHENTICATION_README.md</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SMSAuthDemo
