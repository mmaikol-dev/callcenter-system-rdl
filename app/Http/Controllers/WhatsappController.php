<?php

namespace App\Http\Controllers;

use App\Models\SheetOrder;
use App\Models\User;
use App\Models\Whatsapp;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log; 


class WhatsappController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }
    
    
      public function sendChat(Request $request)
{
    Log::info("📩 Incoming sendChat request", $request->all());

    $request->validate([
        'to' => 'required|string',   // phone comes from frontend
        'message' => 'required|string',
    ]);

    $phone = $this->formatPhoneNumber($request->to, 'RDL1');
    if (!$phone) {
        Log::error("❌ Invalid phone number", ['to' => $request->to]);
        return response()->json(['error' => 'Invalid phone number'], 400);
    }

    // Get current logged-in user username
   // Get current logged-in user username
$user = auth()->user();
$username = $user && isset($user->username) && $user->username
    ? $user->username
    : 'Callcenter1'; // fallback if username is missing


    $accessToken = config('services.whatsapp.meta.access_token');
    if (!$accessToken) {
        Log::error('WhatsApp chat send attempted without Meta credentials configured.');
        return response()->json(['error' => 'Meta WhatsApp is not configured.'], 503);
    }

    $phoneNumberId = '825780310626033'; // 👈 replace with your Meta phone number ID
    $url = "https://graph.facebook.com/v22.0/{$phoneNumberId}/messages";

    Log::info("🚀 Sending WhatsApp template", [
        'to' => $phone,
        'username' => $username,
        'message' => $request->message
    ]);

    $response = Http::withToken($accessToken)->post($url, [
        'messaging_product' => 'whatsapp',
        'to' => $phone,
        'type' => 'template',
        'template' => [
            'name' => 'chatrdl',
            'language' => ['code' => 'en'],
            'components' => [[
                'type' => 'body',
                'parameters' => [
                    ['type' => 'text', 'text' => $username],         // {{1}}
                    ['type' => 'text', 'text' => $request->message], // {{2}}
                ],
            ]],
        ],
    ]);

    if ($response->successful()) {
        $sid = $response->json('messages.0.id');

        Whatsapp::create([
            'to' => $phone,
            'client_name' => $username,
            'store_name' => 'CHAT',
         'message' => "Talking to {$username} from RealDeal.\nMessage: {$request->message}",
            'status' => 'sent',
            'sid' => $sid,
            'type' => 'template',
        ]);

        Log::info("✅ WhatsApp message sent", ['sid' => $sid]);

        return response()->json(['success' => true, 'sid' => $sid]);
    } else {
        Log::error("❌ Template send failed", ['resp' => $response->body()]);
        return response()->json(['error' => 'Failed to send', 'resp' => $response->json()], 500);
    }
}

public function sendMessage($id)
{
    Log::info("📤 Sending WhatsApp for Order ID: $id");

    try {
        $order = SheetOrder::findOrFail($id);

        $client_name = $order->client_name ?? 'Client';
        $store_name = strtoupper($order->store_name ?? 'STORE');
        $order_no = $order->order_no;
        $product_name = $order->product_name;
        $quantity = $order->quantity;
        $amount = $order->amount;
        $cc_email = $order->cc_email ?? null;
        
        // 👇 Debug logging to see what cc_email contains
        Log::info("🔍 CC Email value from order: " . ($cc_email ?? 'NULL'));
        Log::info("🔍 Order data: ", $order->toArray());

        // Format phone number
        $phone = $this->formatPhoneNumber($order->phone, $store_name);
        if (!$phone) {
            Log::warning("📞 Primary phone invalid. Trying alt_no.");
            $phone = $this->formatPhoneNumber($order->alt_no, $store_name);
        }

        if (!$phone) {
            Log::error("❌ Both phone and alt_no are invalid.");
            return response()->json(['error' => 'Invalid phone number and alt_no.'], 400);
        }

        // Select template and phone number ID based on store
        switch ($store_name) {
            case 'RDL1':
                $templateName = 'pending_template';
                $phoneNumberId = '825780310626033';
                $messageParams = [
                    ['type' => 'text', 'text' => $client_name],
                    ['type' => 'text', 'text' => $order_no],
                    ['type' => 'text', 'text' => $product_name],
                    ['type' => 'text', 'text' => (string) $quantity],
                    ['type' => 'text', 'text' => 'KES ' . number_format($amount)],
                ];
                break;

            case 'RDL2':
                $templateName = 'pending_template';
                $phoneNumberId = '825780310626033';
                $messageParams = [
                    ['type' => 'text', 'text' => $client_name],
                    ['type' => 'text', 'text' => $order_no],
                    ['type' => 'text', 'text' => $product_name],
                    ['type' => 'text', 'text' => (string) $quantity],
                    ['type' => 'text', 'text' => 'KES ' . number_format($amount)],
                ];
                break;

            case 'RDL3':
                $templateName = 'reminder_tz';
                $phoneNumberId = '825780310626033';
                $messageParams = [
                    ['type' => 'text', 'text' => $client_name],
                    ['type' => 'text', 'text' => $order_no],
                    ['type' => 'text', 'text' => $product_name],
                    ['type' => 'text', 'text' => (string) $quantity],
                    ['type' => 'text', 'text' => 'TZS ' . number_format($amount)],
                ];
                break;

            default:
                Log::error("❌ Unknown store: {$store_name}");
                return response()->json(['error' => "Unknown store: {$store_name}"], 422);
        }

        $accessToken = config('services.whatsapp.meta.access_token');
        if (!$accessToken) {
            Log::error('WhatsApp order message attempted without Meta credentials configured.');
            return response()->json(['error' => 'Meta WhatsApp is not configured.'], 503);
        }

        $url = "https://graph.facebook.com/v22.0/{$phoneNumberId}/messages";

        $response = Http::withToken($accessToken)->post($url, [
            'messaging_product' => 'whatsapp',
            'to' => $phone,
            'type' => 'template',
            'template' => [
                'name' => $templateName,
                'language' => ['code' => 'en'],
                'components' => [
                    [
                        'type' => 'body',
                        'parameters' => $messageParams
                    ]
                ]
            ]
        ]);

        if ($response->successful()) {
            Log::info("✅ WhatsApp sent to {$phone}");

            $whatsappData = [
                'to' => $phone,
                'client_name' => $client_name,
                'store_name' => $store_name,
                'cc_agents' => $cc_email,
                'message' => "Hi {$client_name}, this is Realdeal Logistics, We tried contacting you regarding your order {$order_no} for {$product_name} ({$quantity} pcs) but your phone was unreachable.

Please call us back on 0740801187 to confirm your availability so we can deliver your order.

Thank you.",
                'status' => 'sent',
                'sid' => $response->json('messages.0.id') ?? null,
            ];
            
            // 👇 Debug logging to see what's being saved
            Log::info("💾 Saving WhatsApp data: ", $whatsappData);

            $whatsapp = Whatsapp::create($whatsappData);
            
            // 👇 Debug logging to see what was actually saved
            Log::info("✅ Saved WhatsApp record: ", $whatsapp->toArray());

            return back()->with('success', 'WhatsApp message sent successfully ✅');

        } else {
            Log::error("❌ WhatsApp API error", ['response' => $response->body()]);
            return back()->with('error', 'Failed to send WhatsApp message ❌');

        }

    } catch (\Exception $e) {
        Log::error("❌ WhatsApp sending failed", ['error' => $e->getMessage()]);
        return back()->with('error', 'Failed to send WhatsApp message ❌');

    }
}

private function formatPhoneNumber($phoneNumber, $storeName)
{
    $phoneNumber = preg_replace('/\D/', '', $phoneNumber);
    $countryCode = strtoupper($storeName) === 'RDL3' ? '+255' : '+254';

    // Must be at least 9 digits
    if (empty($phoneNumber) || strlen($phoneNumber) < 9) {
        return null;
    }

    if (str_starts_with($phoneNumber, '0')) {
        return $countryCode . substr($phoneNumber, 1);
    } elseif (str_starts_with($phoneNumber, '254') || str_starts_with($phoneNumber, '255')) {
        return '+' . $phoneNumber;
    } else {
        return $countryCode . $phoneNumber;
    }
}


// Inside WhatsappController.php

public function webhook(Request $request)
{
    // Log everything that comes from WhatsApp
    Log::info("📩 WhatsApp Webhook received", $request->all());

    // ✅ 1. Handle verification challenge from Meta
    if ($request->has('hub_mode') && $request->hub_mode === 'subscribe') {
        $verifyToken = 'realdeal_token'; // 👈 Your verify token (hardcoded for testing)
        if ($request->hub_verify_token === $verifyToken) {
            return response($request->hub_challenge, 200);
        } else {
            return response('Invalid verification token', 403);
        }
    }

    // ✅ 2. Handle messages and status updates
    if ($request->has('entry')) {
        foreach ($request->entry as $entry) {
            if (!empty($entry['changes'])) {
                foreach ($entry['changes'] as $change) {
                    $value = $change['value'];

                    // Message received from customer
                    if (isset($value['messages'])) {
                        foreach ($value['messages'] as $message) {
                            Log::info("📨 Incoming message", $message);

                            // Save to DB for testing
                            Whatsapp::create([
                                'to' => $message['from'], // sender number
                                'client_name' => 'UNKNOWN',
                                'store_name' => 'WEBHOOK',
                                'message' => $message['text']['body'] ?? 'N/A',
                                'status' => 'received',
                                'sid' => $message['id'],
                                'type' => '1',
                            ]);
                        }
                    }

                    // Status updates for sent messages
                    if (isset($value['statuses'])) {
                        foreach ($value['statuses'] as $status) {
                            Log::info("📊 Message status update", $status);

                            Whatsapp::where('sid', $status['id'])->update([
                                'status' => $status['status'] // sent, delivered, read
                            ]);
                        }
                    }
                }
            }
        }
    }

    return response('EVENT_RECEIVED', 200);
}


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Whatsapp $whatsapp)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Whatsapp $whatsapp)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Whatsapp $whatsapp)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Whatsapp $whatsapp)
    {
        //
    }
}
