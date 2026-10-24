<?php

namespace App\Http\Controllers;

use App\Models\ScheduledMediaMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ScheduledMediaMessagesController extends Controller
{
    // ============================
    // INDEX (list all messages)
    // ============================
    public function index()
    {
        $messages = ScheduledMediaMessage::orderBy('send_at', 'desc')
            ->get()
            ->map(function ($msg) {
                $msg->image_urls = collect($msg->images ?? [])
                    ->map(fn ($i) => asset('storage/' . $i));
                return $msg;
            });

        return inertia('scheduledmediamessages/index', [
            'messages' => $messages
        ]);
    }

    // ============================
    // CREATE (load create.tsx)
    // ============================
    public function create()
    {
        return inertia('scheduledmediamessages/create');
    }

    // ============================
    // STORE
    // ============================
    public function store(Request $request)
    {
        Log::info('ScheduledMediaMessageController@store START', [
            'input' => $request->all(),
        ]);

        $request->validate([
            'message'   => 'nullable|string',
            'images'    => 'nullable|array',  // ADD THIS LINE - validate images as array
            'images.*'  => 'image|mimes:jpg,jpeg,png,gif,webp|max:5120',
            'send_at'   => 'required|date',
        ]);

        Log::info('Validation passed', [
            'message' => $request->message,
            'send_at' => $request->send_at,
        ]);

        $imagePaths = [];

        // Check for files using both methods
        if ($request->hasFile('images') || $request->has('images')) {
            $files = $request->file('images') ?: $request->input('images');
            
            if (is_array($files)) {
                foreach ($files as $image) {
                    if ($image && $image->isValid()) {
                        $path = $image->store('scheduled_messages', 'public');
                        $imagePaths[] = $path;
                        Log::info('Image stored successfully', ['path' => $path]);
                    }
                }
            }
        }

        Log::info('Images processed', [
            'count' => count($imagePaths),
            'paths' => $imagePaths
        ]);

        $record = ScheduledMediaMessage::create([
            'message' => $request->message,
            'images'  => $imagePaths,
            'send_at' => $request->send_at,
        ]);

        Log::info('Record created in DB', [
            'id' => $record->id,
            'images_saved' => $record->images
        ]);

        return redirect()
            ->route('scheduledmediamessages.index')
            ->with('success', 'Scheduled message created successfully.');
    }

    // ============================
    // SHOW (for view modal)
    // ============================
    public function show($id)
    {
        $msg = ScheduledMediaMessage::findOrFail($id);

        $msg->image_urls = collect($msg->images ?? [])
            ->map(fn ($i) => asset('storage/' . $i));

        return response()->json($msg);
    }

    // ============================
    // UPDATE
    // ============================
    public function update(Request $request, $id)
    {
        $msg = ScheduledMediaMessage::findOrFail($id);

        $request->validate([
            'message'   => 'nullable|string',
            'send_at'   => 'required|date',
            'images'    => 'nullable|array',  // ADD THIS LINE
            'images.*'  => 'image|mimes:jpg,jpeg,png,gif,webp|max:5120'
        ]);

        $imagePaths = $msg->images ?? [];

        // Check for files using both methods
        if ($request->hasFile('images') || $request->has('images')) {
            $files = $request->file('images') ?: $request->input('images');
            
            if (is_array($files)) {
                // Delete old images
                foreach ($imagePaths as $oldImg) {
                    Storage::disk('public')->delete($oldImg);
                }

                // Store new images
                $imagePaths = [];
                foreach ($files as $image) {
                    if ($image && $image->isValid()) {
                        $imagePaths[] = $image->store('scheduled_messages', 'public');
                    }
                }
            }
        }

        $msg->update([
            'message' => $request->message,
            'send_at' => $request->send_at,
            'images'  => $imagePaths,
        ]);

        return redirect()
            ->route('scheduledmediamessages.index')
            ->with('success', 'Scheduled message updated.');
    }

    // ============================
    // DELETE
    // ============================
    public function destroy($id)
    {
        $msg = ScheduledMediaMessage::findOrFail($id);

        if ($msg->images) {
            foreach ($msg->images as $img) {
                Storage::disk('public')->delete($img);
            }
        }

        $msg->delete();

        return redirect()
            ->route('scheduledmediamessages.index')
            ->with('success', 'Scheduled message deleted.');
    }
}