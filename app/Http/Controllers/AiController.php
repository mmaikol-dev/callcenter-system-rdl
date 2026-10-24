<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Enhanced Telegram Trading Bot Controller
 *
 * Features:
 * - Gemini AI integration for intelligent responses
 * - Advanced message understanding with context
 * - Dynamic button interactions with variation
 * - Clean modular architecture
 * - Comprehensive error handling
 * - Async processing support
 */
class AiController extends Controller
{
    // ========================================
    // CONFIGURATION SECTION
    // ========================================

    private $botToken;

    private $botUsername = 'batmantrial_bot';

    private $webhookUrl = 'https://sitebase.co.ke/telegram/webhook';

    // External API Keys
    private $tenorKey;

    private $coingeckoBase = 'https://api.coingecko.com/api/v3';

    // ========================================
    // 🤖 GEMINI AI CONFIGURATION
    // ========================================
    private $geminiApiKey;

    // TODO: Configure your preferred model
    // Available models: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-1.5-flash
    private $geminiModel = 'gemini-2.0-flash';

    // Gemini API endpoint
    private $geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/';

    // AI Features Toggle
    private $useAI = true; // Set to false to disable AI responses

    private $aiContextLength = 5; // Number of previous messages to include for context

    // ========================================
    // TRADING BOT SETTINGS
    // ========================================
    private $adminUsername = 'traderisrfx';

    private $channelLink = 'https://t.me/+JbJ2MH9hHWhlMWM0';

    private $vipGroupLink = 'https://t.me/pulsetradenetworkvip';

    private $vvipGroupLink = 'https://t.me/kenyantraderscircle';

    private $brokerLink = 'https://portal.blueberrymarkets.com/en/sign-up?referralCode=cjwdz5yr03';

    private $trialDays = 7;

    private $adminChatId = null; // Set your admin chat ID here

    // ========================================
    // RESPONSE VARIATION SYSTEM
    // ========================================
    private $responseVariations = [
        'welcome' => [
            "🦇 *Welcome to PulsePro Trading Network!*\n\nYour gateway to professional trading signals and market analysis.",
            "🎯 *Hey there, Trader!* Welcome to PulsePro Trading Network!\n\nReady to level up your trading game? Welcome to our elite network!",
            "⚡ *Welcome to PulsePro Trading Network!*\n\nJoin thousands of successful traders in our community.",
        ],
        'trial_activated' => [
            "🎉 *TRIAL ACTIVATED!*\n\nWelcome to Premium access for 7 days!",
            "🚀 *You're in!*\n\nYour 7-day premium trial is now active. Let's make some profits!",
            "✨ *Premium unlocked!*\n\nEnjoy all premium features for the next 7 days!",
        ],
        'market_intro' => [
            "📈 *CRYPTO MARKET UPDATE*\n\nHere's what's happening right now:",
            "💹 *LIVE MARKET DATA*\n\nFresh off the charts:",
            "🔥 *MARKET SNAPSHOT*\n\nCurrent prices:",
        ],
    ];

    // GIF Categories for context-aware animations
    private $gifCategories = [
        'welcome' => ['trading charts', 'welcome success', 'professional trader'],
        'celebration' => ['celebration trading', 'success party', 'winner celebration'],
        'thinking' => ['thinking analysis', 'brain thinking', 'contemplating'],
        'charts' => ['trading charts', 'stock market', 'forex charts'],
        'rocket' => ['rocket moon', 'to the moon', 'rocket launch'],
        'money' => ['money rain', 'cash flow', 'wealth success'],
        'fire' => ['fire trading', 'hot market', 'blazing success'],
        'victory' => ['victory celebration', 'champion winner', 'success achieve'],
    ];

    // ========================================
    // CONSTRUCTOR
    // ========================================
    public function __construct()
    {
        $this->botToken = config('services.telegram.bot_token');
        $this->tenorKey = config('services.tenor.api_key');
        $this->geminiApiKey = config('services.gemini.api_key');

        Log::info('TelegramController initialized', [
            'bot' => $this->botUsername,
            'ai_enabled' => $this->useAI,
            'model' => $this->geminiModel,
        ]);
    }

    // ========================================
    // MAIN WEBHOOK HANDLER
    // ========================================
    /**
     * Main webhook endpoint - handles all incoming Telegram updates
     * Implements async processing for better performance
     */
    public function webhook(Request $request)
    {
        try {
            Log::info('Webhook received', ['update' => $request->all()]);

            // Send immediate 200 OK response to Telegram
            response('OK', 200)->send();

            // Finish request for async processing
            if (function_exists('fastcgi_finish_request')) {
                fastcgi_finish_request();
            }

            $update = $request->all();

            // Route to appropriate handler
            if (isset($update['callback_query'])) {
                $this->handleCallbackQuery($update['callback_query']);
            } elseif (isset($update['message'])) {
                $this->handleMessage($update['message']);
            } elseif (isset($update['edited_message'])) {
                $this->handleEditedMessage($update['edited_message']);
            }

        } catch (\Throwable $e) {
            Log::error('Webhook error: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    // ========================================
    // MESSAGE HANDLERS
    // ========================================

    /**
     * Handle regular messages with intelligent routing
     */
  private function handleMessage($message)
{
    $chatId = $message['chat']['id'];
    $text = $message['text'] ?? '';
    $user = $message['from'];

    // Save user data and log interaction
    $this->saveUserData($user, $message);
    $this->logInteraction($chatId, $text);

    // Handle different message types
    if (str_starts_with($text, '/')) {
        $this->handleCommand($chatId, $text, $message);
    } elseif (isset($message['sticker'])) {
        $this->handleSticker($chatId, $message['sticker']);
    } elseif (isset($message['photo'])) {
        $this->handlePhoto($chatId, $message['photo']);
    } else {
        // ✅ FIX: Check if it's a keyboard button FIRST
        if ($this->isKeyboardButton($text)) {
            $this->handleKeywordDetection($chatId, $text);
        } else {
            // Use AI for natural conversation
            $this->handleNaturalMessage($chatId, $text, $user);
        }
    }
}


private function isKeyboardButton($text)
{
    $buttonTexts = [
        '📈 Market',
        '💎 Packages',
        '📊 Open Account',
        '🎯 Free Trial',
        '✍️ Write Me',
        '📊 My Stats',
        '🧮 Calculator',
        '📖 Guide',
        '❓ Help',
    ];

    $normalizedText = trim($text);
    
    foreach ($buttonTexts as $button) {
        if (strcasecmp($normalizedText, $button) === 0) {
            return true;
        }
    }
    
    return false;
}

    /**
     * Handle edited messages
     */
    private function handleEditedMessage($message)
    {
        // Log edited messages for analytics
        Log::info('Message edited', ['chat_id' => $message['chat']['id']]);
    }

    /**
     * Handle sticker messages with personality
     */
    private function handleSticker($chatId, $sticker)
    {
        $responses = [
            '🔥 Love that sticker! Trade smart, friend!',
            '😄 Nice one! Want to see some market updates? Try /market',
            '👍 Cool! Check out our signals with /trial',
        ];

        $this->sendMessage($chatId, $responses[array_rand($responses)]);
    }

    /**
     * Handle photo uploads (future feature: chart analysis)
     */
    private function handlePhoto($chatId, $photos)
    {
        $this->sendMessage($chatId, "📸 Nice chart! While I can't analyze images yet, our AI is learning. Try /help to see what I can do!");
    }

    // ========================================
    // 🤖 GEMINI AI INTEGRATION
    // ========================================

    /**
     * Handle natural language messages using Gemini AI
     * Falls back to keyword detection if AI is disabled or fails
     */
    private function handleNaturalMessage($chatId, $text, $user)
    {
        if ($this->useAI && ! empty($text)) {
            try {
                // Get conversation context
                $context = $this->getConversationContext($chatId);

                // Generate AI response
                $aiResponse = $this->getGeminiResponse($text, $context, $user);

                if ($aiResponse) {
                    $this->sendMessage($chatId, $aiResponse);

                    // Save AI interaction for learning
                    $this->saveAIInteraction($chatId, $text, $aiResponse);

                    return;
                }
            } catch (\Throwable $e) {
                Log::error('AI Response failed: '.$e->getMessage());
            }
        }

        // Fallback to keyword detection
        $this->handleKeywordDetection($chatId, strtolower($text));
    }

    /**
     * 🚀 Send message to Gemini AI and get intelligent response
     *
     * @param  string  $userMessage  - User's message
     * @param  array  $context  - Previous conversation context
     * @param  array  $userData  - User information
     * @return string|null - AI generated response
     */
    private function getGeminiResponse($userMessage, $context = [], $userData = [])
    {
        if (empty($this->geminiApiKey)) {
            Log::error('Gemini API key is not configured.');

            return null;
        }

        try {
            // Build system instructions for trading bot personality
            $systemInstruction = $this->buildSystemInstruction($userData);

            // Prepare conversation history
            $conversationHistory = $this->buildConversationHistory($context, $userMessage);

            // Make API request to Gemini
            $url = $this->geminiEndpoint.$this->geminiModel.':generateContent?key='.$this->geminiApiKey;

            $response = Http::timeout(15)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($url, [
                    'system_instruction' => [
                        'parts' => [
                            ['text' => $systemInstruction],
                        ],
                    ],
                    'contents' => $conversationHistory,
                    'generationConfig' => [
                        'temperature' => 0.9,
                        'topK' => 40,
                        'topP' => 0.95,
                        'maxOutputTokens' => 1024,
                    ],
                    'safetySettings' => [
                        [
                            'category' => 'HARM_CATEGORY_HARASSMENT',
                            'threshold' => 'BLOCK_MEDIUM_AND_ABOVE',
                        ],
                        [
                            'category' => 'HARM_CATEGORY_HATE_SPEECH',
                            'threshold' => 'BLOCK_MEDIUM_AND_ABOVE',
                        ],
                    ],
                ]);

            if ($response->successful()) {
                $result = $response->json();

                if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
                    $aiText = $result['candidates'][0]['content']['parts'][0]['text'];

                    // Clean and format response
                    return $this->formatAIResponse($aiText);
                }
            }

            Log::warning('Gemini API unsuccessful', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

        } catch (\Throwable $e) {
            Log::error('Gemini API error: '.$e->getMessage());
        }

        return null;
    }

    /**
     * Build system instruction for Gemini with trading bot personality
     */
    private function buildSystemInstruction($userData)
    {
        $firstName = $userData['first_name'] ?? 'Trader';

        return "You are an expert trading bot assistant for Gotham Trading Network. Your personality is:
        
🎯 ROLE: Professional yet friendly trading signals bot
💼 EXPERTISE: Forex, Crypto, Stocks trading + Risk management
🗣️ TONE: Confident, supportive, motivating but never pushy
📊 KNOWLEDGE: Technical analysis, market trends, trading psychology

CORE GUIDELINES:
1. Keep responses concise (2-4 sentences max unless explaining complex topics)
2. Use emojis naturally but not excessively
3. Focus on education and empowerment, not get-rich-quick schemes
4. Always promote responsible trading and risk management
5. Encourage users to try free trial (/trial) when relevant
6. Reference available commands naturally: /market, /prices, /packages, /calculator, /guide
7. Be encouraging about their trading journey
8. Use Markdown formatting for clarity

AVAILABLE SERVICES:
- 7-day FREE trial (encourage this!)
- Premium membership:  (5-8 signals daily)
- VIP: (8-12 signals + mentorship)
- VVIP: (12-15 signals + personal coach, limited 50 spots)
- Referral program (earn free months)
- Risk calculator tools
- Trading guides and education

When users ask about:
- Signals → Promote free trial
- Prices → Mention /market or /prices commands
- Learning → Suggest /guide and /calculator
- Membership → Reference /packages
- Help → Mention /help for all commands

Current user: $firstName
Be personal but professional. Make them feel valued!";
    }

    /**
     * Build conversation history for context-aware responses
     */
    private function buildConversationHistory($context, $currentMessage)
    {
        $history = [];

        // Add previous messages for context
        foreach ($context as $msg) {
            $history[] = [
                'role' => $msg['role'],
                'parts' => [['text' => $msg['content']]],
            ];
        }

        // Add current message
        $history[] = [
            'role' => 'user',
            'parts' => [['text' => $currentMessage]],
        ];

        return $history;
    }

    /**
     * Get recent conversation context for AI
     */
    private function getConversationContext($chatId, $limit = null)
    {
        $limit = $limit ?? $this->aiContextLength;

        $interactions = DB::table('telegram_ai_conversations')
            ->where('chat_id', $chatId)
            ->orderBy('created_at', 'desc')
            ->limit($limit * 2) // Get user + AI pairs
            ->get()
            ->reverse()
            ->values();

        $context = [];
        foreach ($interactions as $interaction) {
            $context[] = [
                'role' => $interaction->role,
                'content' => $interaction->message,
            ];
        }

        return $context;
    }

    /**
     * Format AI response for Telegram
     */
    private function formatAIResponse($text)
    {
        // Clean up response
        $text = trim($text);

        // Ensure it's not too long
        if (strlen($text) > 4000) {
            $text = substr($text, 0, 3997).'...';
        }

        return $text;
    }

    /**
     * Save AI conversation for context and analytics
     */
    private function saveAIInteraction($chatId, $userMessage, $aiResponse)
    {
        try {
            // Save user message
            DB::table('telegram_ai_conversations')->insert([
                'chat_id' => $chatId,
                'role' => 'user',
                'message' => substr($userMessage, 0, 1000),
                'created_at' => Carbon::now(),
            ]);

            // Save AI response
            DB::table('telegram_ai_conversations')->insert([
                'chat_id' => $chatId,
                'role' => 'assistant',
                'message' => substr($aiResponse, 0, 2000),
                'created_at' => Carbon::now(),
            ]);

            // Keep only recent conversations (cleanup old data)
            $this->cleanupOldConversations($chatId);

        } catch (\Throwable $e) {
            Log::error('Failed to save AI interaction: '.$e->getMessage());
        }
    }

    /**
     * Cleanup old conversation history to save space
     */
  private function cleanupOldConversations($chatId, $keepCount = 20)
{
    try {
        $toDelete = DB::table('telegram_ai_conversations')
            ->where('chat_id', $chatId)
            ->orderBy('created_at', 'desc')
            ->skip($keepCount)
            ->take(100) // ✅ ADD THIS LINE - limit the delete batch
            ->pluck('id');

        if ($toDelete->count() > 0) {
            DB::table('telegram_ai_conversations')
                ->whereIn('id', $toDelete)
                ->delete();
        }
    } catch (\Throwable $e) {
        Log::error('Cleanup failed: ' . $e->getMessage());
    }
}

    // ========================================
    // COMMAND HANDLERS
    // ========================================

    /**
     * Enhanced command handler with better parsing
     */
    private function handleCommand($chatId, $cmd, $message = null)
    {
        $parts = explode(' ', trim($cmd));
        $command = strtolower($parts[0]);
        $args = array_slice($parts, 1);

        // Command routing with error handling
        try {
            switch ($command) {
                case '/start':
                    $referralCode = $args[0] ?? null;
                    if ($referralCode && $referralCode !== 'start') {
                        $this->processReferral($chatId, $referralCode);
                    }
                    $this->sendWelcomeMessage($chatId);
                    break;

                case '/help':
                    $this->sendHelpMessage($chatId);
                    break;

                case '/market':
                    $this->sendMarketWithGif($chatId);
                    break;

                case '/prices':
                    $this->sendPrices($chatId);
                    break;

                case '/packages':
                    $this->sendpackagesInfo($chatId);
                    break;

                case '/trial':
                    $this->handleTrialRequest($chatId);
                    break;

                case '/referral':
                    $this->sendReferralInfo($chatId);
                    break;

                case '/contact':
                    $this->sendContactAdmin($chatId);
                    break;

                case '/account':
                    $this->sendOpenAccountInfo($chatId);
                    break;

                case '/calculator':
                    $this->sendRiskCalculator($chatId);
                    break;

                case '/guide':
                    $this->sendTradingGuide($chatId);
                    break;

                case '/mystats':
                    $this->sendUserStats($chatId);
                    break;

                case '/menu':
                    $this->sendPersistentKeyboard($chatId);
                    break;

                case '/hidemenu':
                    $this->removeKeyboard($chatId);
                    break;

                case '/gif':
                    $query = implode(' ', $args) ?: 'trading';
                    $this->sendGifByQuery($chatId, $query);
                    break;

                case '/admin':
                    // Admin-only command
                    if ($this->isAdmin($chatId)) {
                        $this->handleAdminCommand($chatId, $args);
                    }
                    break;

                default:
                    // Use AI to understand unknown commands
                    if ($this->useAI) {
                        $this->handleNaturalMessage($chatId, $cmd, $message['from']);
                    } else {
                        $this->sendMessage($chatId, '❓ Unknown command. Try /help to see available commands.');
                    }
            }
        } catch (\Throwable $e) {
            Log::error('Command error: '.$e->getMessage());
            $this->sendMessage($chatId, '⚠️ Something went wrong. Please try again or contact support.');
        }
    }

    // ========================================
    // DYNAMIC RESPONSE SYSTEM
    // ========================================

    /**
     * Get varied response to prevent repetition
     */
    private function getVariedResponse($category)
    {
        if (isset($this->responseVariations[$category])) {
            return $this->responseVariations[$category][array_rand($this->responseVariations[$category])];
        }

        return null;
    }

    /**
     * Enhanced welcome message with variation
     */
    private function sendWelcomeMessage($chatId)
    {
        $welcomeText = $this->getVariedResponse('welcome');

        $welcomeText .= "\n\n🎯 *What We Offer:*\n"
            ."• Daily trading signals (Forex, Crypto, Stocks)\n"
            ."• Real-time market analysis\n"
            ."• Risk management tools\n"
            ."• Educational resources\n"
            ."• Community support\n\n"
            ."🚀 *Get Started:*\n"
            ."1️⃣ Join our free channel\n"
            ."2️⃣ Try 7-day premium trial (/trial)\n"
            ."3️⃣ Upgrade to VIP access\n\n"
            .'Use the menu below or type /help!';

        $this->sendMessage($chatId, $welcomeText);
        $this->sendRandomGif($chatId, 'welcome');
        $this->sendPersistentKeyboard($chatId);

        // Delay main menu slightly for better UX
        sleep(1);
        $this->sendMainMenu($chatId);
    }

    /**
     * Enhanced help message with AI mention
     */
    private function sendHelpMessage($chatId)
    {
        $helpText = "📘 *Available Commands:*\n\n"
            ."*Trading:*\n"
            ."/market - Market overview with live data\n"
            ."/prices - Crypto prices (BTC, ETH, etc)\n"
            ."/calculator - Position size calculator\n"
            ."/account - Open trading account\n\n"
            ."*Membership:*\n"
            ."/packages - View pricing plans\n"
            ."/trial - Start 7-day free trial\n"
            ."/referral - Earn with referrals\n\n"
            ."*Resources:*\n"
            ."/guide - Download trading guide\n"
            ."/mystats - View your statistics\n"
            ."/contact - Contact admin\n"
            ."/gif <search> - Search for GIFs\n\n"
            ."*Menu:*\n"
            ."/menu - Show persistent menu buttons\n"
            ."/hidemenu - Hide menu buttons\n\n"
            ."🤖 *AI Assistant:* Just chat naturally! I understand questions and can help you.\n\n"
            ."💬 Admin: @{$this->adminUsername}";

        $this->sendMessage($chatId, $helpText);
    }

    /**
     * Enhanced trial request with dynamic responses
     */
    private function handleTrialRequest($chatId)
    {
        // Check if user already used trial
        $hasUsedTrial = DB::table('telegram_trials')
            ->where('chat_id', $chatId)
            ->exists();

        if ($hasUsedTrial) {
            $responses = [
                "⚠️ You've already used your free trial.\n\n💎 Ready for more? Check out our Premium packages with /packages!",
                "🎯 Trial already used!\n\nBut don't worry - our Premium plans offer even more value. Use /packages to explore!",
                "⏰ Your trial period has ended.\n\nUpgrade now to keep receiving premium signals! Type /packages for options.",
            ];
            $this->sendMessage($chatId, $responses[array_rand($responses)]);

            return;
        }

        // Activate trial
        $expiryDate = Carbon::now()->addDays($this->trialDays);

        DB::table('telegram_trials')->insert([
            'chat_id' => $chatId,
            'started_at' => Carbon::now(),
            'expires_at' => $expiryDate,
            'created_at' => Carbon::now(),
        ]);

        DB::table('telegram_users')
            ->where('chat_id', $chatId)
            ->update([
                'membership_tier' => 'trial',
                'trial_expires_at' => $expiryDate,
            ]);

        $trialText = $this->getVariedResponse('trial_activated');

        $trialText .= "\n\n✅ *You now have:*\n"
            ."• 8 daily trading signals\n"
            ."• Priority support\n"
            ."• Advanced market analysis\n"
            ."• Risk management tools\n\n"
            .'📅 Trial expires: '.$expiryDate->format('M d, Y')."\n\n"
            ."🔗 Join VIP group: {$this->vipGroupLink}\n\n"
            .'💡 Love it? Upgrade before trial ends with /packages!';

        $this->sendMessage($chatId, $trialText);
        $this->sendRandomGif($chatId, 'celebration');

        // Notify admin
        $this->notifyAdmin("🆕 New trial user: $chatId");
    }

    // ========================================
    // CALLBACK QUERY HANDLER (Button Clicks)
    // ========================================

    /**
     * Enhanced callback handler with dynamic responses
     */
    private function handleCallbackQuery($cb)
    {
        $data = $cb['data'];
        $chatId = $cb['message']['chat']['id'];
        $messageId = $cb['message']['message_id'];

        // Answer callback immediately
        $this->answerCallbackQuery($cb['id'], '⚡ Processing...');

        try {
            // Route callback data
            switch ($data) {
                case 'market':
                    $this->sendMarketWithGif($chatId);
                    break;

                case 'prices':
                    $this->sendPrices($chatId);
                    break;

                case 'start_trial':
                    $this->handleTrialRequest($chatId);
                    break;

                case 'packages':
                    $this->sendpackagesInfo($chatId);
                    break;

                case 'referral':
                    $this->sendReferralInfo($chatId);
                    break;

                case 'calculator':
                    $this->sendRiskCalculator($chatId);
                    break;

                case 'vip_info':
                    $this->sendVIPInfo($chatId);
                    break;

                case 'vvip_info':
                    $this->sendVVIPInfo($chatId);
                    break;

                case 'get_guide':
                    $this->sendTradingGuide($chatId);
                    break;

                case 'upgrade_premium':
                    $this->sendUpgradeInfo($chatId);
                    break;

                case 'learn_risk':
                    $this->sendRiskManagementLesson($chatId);
                    break;

                default:
                    // Handle dynamic callbacks (e.g., gif:query)
                    if (str_starts_with($data, 'gif:')) {
                        $term = substr($data, 4);
                        $this->sendGifByQuery($chatId, $term);
                    }
            }
        } catch (\Throwable $e) {
            Log::error('Callback error: '.$e->getMessage());
            $this->answerCallbackQuery($cb['id'], '❌ Error occurred', true);
        }
    }

    /**
     * Answer callback query helper
     */
    private function answerCallbackQuery($callbackId, $text, $showAlert = false)
    {
        Http::post("https://api.telegram.org/bot{$this->botToken}/answerCallbackQuery", [
            'callback_query_id' => $callbackId,
            'text' => $text,
            'show_alert' => $showAlert,
        ]);
    }

    // ========================================
    // KEYWORD DETECTION (Fallback)
    // ========================================

    /**
     * Enhanced keyword detection with persistent keyboard support
     */
   private function handleKeywordDetection($chatId, $text)
{
    // Handle persistent keyboard button clicks - FIXED MAPPINGS
    $buttonMappings = [
        '📈 market' => 'market',
        '💎 packages' => 'packages',  // Fixed: lowercase 'packages'
        '📊 open account' => 'account',
        '🎯 free trial' => 'trial',
        '✍️ write me' => 'contact',
        '📊 my stats' => 'stats',
        '🧮 calculator' => 'calculator',
        '📖 guide' => 'guide',
        '❓ help' => 'help',
    ];

    // Normalize text for comparison (lowercase, trim)
    $normalizedText = strtolower(trim($text));

    foreach ($buttonMappings as $button => $action) {
        // Check if normalized button text is in normalized message
        if (str_contains($normalizedText, strtolower($button))) {
            $this->routeButtonAction($chatId, $action);
            return;
        }
    }

    // Keyword-based intelligent responses
    $keywords = [
        'signal' => [
            '📊 Want premium trading signals? Try our 7-day FREE trial! Use /trial',
            '🎯 Daily trading signals available! Start your free trial: /trial',
            '⚡ Get 8 signals daily with our trial. Type /trial to start!'
        ],
        'vip' => [
            '💎 Interested in VIP? Check /packages for all options!',
            '👑 VIP membership includes personal mentorship! See /packages',
            '🌟 Upgrade to VIP for exclusive benefits. Use /packages'
        ],
        'trial' => [
            '🎁 Start your FREE 7-day trial now! Use /trial command',
            '⏰ Limited time: 7 days of premium FREE! Type /trial',
            '🚀 Try before you buy! Use /trial for 7 days free access!'
        ],
        'price' => [
            '💹 Check live prices with /prices or /market',
            '📊 Want to see current market prices? Use /market command',
            '🔥 Live crypto prices available! Type /prices'
        ],
        'help' => [
            '📘 Use /help to see all available commands',
            "🤖 I'm here to help! Type /help for the full command list",
            '✨ Need guidance? Use /help to see what I can do'
        ],
        'refer' => [
            '🎁 Earn rewards with our referral program! Use /referral',
            '💰 Get paid for referrals! Check /referral for details',
            '👥 Invite friends and earn free months! Type /referral'
        ],
        'account' => [
            '📊 Ready to start trading? Use /account to open an account',
            '🚀 Open your trading account with special bonuses! Type /account',
            '💼 Get started with /account command'
        ],
        'contact' => [
            "✍️ Need help? Contact @{$this->adminUsername}",
            "📞 Reach out to our admin: @{$this->adminUsername}",
            "💬 Questions? Message @{$this->adminUsername}"
        ],
        'calculator' => [
            '🧮 Use our risk calculator: /calculator',
            '📐 Calculate position sizes safely with /calculator',
            '⚖️ Smart trading starts with /calculator'
        ],
        'guide' => [
            '📖 Download our trading guide with /guide',
            '📚 Learn the fundamentals! Use /guide',
            '🎓 Free trading education available with /guide'
        ],
        'premium' => [
            '⭐ Upgrade to Premium! Check /packages',
            '💎 Premium plans starting at $49. Use /packages',
            '✨ Go Premium for more signals! Type /packages'
        ],
        'package' => [  // Added 'package' singular
            '💎 View all our packages with /packages',
            '📦 Check pricing plans: /packages',
            '⭐ See membership options: /packages'
        ],
    ];

    foreach ($keywords as $keyword => $responses) {
        if (str_contains($normalizedText, $keyword)) {
            $this->sendMessage($chatId, $responses[array_rand($responses)]);
            return;
        }
    }

    // Default response with AI suggestion
    $defaultResponses = [
        "👋 Hi! I'm not sure I understood that. Try /help to see what I can do, or just chat naturally with me!",
        "🤔 Hmm, I didn't quite catch that. Use /help for commands, or ask me anything about trading!",
        '💬 Hey there! Feel free to ask me questions naturally, or use /help to see all commands.',
    ];

    $this->sendMessage($chatId, $defaultResponses[array_rand($defaultResponses)]);
}

    /**
     * Route button actions from persistent keyboard
     */
   private function routeButtonAction($chatId, $action)
{
    switch ($action) {
        case 'market':
            $this->sendMarketWithGif($chatId);
            break;
        case 'packages':
            $this->sendpackagesInfo($chatId);
            break;
        case 'account':
            $this->sendOpenAccountInfo($chatId);
            break;
        case 'trial':
            $this->handleTrialRequest($chatId);
            break;
        case 'contact':
            $this->sendContactAdmin($chatId);
            break;
        case 'stats':
            $this->sendUserStats($chatId);
            break;
        case 'calculator':
            $this->sendRiskCalculator($chatId);
            break;
        case 'guide':
            $this->sendTradingGuide($chatId);
            break;
        case 'help':
            $this->sendHelpMessage($chatId);
            break;
        default:
            // Fallback for unknown actions
            $this->sendMessage($chatId, "Action not recognized. Try /help");
            break;
    }
}


    // ========================================
    // INFORMATION SENDING FUNCTIONS
    // ========================================

    /**
     * Send packages information with varied intro
     */
    private function sendpackagesInfo($chatId)
    {
        $intros = [
            "💎 *MEMBERSHIP packages*\n\nChoose your trading journey:",
            "🚀 *UNLOCK YOUR POTENTIAL*\n\nOur exclusive packages:",
            "⭐ *PRICING PLANS*\n\nFind your perfect fit:",
        ];

        $packagesText = $intros[array_rand($intros)]."\n\n"
            ."🆓 *FREE TIER*\n"
            ."• 3 daily signals\n"
            ."• Public channel access\n"
            ."• Basic market updates\n"
            ."Price: FREE\n\n"
            ."⭐ *PREMIUM*\n"
            ."• 5-8 daily signals\n"
            ."• Priority support\n"
            ."• Market analysis\n"
            ."• Risk calculator\n"
            ."💎 *VIP*\n"
            ."• 8-12 daily signals\n"
            ."• Private group access\n"
            ."• 1-on-1 mentorship\n"
            ."• Weekly webinars\n"
            ."👑 *VVIP* (Limited to 50)\n"
            ."• 12-15 daily signals\n"
            ."• Personal trading coach\n"
            ."• Portfolio review\n"
            ."• Lifetime support\n"
            .'🎁 Start with 7-day FREE trial!';

        $this->sendMessage($chatId, $packagesText);
        $this->sendRandomGif($chatId, 'money');

        $keyboard = [
            'inline_keyboard' => [
                [
                    ['text' => '🎯 Start Free Trial', 'callback_data' => 'start_trial'],
                    ['text' => '⭐ Go Premium', 'callback_data' => 'upgrade_premium'],
                ],
                [
                    ['text' => '💎 VIP Info', 'callback_data' => 'vip_info'],
                    ['text' => '👑 VVIP Info', 'callback_data' => 'vvip_info'],
                ],
                [
                    ['text' => '📊 Open Trading Account', 'url' => $this->brokerLink],
                ],
            ],
        ];

        $this->sendMessageWithKeyboard($chatId, 'Choose your path:', $keyboard);
    }

    /**
     * Send referral information with user stats
     */
    private function sendReferralInfo($chatId)
    {
        $user = DB::table('telegram_users')->where('chat_id', $chatId)->first();
        $referralCode = $user->referral_code ?? $this->generateReferralCode($chatId);

        $referralCount = DB::table('telegram_referrals')
            ->where('referrer_id', $chatId)
            ->count();

        $intros = [
            "🎁 *REFERRAL PROGRAM*\n\nShare the wealth!",
            "💰 *EARN WITH REFERRALS*\n\nGet rewarded for sharing!",
            "👥 *INVITE & EARN*\n\nGrow together, profit together!",
        ];

        $referralText = $intros[array_rand($intros)]."\n\n"
            ."Your code: `{$referralCode}`\n"
            ."Share: https://t.me/{$this->botUsername}?start={$referralCode}\n\n"
            ."📊 *Your Stats:*\n"
            ."Total referrals: {$referralCount}\n\n"
            ."🏆 *Rewards:*\n"
            ."5 refs → 1 month Premium FREE\n"
            ."10 refs → 2 months VIP FREE\n"
            ."25 refs → 6 months VVIP FREE\n\n"
            .'💰 Each referral also earns you credits!';

        $this->sendMessage($chatId, $referralText);
    }

    /**
     * Send risk calculator with examples
     */
    private function sendRiskCalculator($chatId)
    {
        $examples = [
            'Account: $1,000 | Risk: 2% = $20 | Stop: 50 pips → Size: 0.4 lots',
            'Account: $5,000 | Risk: 1% = $50 | Stop: 30 pips → Size: 1.67 lots',
            'Account: $10,000 | Risk: 2% = $200 | Stop: 100 pips → Size: 2.0 lots',
        ];

        $calcText = "🧮 *RISK CALCULATOR*\n\n"
            ."Calculate your position size safely!\n\n"
            ."*Example:*\n"
            .$examples[array_rand($examples)]."\n\n"
            ."📚 Formula:\n"
            ."`Risk $ ÷ (Stop Loss × Pip Value)`\n\n"
            .'🎓 Pro Tip: Never risk more than 2% per trade!';

        $this->sendMessage($chatId, $calcText);

        $keyboard = [
            'inline_keyboard' => [
                [
                    ['text' => '📖 Learn More', 'callback_data' => 'learn_risk'],
                    ['text' => '📊 Trading Guide', 'callback_data' => 'get_guide'],
                ],
            ],
        ];

        $this->sendMessageWithKeyboard($chatId, 'Need detailed guide?', $keyboard);
    }

    /**
     * Send user statistics
     */
    private function sendUserStats($chatId)
    {
        $user = DB::table('telegram_users')->where('chat_id', $chatId)->first();

        if (! $user) {
            $this->sendMessage($chatId, 'No stats available yet. Start using the bot!');

            return;
        }

        $referralCount = DB::table('telegram_referrals')
            ->where('referrer_id', $chatId)
            ->count();

        $interactionCount = DB::table('telegram_interactions')
            ->where('chat_id', $chatId)
            ->count();

        $aiConversations = DB::table('telegram_ai_conversations')
            ->where('chat_id', $chatId)
            ->where('role', 'user')
            ->count();

        $memberSince = Carbon::parse($user->created_at)->diffForHumans();

        $statsText = "📊 *YOUR STATISTICS*\n\n"
            ."👤 User ID: {$chatId}\n"
            ."📅 Member since: {$memberSince}\n"
            .'🎖 Tier: '.strtoupper($user->membership_tier ?? 'free')."\n"
            ."💬 Total interactions: {$interactionCount}\n"
            ."🤖 AI conversations: {$aiConversations}\n"
            ."👥 Referrals: {$referralCount}\n\n";

        if ($user->trial_expires_at) {
            $trialStatus = Carbon::parse($user->trial_expires_at)->isFuture()
                ? 'Active until '.Carbon::parse($user->trial_expires_at)->format('M d')
                : 'Expired';
            $statsText .= "🎁 Trial: {$trialStatus}\n";
        }

        $this->sendMessage($chatId, $statsText);
    }

    /**
     * Send main menu with inline keyboard
     */
    private function sendMainMenu($chatId)
    {
        $keyboard = [
            'inline_keyboard' => [
                [
                    ['text' => '📈 Market Updates', 'callback_data' => 'market'],
                    ['text' => '💹 Live Prices', 'callback_data' => 'prices'],
                ],
                [
                    ['text' => '🎯 Start Free Trial', 'callback_data' => 'start_trial'],
                    ['text' => '💎 View packages', 'callback_data' => 'packages'],
                ],
                [
                    ['text' => '🎁 Referral Program', 'callback_data' => 'referral'],
                    ['text' => '🧮 Risk Calculator', 'callback_data' => 'calculator'],
                ],
                [
                    ['text' => '📢 Join Channel', 'url' => $this->channelLink],
                    ['text' => '💬 Contact Admin', 'url' => "https://t.me/{$this->adminUsername}"],
                ],
                [
                    ['text' => '📊 Open Trading Account', 'url' => $this->brokerLink],
                ],
            ],
        ];

        $this->sendMessageWithKeyboard($chatId, '⚡ *Quick Actions:*', $keyboard);
    }

    /**
     * Send VVIP membership info
     */
    private function sendVVIPInfo($chatId)
    {
        $text = "👑 *VVIP ELITE MEMBERSHIP*\n\n"
            ."🌟 *Premium Features:*\n"
            ."• 12-15 expert signals daily\n"
            ."• Personal trading coach\n"
            ."• Portfolio analysis & review\n"
            ."• Exclusive market insights\n"
            ."• Direct access to head trader\n"
            ."• Weekly 1-on-1 coaching calls\n"
            ."• Lifetime priority support\n"
            ."• Private VVIP group access\n\n"
            ."⚠️ *Limited to 50 members only*\n\n"
            .'🔥 Join the elite trading club!';

        $this->sendMessage($chatId, $text);
        $this->sendRandomGif($chatId, 'rocket');
    }

    /**
     * Send trading guide
     */
    private function sendTradingGuide($chatId)
    {
        $this->sendMessage($chatId, "📖 *TRADING GUIDE*\n\nPreparing your comprehensive trading guide...");

        $guideText = "📚 *Complete Trading Guide Topics:*\n\n"
            ."1️⃣ *Risk Management*\n"
            ."   • Position sizing\n"
            ."   • Stop loss placement\n"
            ."   • Risk-reward ratios\n\n"
            ."2️⃣ *Technical Analysis*\n"
            ."   • Chart patterns\n"
            ."   • Indicators & oscillators\n"
            ."   • Support & resistance\n\n"
            ."3️⃣ *Trading Psychology*\n"
            ."   • Emotional control\n"
            ."   • Discipline & patience\n"
            ."   • Avoiding common mistakes\n\n"
            ."4️⃣ *Position Sizing*\n"
            ."   • Kelly criterion\n"
            ."   • Fixed fractional\n"
            ."   • Calculator usage\n\n"
            ."📥 Download full PDF from our channel:\n{$this->channelLink}";

        $this->sendMessage($chatId, $guideText);
        $this->sendRandomGif($chatId, 'thinking');
    }

    /**
     * Send upgrade information
     */
    private function sendUpgradeInfo($chatId)
    {
        $text = "⭐ *UPGRADE TO PREMIUM*\n\n"
            ."Ready to level up your trading?\n\n"
            ."💳 *Payment Options:*\n"
            ."• PayPal\n"
            ."• Crypto (BTC/USDT/ETH)\n"
            ."• Bank Transfer\n"
            ."• Credit/Debit Card\n\n"
            ."📞 Contact @{$this->adminUsername} to upgrade\n\n"
            ."🎁 Or start FREE trial: /trial\n\n"
            ."💡 *Current Promotion:*\n"
            .'Get 20% off annual subscriptions!';

        $this->sendMessage($chatId, $text);
    }

    /**
     * Send contact admin info
     */
    private function sendContactAdmin($chatId)
    {
        $text = "✍️ *CONTACT ADMIN*\n\n"
            ."Need help or have questions?\n\n"
            ."👤 Reach out to our admin:\n"
            ."📱 @{$this->adminUsername}\n\n"
            ."We're here to help you succeed! 🚀\n\n"
            ."*Response Time:* Usually within 1-2 hours\n\n"
            ."*Available 24/7 for:*\n"
            ."• Account issues\n"
            ."• Upgrade questions\n"
            ."• Technical support\n"
            .'• Trading advice';

        $keyboard = [
            'inline_keyboard' => [
                [
                    ['text' => '💬 Message Admin', 'url' => "https://t.me/{$this->adminUsername}"],
                ],
                [
                    ['text' => '📢 Join Channel', 'url' => $this->channelLink],
                    ['text' => '👥 VIP Group', 'url' => $this->vipGroupLink],
                ],
            ],
        ];

        $this->sendMessageWithKeyboard($chatId, $text, $keyboard);
    }

    /**
     * Send open account information
     */
    private function sendOpenAccountInfo($chatId)
    {
        $text = "📊 *OPEN TRADING ACCOUNT*\n\n"
            ."🎁 *Exclusive Partner Offer:*\n\n"
            ."✨ *Blueberry Markets Benefits:*\n"
            ."• Ultra-low spreads from 0.0 pips\n"
            ."• Lightning-fast execution\n"
            ."• $0 minimum deposit\n"
            ."• MT4/MT5 platforms\n"
            ."• 24/7 multilingual support\n"
            ."• Regulated broker (ASIC)\n\n"
            ."🔗 Click below to get started:\n\n"
            .'💡 *Pro Tip:* After opening your account, join our signals channel for daily trade setups!';

        $keyboard = [
            'inline_keyboard' => [
                [
                    ['text' => '🚀 Open Account Now', 'url' => $this->brokerLink],
                ],
                [
                    ['text' => '📢 Join Signals Channel', 'url' => $this->channelLink],
                    ['text' => '❓ Need Help?', 'url' => "https://t.me/{$this->adminUsername}"],
                ],
            ],
        ];

        $this->sendMessageWithKeyboard($chatId, $text, $keyboard);
        $this->sendRandomGif($chatId, 'money');
    }

    /**
     * Send risk management lesson
     */
    private function sendRiskManagementLesson($chatId)
    {
        $text = "🎓 *RISK MANAGEMENT 101*\n\n"
            ."*Golden Rules:*\n\n"
            ."1️⃣ *Never risk more than 2% per trade*\n"
            ."   This ensures you can survive 50 losing trades\n\n"
            ."2️⃣ *Use stop losses ALWAYS*\n"
            ."   No exceptions. Protect your capital.\n\n"
            ."3️⃣ *Aim for 2:1 Risk-Reward minimum*\n"
            ."   Win more when right, lose less when wrong\n\n"
            ."4️⃣ *Don't overtrade*\n"
            ."   Quality over quantity wins every time\n\n"
            ."5️⃣ *Keep a trading journal*\n"
            ."   Learn from winners AND losers\n\n"
            .'💡 *Remember:* Preservation of capital is priority #1!';

        $this->sendMessage($chatId, $text);
    }

    // ========================================
    // MARKET DATA FUNCTIONS
    // ========================================

    /**
     * Send market overview with live data and GIF
     */
    private function sendMarketWithGif($chatId)
    {
        $prices = $this->getPrices(['bitcoin', 'ethereum', 'binancecoin']);

        $intro = $this->getVariedResponse('market_intro');

        $text = $intro."\n\n"
            .'🟠 BTC: $'.number_format($prices['bitcoin'], 2)."\n"
            .'🔷 ETH: $'.number_format($prices['ethereum'], 2)."\n"
            .'🟡 BNB: $'.number_format($prices['binancecoin'], 2)."\n\n"
            .'⏰ Updated: '.Carbon::now()->format('H:i')." UTC\n"
            .'📊 Use /prices for more coins';

        $this->sendMessage($chatId, $text);
        $this->sendRandomGif($chatId, 'charts');
    }

    /**
     * Send detailed crypto prices
     */
    private function sendPrices($chatId)
    {
        $prices = $this->getPrices(['bitcoin', 'ethereum', 'litecoin', 'ripple', 'cardano', 'solana', 'polkadot']);

        $reply = "💹 *LIVE CRYPTO PRICES*\n\n";
        $emojis = [
            'bitcoin' => '🟠',
            'ethereum' => '🔷',
            'litecoin' => '⚪',
            'ripple' => '🔵',
            'cardano' => '🔷',
            'solana' => '🟣',
            'polkadot' => '🔴',
        ];

        foreach ($prices as $k => $v) {
            $emoji = $emojis[$k] ?? '💰';
            $name = ucfirst($k);
            $reply .= $emoji.' '.strtoupper($name).': $'.number_format($v, 2)."\n";
        }

        $reply .= "\n⏰ ".Carbon::now()->format('H:i').' UTC';
        $reply .= "\n\n📊 Want signals? Try /trial for free!";

        $this->sendMessage($chatId, $reply);
    }

    /**
     * Get cryptocurrency prices from CoinGecko with caching
     */
    private function getPrices($ids)
    {
        return Cache::remember('cg_'.implode('_', $ids), 30, function () use ($ids) {
            try {
                $res = Http::timeout(5)->get($this->coingeckoBase.'/simple/price', [
                    'ids' => implode(',', $ids),
                    'vs_currencies' => 'usd',
                ]);

                if ($res->successful()) {
                    $json = $res->json();
                    $out = [];
                    foreach ($ids as $id) {
                        $out[$id] = $json[$id]['usd'] ?? 0;
                    }

                    return $out;
                }
            } catch (\Throwable $e) {
                Log::error('CoinGecko error: '.$e->getMessage());
            }

            return array_fill_keys($ids, 0);
        });
    }

    // ========================================
    // GIF FUNCTIONS
    // ========================================

    /**
     * Send random GIF from category
     */
    private function sendRandomGif($chatId, $category)
    {
        if (isset($this->gifCategories[$category])) {
            $queries = $this->gifCategories[$category];
            $query = $queries[array_rand($queries)];
            $this->sendGifByQuery($chatId, $query);
        }
    }

    /**
     * Get GIF URL from Tenor API
     */
    private function getGifFromTenor($query)
    {
        try {
            $res = Http::timeout(5)->get('https://tenor.googleapis.com/v2/search', [
                'key' => $this->tenorKey,
                'q' => $query,
                'limit' => 1,
                'media_filter' => 'minimal',
            ]);

            if ($res->successful()) {
                $json = $res->json();

                if (isset($json['results'][0]['media_formats']['gif']['url'])) {
                    return $json['results'][0]['media_formats']['gif']['url'];
                }
            }
        } catch (\Throwable $e) {
            Log::error('Tenor error: '.$e->getMessage());
        }

        return null;
    }

    /**
     * Send GIF by search query
     */
    private function sendGifByQuery($chatId, $query)
    {
        $url = $this->getGifFromTenor($query);

        if (! $url) {
            Log::warning("No GIF found for: $query");

            return;
        }

        $this->sendAnimation($chatId, $url);
    }

    /**
     * Send animation/GIF to chat
     */
    private function sendAnimation($chatId, $url)
    {
        Http::post("https://api.telegram.org/bot{$this->botToken}/sendAnimation", [
            'chat_id' => $chatId,
            'animation' => $url,
        ]);
    }

    // ========================================
    // MESSAGING FUNCTIONS
    // ========================================

    /**
     * Send text message
     */
    private function sendMessage($chatId, $text)
    {
        Http::post("https://api.telegram.org/bot{$this->botToken}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'Markdown',
        ]);
    }

    /**
     * Send message with inline keyboard
     */
    private function sendMessageWithKeyboard($chatId, $text, $keyboard)
    {
        Http::post("https://api.telegram.org/bot{$this->botToken}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'Markdown',
            'reply_markup' => json_encode($keyboard),
        ]);
    }

    /**
     * Send persistent keyboard (reply keyboard)
     */
  private function sendPersistentKeyboard($chatId)
{
    $keyboard = [
        'keyboard' => [
            [
                ['text' => '📈 Market'],
                ['text' => '💎 Packages'],  // Changed from 'packages' to 'Packages'
                ['text' => '📊 Open Account'], 
            ],
            [
                ['text' => '🎯 Free Trial'],  // Changed from 'free trial'
                ['text' => '✍️ Write Me'],
                ['text' => '📊 My Stats'],
            ],
            [
                ['text' => '🧮 Calculator'],
                ['text' => '📖 Guide'],
                ['text' => '❓ Help'],
            ],
        ],
        'resize_keyboard' => true,
        'persistent' => true,
    ];

    Http::post("https://api.telegram.org/bot{$this->botToken}/sendMessage", [
        'chat_id' => $chatId,
        'text' => "⚡ *Quick Access Menu Activated!*\n\nUse the buttons below for quick commands, or just chat naturally with me!",
        'parse_mode' => 'Markdown',
        'reply_markup' => json_encode($keyboard),
    ]);
}

    /**
     * Remove persistent keyboard
     */
    private function removeKeyboard($chatId)
    {
        $keyboard = [
            'remove_keyboard' => true,
        ];

        Http::post("https://api.telegram.org/bot{$this->botToken}/sendMessage", [
            'chat_id' => $chatId,
            'text' => 'Menu removed. Type /menu to get it back anytime!',
            'reply_markup' => json_encode($keyboard),
        ]);
    }

    // ========================================
    // DATABASE FUNCTIONS
    // ========================================

    /**
     * Save or update user data
     */
    private function saveUserData($user, $message)
    {
        $chatId = $user['id'];
        $username = $user['username'] ?? null;
        $firstName = $user['first_name'] ?? null;
        $lastName = $user['last_name'] ?? null;

        $existing = DB::table('telegram_users')->where('chat_id', $chatId)->exists();

        if ($existing) {
            DB::table('telegram_users')
                ->where('chat_id', $chatId)
                ->update([
                    'username' => $username,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'last_active_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);
        } else {
            DB::table('telegram_users')->insert([
                'chat_id' => $chatId,
                'username' => $username,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'referral_code' => $this->generateReferralCode($chatId),
                'membership_tier' => 'free',
                'last_active_at' => Carbon::now(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }

    /**
     * Log user interaction
     */
    private function logInteraction($chatId, $message)
    {
        DB::table('telegram_interactions')->insert([
            'chat_id' => $chatId,
            'message' => substr($message, 0, 500),
            'created_at' => Carbon::now(),
        ]);
    }

    /**
     * Generate unique referral code
     */
    private function generateReferralCode($chatId)
    {
        return 'REF'.strtoupper(substr(md5($chatId.time()), 0, 8));
    }

    /**
     * Process referral when user joins via referral link
     */
    private function processReferral($chatId, $referralCode)
    {
        $referrer = DB::table('telegram_users')
            ->where('referral_code', $referralCode)
            ->first();

        if (! $referrer) {
            return;
        }

        // Save referral
        DB::table('telegram_referrals')->insert([
            'referrer_id' => $referrer->chat_id,
            'referred_id' => $chatId,
            'created_at' => Carbon::now(),
        ]);

        // Notify referrer
        $this->sendMessage($referrer->chat_id, '🎉 New referral! You earned credits. Use /referral to see your stats.');
    }

    private function notifyAdmin($message)
    {
        if ($this->adminChatId) {
            $this->sendMessage($this->adminChatId, "🔔 *Admin Notification*\n\n".$message);
        }
    }

    // ===== ADDITIONAL INFO FUNCTIONS =====

    private function sendVIPInfo($chatId)
    {
        $text = "💎 *VIP MEMBERSHIP*\n\n"
            ."✨ *Includes:*\n"
            ."• 8-12 premium signals daily\n"
            ."• Private Telegram group\n"
            ."• Weekly market webinars\n"
            ."• 1-on-1 mentorship sessions\n"
            ."• Priority customer support\n"
            ."• Advanced trading tools\n\n"
            .'🎁 Try FREE for 7 days with /trial';

        $this->sendMessage($chatId, $text);
        $this->sendGifByCategory($chatId, 'victory');
    }
}
