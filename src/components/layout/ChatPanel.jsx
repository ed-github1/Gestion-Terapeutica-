import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const ChatPanel = ({ userName = 'Usuario', userRole = 'Paciente' }) => {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'support', text: 'Hola, Doctor! 👋', time: '10:32 AM' },
        { id: 2, sender: 'user', text: 'Hello, Alice! I have started working on the brief today!', time: '10:35 AM' },
        { id: 3, sender: 'support', text: 'That\'s great! Let me know if you have any questions.', time: '10:36 AM' },
        { id: 4, sender: 'user', text: 'You\'ll be okay soon.', time: '02:40 PM' },
        { id: 5, sender: 'support', text: 'Okay, thank you! ', time: '02:42 PM' }
    ])
    const [newMessage, setNewMessage] = useState('')

    const handleSend = () => {
        if (newMessage.trim()) {
            setMessages([...messages, {
                id: messages.length + 1,
                sender: 'user',
                text: newMessage,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            }])
            setNewMessage('')
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Support Chat</h3>
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            Allen Moon
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                    {messages.map((message, index) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                                <div className={`
                                    rounded-2xl px-4 py-3 shadow-sm
                                    ${message.sender === 'user'
                                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-br-sm'
                                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                    }
                                `}>
                                    <p className="text-sm leading-relaxed">{message.text}</p>
                                </div>
                                <p className={`text-xs text-gray-400 mt-1 px-2 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                    {message.time}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSend}
                        className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </motion.button>
                </div>
            </div>
        </div>
    )
}

export default ChatPanel
