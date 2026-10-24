<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'africastalking' => [
        'username' => env('AFRICASTALKING_USERNAME'),
        'key' => env('AFRICASTALKING_API_KEY'),
    ],


    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],

        'mpesa' => [
    'env'             => env('MPESA_ENV', 'sandbox'),
    'consumer_key'    => env('MPESA_CONSUMER_KEY'),
    'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
    'shortcode'       => env('MPESA_SHORTCODE'),
    'passkey'         => env('MPESA_PASSKEY'),
    'callback_url'    => env('MPESA_CALLBACK'),
    'oauth_url'       => env('MPESA_OAUTH_URL'),
    'stk_url'         => env('MPESA_STK_URL'),
    'stk_query_url'   => env('MPESA_STK_QUERY_URL'),
],

    ],

    'whatsapp' => [
        'meta' => [
            'access_token' => env('WHATSAPP_META_ACCESS_TOKEN'),
            'phone_number_id' => env('WHATSAPP_META_PHONE_NUMBER_ID'),
            'api_version' => env('WHATSAPP_META_API_VERSION', 'v22.0'),
            'template_name' => env('WHATSAPP_META_TEMPLATE_NAME', 'inventory_stock_alert'),
            'template_language' => env('WHATSAPP_META_TEMPLATE_LANGUAGE', 'en'),
        ],
        'openwa' => [
            'base_url' => env('OPENWA_BASE_URL', 'http://localhost:2785'),
            'session' => env('OPENWA_SESSION'),
            'api_key' => env('OPENWA_API_KEY'),
        ],
    ],

    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN'),
    ],

    'tenor' => [
        'api_key' => env('TENOR_API_KEY'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
    ],

];
