/**
 * LMS AI Chatbot Widget
 * Uses Hugging Face Inference API
 * 
 * CONFIGURATION:
 * - API_KEY: Your Hugging Face API token (line 13)
 * - MODEL_ID: The model to use (line 14)
 * 
 * Recommended models:
 * - mistralai/Mistral-7B-Instruct-v0.1
 * - HuggingFaceH4/zephyr-7b-beta
 * - microsoft/DialoGPT-medium
 */

const CHATBOT_CONFIG = {
  // Set your Hugging Face API key in Vercel environment variable: NEXT_PUBLIC_HF_API_KEY
  // Or replace 'YOUR_HUGGING_FACE_API_KEY' below with your actual key
  API_KEY: window.HF_API_KEY || 'YOUR_HUGGING_FACE_API_KEY',
  MODEL_ID: 'mistralai/Mistral-7B-Instruct-v0.1',
  API_URL: 'https://api-inference.huggingface.co/models/',
  SYSTEM_PROMPT: 'You are a helpful AI assistant for a Learning Management System. Help students with their courses, explain concepts, and answer questions about AI, Machine Learning, Java, Python, and Data Science. Be concise and friendly.',
};

// Chatbot Widget Class
class LMSChatbot {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.conversationHistory = [];
    this.init();
  }

  init() {
    this.injectStyles();
    this.createWidget();
    this.attachEventListeners();
  }

  injectStyles() {
    const styles = document.createElement('style');
    styles.textContent = `
      /* Chatbot Container */
      .lms-chatbot-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* Chat Toggle Button */
      .lms-chat-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }

      .lms-chat-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
      }

      .lms-chat-toggle svg {
        width: 28px;
        height: 28px;
        fill: white;
      }

      /* Chat Window */
      .lms-chat-window {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 380px;
        height: 520px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
        animation: slideUp 0.3s ease;
      }

      .lms-chat-window.open {
        display: flex;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Chat Header */
      .lms-chat-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .lms-chat-avatar {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .lms-chat-avatar svg {
        width: 24px;
        height: 24px;
        fill: white;
      }

      .lms-chat-title {
        flex: 1;
      }

      .lms-chat-title h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .lms-chat-title p {
        margin: 2px 0 0;
        font-size: 12px;
        opacity: 0.9;
      }

      .lms-chat-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        opacity: 0.8;
        transition: opacity 0.2s;
      }

      .lms-chat-close:hover {
        opacity: 1;
      }

      /* Chat Messages */
      .lms-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f8fafc;
      }

      .lms-chat-message {
        max-width: 85%;
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      }

      .lms-chat-message.user {
        align-self: flex-end;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-bottom-right-radius: 4px;
      }

      .lms-chat-message.bot {
        align-self: flex-start;
        background: white;
        color: #333;
        border-bottom-left-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      .lms-chat-message.loading {
        display: flex;
        gap: 4px;
        padding: 16px 20px;
      }

      .lms-chat-message.loading span {
        width: 8px;
        height: 8px;
        background: #667eea;
        border-radius: 50%;
        animation: bounce 1.4s ease-in-out infinite;
      }

      .lms-chat-message.loading span:nth-child(1) { animation-delay: 0s; }
      .lms-chat-message.loading span:nth-child(2) { animation-delay: 0.2s; }
      .lms-chat-message.loading span:nth-child(3) { animation-delay: 0.4s; }

      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-8px); }
      }

      /* Chat Input */
      .lms-chat-input-container {
        padding: 16px;
        background: white;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 10px;
      }

      .lms-chat-input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      .lms-chat-input:focus {
        border-color: #667eea;
      }

      .lms-chat-input:disabled {
        background: #f3f4f6;
        cursor: not-allowed;
      }

      .lms-chat-send {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, opacity 0.2s;
      }

      .lms-chat-send:hover:not(:disabled) {
        transform: scale(1.05);
      }

      .lms-chat-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .lms-chat-send svg {
        width: 20px;
        height: 20px;
        fill: white;
      }

      /* Welcome Message */
      .lms-chat-welcome {
        text-align: center;
        padding: 20px;
        color: #6b7280;
      }

      .lms-chat-welcome h4 {
        margin: 0 0 8px;
        color: #374151;
        font-size: 16px;
      }

      .lms-chat-welcome p {
        margin: 0;
        font-size: 13px;
      }

      /* Quick Actions */
      .lms-chat-quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 0 16px 16px;
        background: #f8fafc;
      }

      .lms-quick-btn {
        padding: 8px 14px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        font-size: 12px;
        color: #667eea;
        cursor: pointer;
        transition: all 0.2s;
      }

      .lms-quick-btn:hover {
        background: #667eea;
        color: white;
        border-color: #667eea;
      }

      /* Responsive */
      @media (max-width: 480px) {
        .lms-chat-window {
          width: calc(100vw - 40px);
          height: 70vh;
          bottom: 70px;
          right: 0;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  createWidget() {
    const container = document.createElement('div');
    container.className = 'lms-chatbot-container';
    container.innerHTML = `
      <!-- Chat Window -->
      <div class="lms-chat-window" id="lmsChatWindow">
        <div class="lms-chat-header">
          <div class="lms-chat-avatar">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
          <div class="lms-chat-title">
            <h3>LMS AI Assistant</h3>
            <p>Powered by Hugging Face</p>
          </div>
          <button class="lms-chat-close" id="lmsChatClose">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
        
        <div class="lms-chat-messages" id="lmsChatMessages">
          <div class="lms-chat-welcome">
            <h4>👋 Welcome to LMS Assistant!</h4>
            <p>Ask me anything about your courses, AI, ML, Python, Java, or Data Science.</p>
          </div>
        </div>
        
        <div class="lms-chat-quick-actions" id="lmsQuickActions">
          <button class="lms-quick-btn" data-question="Explain machine learning">What is ML?</button>
          <button class="lms-quick-btn" data-question="How do I start learning Python?">Learn Python</button>
          <button class="lms-quick-btn" data-question="What is a neural network?">Neural Networks</button>
          <button class="lms-quick-btn" data-question="Explain OOP concepts in Java">Java OOP</button>
        </div>
        
        <div class="lms-chat-input-container">
          <input type="text" class="lms-chat-input" id="lmsChatInput" placeholder="Ask me anything..." />
          <button class="lms-chat-send" id="lmsChatSend">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
      
      <!-- Toggle Button -->
      <button class="lms-chat-toggle" id="lmsChatToggle">
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
      </button>
    `;
    document.body.appendChild(container);

    // Cache DOM elements
    this.elements = {
      window: document.getElementById('lmsChatWindow'),
      toggle: document.getElementById('lmsChatToggle'),
      close: document.getElementById('lmsChatClose'),
      messages: document.getElementById('lmsChatMessages'),
      input: document.getElementById('lmsChatInput'),
      send: document.getElementById('lmsChatSend'),
      quickActions: document.getElementById('lmsQuickActions'),
    };
  }

  attachEventListeners() {
    // Toggle chat
    this.elements.toggle.addEventListener('click', () => this.toggleChat());
    this.elements.close.addEventListener('click', () => this.toggleChat());

    // Send message
    this.elements.send.addEventListener('click', () => this.sendMessage());
    this.elements.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Quick actions
    this.elements.quickActions.querySelectorAll('.lms-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.dataset.question;
        this.elements.input.value = question;
        this.sendMessage();
      });
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.elements.window.classList.toggle('open', this.isOpen);
    if (this.isOpen) {
      this.elements.input.focus();
    }
  }

  addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `lms-chat-message ${isUser ? 'user' : 'bot'}`;
    messageDiv.textContent = content;
    this.elements.messages.appendChild(messageDiv);
    this.scrollToBottom();
    return messageDiv;
  }

  addLoadingMessage() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'lms-chat-message bot loading';
    loadingDiv.id = 'lmsLoadingMessage';
    loadingDiv.innerHTML = '<span></span><span></span><span></span>';
    this.elements.messages.appendChild(loadingDiv);
    this.scrollToBottom();
  }

  removeLoadingMessage() {
    const loading = document.getElementById('lmsLoadingMessage');
    if (loading) loading.remove();
  }

  scrollToBottom() {
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  }

  hideQuickActions() {
    this.elements.quickActions.style.display = 'none';
  }

  buildPrompt(userMessage) {
    // Build conversation context
    let prompt = `<s>[INST] ${CHATBOT_CONFIG.SYSTEM_PROMPT}\n\n`;
    
    // Add conversation history (last 6 messages for context)
    const recentHistory = this.conversationHistory.slice(-6);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n`;
      } else {
        prompt += `Assistant: ${msg.content}\n`;
      }
    });
    
    prompt += `User: ${userMessage} [/INST]`;
    return prompt;
  }

  async sendMessage() {
    const message = this.elements.input.value.trim();
    if (!message || this.isLoading) return;

    // Hide quick actions on first message
    this.hideQuickActions();

    // Add user message
    this.addMessage(message, true);
    this.conversationHistory.push({ role: 'user', content: message });
    
    // Clear input
    this.elements.input.value = '';
    this.elements.input.disabled = true;
    this.elements.send.disabled = true;
    this.isLoading = true;

    // Show loading
    this.addLoadingMessage();

    try {
      const response = await this.callHuggingFace(message);
      this.removeLoadingMessage();
      this.addMessage(response);
      this.conversationHistory.push({ role: 'assistant', content: response });
    } catch (error) {
      this.removeLoadingMessage();
      this.addMessage('Sorry, I encountered an error. Please try again.');
      console.error('Chatbot error:', error);
    } finally {
      this.elements.input.disabled = false;
      this.elements.send.disabled = false;
      this.isLoading = false;
      this.elements.input.focus();
    }
  }

  async callHuggingFace(message) {
    const prompt = this.buildPrompt(message);
    
    const response = await fetch(`${CHATBOT_CONFIG.API_URL}${CHATBOT_CONFIG.MODEL_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHATBOT_CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    const data = await response.json();
    
    // Extract generated text
    let generatedText = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      generatedText = data[0].generated_text;
    } else if (data.generated_text) {
      generatedText = data.generated_text;
    } else {
      generatedText = 'I apologize, but I couldn\'t generate a response. Please try again.';
    }

    // Clean up the response
    generatedText = generatedText.trim();
    
    // Remove any remaining instruction tags
    generatedText = generatedText.replace(/<\/?s>/g, '');
    generatedText = generatedText.replace(/\[INST\]|\[\/INST\]/g, '');
    
    return generatedText || 'I apologize, but I couldn\'t generate a response. Please try again.';
  }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new LMSChatbot());
} else {
  new LMSChatbot();
}
