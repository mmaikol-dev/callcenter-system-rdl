<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use App\Models\InventoryLog;
use App\Models\Barcode;
use App\Models\Category;
use App\Models\Unit;
use App\Services\InventoryWhatsAppNotifier;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    // --- INDEX ---
   public function index(Request $request)
{
    $user = $request->user();
    $isMerchant = $user->roles === 'merchant';
    $categories = Category::select('id', 'name')->get();
    $units = Unit::select('id', 'name', 'short_code')->get();
    $productsQuery = Product::query();

    // Apply merchant filter using UUIDs
    if ($isMerchant) {
        $productsQuery->where('uuid', $user->uuid);
    }

    $search = trim((string) $request->query('search', ''));
    if ($search !== '') {
        $productsQuery->where(function ($query) use ($search) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('store_name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%");
        });
    }

    // Paginate with 50 items per page
    $products = $productsQuery->orderBy('created_at', 'desc')->paginate(50)->withQueryString();

    return Inertia::render('products/index', [
        'products' => $products,
        'categories' => $categories,
        'units' => $units,
        'filters' => ['search' => $search],
    ]);
}

    // --- INVENTORY LOGS ---
    public function inventoryLogs($productCode)
    {
        $logs = InventoryLog::where('product_code', $productCode)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['logs' => $logs]);
    }

    // --- UPDATE QUANTITY (Now generates barcodes when adding stock) ---
    public function updateQuantity(Request $request, Product $product)
    {
        $request->validate([
            'quantity_change' => 'required|numeric',
            'reason' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $change = (int) $request->quantity_change;

        DB::beginTransaction();
        try {
            $previousQuantity = (int) $product->quantity;
            $newQuantity = $previousQuantity + $change;

            if ($newQuantity < 0) {
                DB::rollBack();
                return redirect()->route('products.index')
                    ->with('errorMessage', 'Quantity cannot be negative.');
            }

            // Update product quantity
            $product->update(['quantity' => $newQuantity]);

            // If quantity increased, generate barcodes for the added units
            if ($change > 0) {
                $this->bulkGenerateBarcodesForProduct($product, $change, $user);
            }

            // Log the change
            $inventoryLog = InventoryLog::create([
                'product_name'    => $product->name,
                'product_code'    => $product->code,
                'quantity_added'  => $change,
                'remaining_qnty'  => $newQuantity,
                'added_by'        => $user->name,
                'reason'          => $request->reason,
                'product_unit_id' => $product->unit_id,
                'date_added'      => now(),
            ]);

            if ($change !== 0) {
                app(InventoryWhatsAppNotifier::class)->notifyStockChange(
                    $product,
                    $previousQuantity,
                    (int) $newQuantity,
                    $user,
                    $request->reason,
                    "inventory-log:{$inventoryLog->id}",
                );
            }

            DB::commit();

            return redirect()->route('products.index')
                ->with('successMessage', 'Quantity updated successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('products.index')
                ->with('errorMessage', 'Failed to update quantity: ' . $e->getMessage());
        }
    }

    // --- HELPER: Generate product code ---
    private function generateUniqueCode()
    {
        $lastProduct = Product::orderBy('id', 'desc')->first();
        $nextId = $lastProduct ? $lastProduct->id + 1 : 1;
        $code = 'PC-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);

        // Ensure uniqueness
        while (Product::where('code', $code)->exists()) {
            $nextId++;
            $code = 'PC-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
        }

        return $code;
    }

    // --- HELPER: Slug generator ---
    private function generateSlug($name)
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while (Product::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    // --- CREATE (store) with bulk barcode generation ---
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'quantity' => 'required|numeric',
            'buying_price' => 'nullable|numeric',
            'selling_price' => 'nullable|numeric',
            'quantity_alert' => 'required|numeric',
            'tax' => 'nullable|numeric',
            'tax_type' => 'nullable|string',
            'notes' => 'nullable|string',
            'product_image' => 'nullable|string',
            'category_id' => 'required|integer|exists:categories,id',
            'unit_id' => 'required|integer|exists:units,id',
        ]);

        $user = $request->user();

        // Auto-generate fields
        $slug = $this->generateSlug($request->name);
        $code = $this->generateUniqueCode();
        $storeName = $user->name . ' Store';

        $data = [
            'user_id' => $user->id,
            'uuid' => $user->uuid,
            'name' => $request->name,
            'store_name' => $storeName,
            'slug' => $slug,
            'code' => $code,
            'quantity' => $request->quantity,
            'buying_price' => $request->buying_price,
            'selling_price' => $request->selling_price,
            'quantity_alert' => $request->quantity_alert,
            'tax' => $request->tax,
            'tax_type' => $request->tax_type,
            'notes' => $request->notes,
            'product_image' => $request->product_image,
            'category_id' => $request->category_id ?? 10,
            'unit_id' => $request->unit_id ?? 10,
        ];

        DB::beginTransaction();
        try {
            /** @var Product $product */
            $product = Product::create($data);

            // Generate barcodes equal to initial quantity (if > 0)
            $quantity = (int) $product->quantity;
            if ($quantity > 0) {
                $this->bulkGenerateBarcodesForProduct($product, $quantity, $user);
            }

            // Initial inventory log
            InventoryLog::create([
                'product_name'    => $product->name,
                'product_code'    => $product->code,
                'quantity_added'  => $quantity,
                'remaining_qnty'  => $product->quantity,
                'added_by'        => $user->name,
                'product_unit_id' => $product->unit_id,
                'date_added'      => now(),
            ]);

            DB::commit();

            return redirect()->route('products.index')
                ->with('successMessage', 'Product created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('products.index')
                ->with('errorMessage', 'Failed to create product: ' . $e->getMessage());
        }
    }

    // --- UPDATE product ---
    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'quantity' => 'required|numeric',
            'buying_price' => 'nullable|numeric',
            'selling_price' => 'nullable|numeric',
            'quantity_alert' => 'nullable|numeric',
            'tax' => 'nullable|numeric',
            'tax_type' => 'nullable|string',
            'notes' => 'nullable|string',
            'reason' => 'nullable|string|max:500',
            'product_image' => 'nullable|string',
            'category_id' => 'nullable|integer|exists:categories,id',
            'unit_id' => 'nullable|integer|exists:units,id',
        ]);

        // Update slug if name changed
        $slug = $product->slug;
        if ($request->name !== $product->name) {
            $slug = $this->generateSlug($request->name);
        }

        $previousQuantity = (int) $product->quantity;
        $newQuantity = (int) $request->quantity;

        $data = [
            'name' => $request->name,
            'slug' => $slug,
            'quantity' => $request->quantity,
            'buying_price' => $request->buying_price,
            'selling_price' => $request->selling_price,
            'quantity_alert' => $request->quantity_alert,
            'tax' => $request->tax,
            'tax_type' => $request->tax_type,
            'notes' => $request->notes,
            'product_image' => $request->product_image,
            'category_id' => $request->category_id,
            'unit_id' => $request->unit_id,
        ];

        DB::transaction(function () use ($product, $data, $newQuantity, $previousQuantity, $request): void {
            $product->update($data);

            if ($newQuantity === $previousQuantity) {
                return;
            }

            $inventoryLog = InventoryLog::create([
                'product_name' => $product->name,
                'product_code' => $product->code,
                'quantity_added' => $newQuantity - $previousQuantity,
                'remaining_qnty' => $newQuantity,
                'added_by' => $request->user()->name,
                'reason' => $request->input('reason'),
                'product_unit_id' => $product->unit_id,
                'date_added' => now(),
            ]);

            app(InventoryWhatsAppNotifier::class)->notifyStockChange(
                $product,
                $previousQuantity,
                $newQuantity,
                $request->user(),
                $request->input('reason'),
                "inventory-log:{$inventoryLog->id}",
            );
        });

        return redirect()->route('products.index')
            ->with('successMessage', 'Product updated successfully!');
    }

    // --- DESTROY ---
    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('products.index')
            ->with('successMessage', 'Product deleted successfully!');
    }

    public function create()
    {
        return Inertia::render('products/index');
    }

    // --- BARCODE SCANNING FEATURE (Updated with mandatory notes/reason) ---
  public function scanBarcodes(Request $request)
{
    $request->validate([
        'product_id' => 'required|exists:products,id',
        'operation_type' => 'required|in:inbound,outbound',
        'barcodes' => 'required|array|min:1',
        'barcodes.*' => 'required|string',
        'reason' => 'required|string|min:3|max:500',
    ]);

    $user = $request->user();
    $product = Product::findOrFail($request->product_id);
    $operationType = $request->operation_type;
    $barcodes = $request->barcodes;
    $reason = $request->reason;
    $totalBarcodes = count($barcodes);

    DB::beginTransaction();
    try {
        $savedBarcodes = [];
        $errors = [];
        $duplicatesInCurrentScan = [];
        $processedInCurrentScan = [];

        foreach ($barcodes as $index => $barcodeValue) {
            // Check for duplicates within the current scan batch
            if (in_array($barcodeValue, $processedInCurrentScan)) {
                $duplicatesInCurrentScan[] = $barcodeValue;
                continue;
            }

            // Get ALL records for this barcode and product
            $allBarcodeRecords = Barcode::where('barcode', $barcodeValue)
                ->where('product_id', $product->id)
                ->orderBy('scanned_at', 'desc')
                ->get();

            $exists = $allBarcodeRecords->isNotEmpty();
            $latestRecord = $allBarcodeRecords->first();

            // OUTBOUND: Barcode must exist in the database
            if ($operationType === 'outbound') {
                if (!$exists) {
                    $errors[] = "❌ Barcode '{$barcodeValue}' doesn't exist in the system. You must scan it IN before scanning it OUT.";
                    continue;
                }

                // Check if the latest operation was outbound (meaning it's already been scanned out)
                if ($latestRecord && $latestRecord->operation_type === 'outbound') {
                    $errors[] = "❌ Barcode '{$barcodeValue}' was already scanned OUT on " . $latestRecord->scanned_at->format('Y-m-d H:i:s') . " by {$latestRecord->scanned_by}. It cannot be scanned OUT again.";
                    continue;
                }
            }

            // INBOUND: Check if this exact barcode was already scanned inbound and not yet scanned outbound
            if ($operationType === 'inbound') {
                if ($exists && $latestRecord && $latestRecord->operation_type === 'inbound') {
                    $errors[] = "❌ Barcode '{$barcodeValue}' was already scanned IN on " . $latestRecord->scanned_at->format('Y-m-d H:i:s') . " by {$latestRecord->scanned_by}. Scan it OUT first before scanning IN again.";
                    continue;
                }
            }

            // Create new scan record with reason
            $barcode = Barcode::create([
                'product_id'     => $product->id,
                'product_code'   => $product->code,
                'product_name'   => $product->name,
                'barcode'        => $barcodeValue,
                'operation_type' => $operationType,
                'reason'         => $reason,
                'scanned_by'     => $user->name,
                'user_id'        => $user->id,
                'scanned_at'     => now(),
            ]);

            $savedBarcodes[] = $barcode;
            $processedInCurrentScan[] = $barcodeValue;
        }

        // Handle duplicate barcodes in current scan
        if (!empty($duplicatesInCurrentScan)) {
            $uniqueDuplicates = array_unique($duplicatesInCurrentScan);
            $duplicateCount = count($duplicatesInCurrentScan);
            $errors[] = "⚠️ Found {$duplicateCount} duplicate barcode(s) in your scan: " . implode(', ', $uniqueDuplicates) . ". Each barcode can only be scanned once per operation.";
        }

        // If there are errors but some barcodes were processed
        if (!empty($errors) && !empty($savedBarcodes)) {
            $successCount = count($savedBarcodes);
            $errorCount = count($errors);
            $previousQuantity = (int) $product->quantity;
            
            // Update product quantity for successful scans only
            if ($operationType === 'inbound') {
                $newQuantity = $product->quantity + $successCount;
                $quantityChange = $successCount;
            } else {
                $newQuantity = $product->quantity - $successCount;
                $quantityChange = -$successCount;

                if ($newQuantity < 0) {
                    DB::rollBack();
                    return back()->withErrors([
                        'message' => '❌ Insufficient quantity in stock. Cannot process outbound operation.'
                    ]);
                }
            }

            $product->update(['quantity' => $newQuantity]);

            // Log the successful transactions
            $inventoryLog = InventoryLog::create([
                'product_name'    => $product->name,
                'product_code'    => $product->code,
                'quantity_added'  => $quantityChange,
                'remaining_qnty'  => $newQuantity,
                'added_by'        => $user->name,
                'reason'          => $reason,
                'product_unit_id' => $product->unit_id,
                'date_added'      => now(),
            ]);

            app(InventoryWhatsAppNotifier::class)->notifyStockChange(
                $product,
                $previousQuantity,
                (int) $newQuantity,
                $user,
                $reason,
                "inventory-log:{$inventoryLog->id}",
            );

            DB::commit();

            // Return partial success with detailed errors
            $errorList = implode("\n", array_map(function($error, $index) {
                return ($index + 1) . ". " . $error;
            }, $errors, array_keys($errors)));

            $warningMessage = "⚠️ PARTIAL SUCCESS\n\n✅ Successfully processed: {$successCount} barcode(s)\n❌ Failed: {$errorCount} barcode(s)\n\n--- ERRORS ---\n{$errorList}";
            
            return back()->with('warningMessage', $warningMessage);
        }

        // If all barcodes failed
        if (!empty($errors) && empty($savedBarcodes)) {
            DB::rollBack();
            
            $errorList = implode("\n", array_map(function($error, $index) {
                return ($index + 1) . ". " . $error;
            }, $errors, array_keys($errors)));

            $errorMessage = "❌ ALL BARCODES FAILED\n\nNone of the {$totalBarcodes} barcode(s) could be processed.\n\n--- ERRORS ---\n{$errorList}";
            return back()->withErrors(['message' => $errorMessage]);
        }

        // All successful - no errors
        if (empty($errors)) {
            $previousQuantity = (int) $product->quantity;
            // Update product quantity
            if ($operationType === 'inbound') {
                $newQuantity = $product->quantity + $totalBarcodes;
                $quantityChange = $totalBarcodes;
            } else {
                $newQuantity = $product->quantity - $totalBarcodes;
                $quantityChange = -$totalBarcodes;

                if ($newQuantity < 0) {
                    DB::rollBack();
                    return back()->withErrors([
                        'message' => '❌ Insufficient quantity in stock. Cannot process outbound operation.'
                    ]);
                }
            }

            $product->update(['quantity' => $newQuantity]);

            // Log the transaction
            $inventoryLog = InventoryLog::create([
                'product_name'    => $product->name,
                'product_code'    => $product->code,
                'quantity_added'  => $quantityChange,
                'remaining_qnty'  => $newQuantity,
                'added_by'        => $user->name,
                'reason'          => $reason,
                'product_unit_id' => $product->unit_id,
                'date_added'      => now(),
            ]);

            app(InventoryWhatsAppNotifier::class)->notifyStockChange(
                $product,
                $previousQuantity,
                (int) $newQuantity,
                $user,
                $reason,
                "inventory-log:{$inventoryLog->id}",
            );

            DB::commit();

            $operationText = $operationType === 'inbound' ? 'IN' : 'OUT';
            return back()->with('successMessage', "✅ SUCCESS! All {$totalBarcodes} barcode(s) scanned {$operationText} successfully!");
        }
        
    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Barcode scanning error: ' . $e->getMessage());
        return back()->withErrors([
            'message' => '❌ System Error: Failed to process barcodes. ' . $e->getMessage()
        ]);
    }
}
    // --- BARCODE HISTORY ---
    public function getBarcodeHistory($productId)
    {
        $barcodes = Barcode::where('product_id', $productId)
            ->orderBy('scanned_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'barcodes' => $barcodes
        ]);
    }

    // -----------------------
    // Helper methods for barcode generation and bulk insert
    // -----------------------

    private function generateBarcodeNumber(string $prefix = 'BC-', int $randomLength = 12): string
    {
        do {
            $random = strtoupper(Str::random($randomLength));
            $candidate = $prefix . $random;
        } while (Barcode::where('barcode', $candidate)->exists());

        return $candidate;
    }

    private function bulkGenerateBarcodesForProduct(Product $product, int $count, $user, int $chunkSize = 500): void
    {
        if ($count <= 0) {
            return;
        }

        $now = now();
        $rows = [];

        for ($i = 0; $i < $count; $i++) {
            $barcodeValue = $this->generateBarcodeNumber();

            $rows[] = [
                'product_id'     => $product->id,
                'product_code'   => $product->code,
                'product_name'   => $product->name,
                'barcode'        => $barcodeValue,
                'operation_type' => 'inbound',
                'reason'         => 'Initial stock generation', // Default reason for auto-generated barcodes
                'scanned_by'     => $user->name,
                'user_id'        => $user->id,
                'scanned_at'     => $now,
                'created_at'     => $now,
                'updated_at'     => $now,
            ];

            if (count($rows) >= $chunkSize) {
                Barcode::insert($rows);
                $rows = [];
            }
        }

        if (!empty($rows)) {
            Barcode::insert($rows);
        }
    }
}