<?php

namespace App\Http\Controllers;

use App\Models\Barcode;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;

class BarcodeController extends Controller
{
  

public function index(Request $request)
{
    // Fetch distinct products and users for dropdowns
    $products = Barcode::select('product_name')
        ->distinct()
        ->orderBy('product_name')
        ->pluck('product_name');

    $scannedBys = Barcode::select('scanned_by')
        ->distinct()
        ->orderBy('scanned_by')
        ->pluck('scanned_by');

    // Base query
    $query = Barcode::query();

    $search = trim((string) $request->query('search', ''));
    if ($search !== '') {
        $query->where(function ($query) use ($search) {
            $query->where('product_name', 'like', "%{$search}%")
                ->orWhere('product_code', 'like', "%{$search}%")
                ->orWhere('barcode', 'like', "%{$search}%")
                ->orWhere('scanned_by', 'like', "%{$search}%")
                ->orWhere('operation_type', 'like', "%{$search}%")
                ->orWhere('reason', 'like', "%{$search}%");
        });
    }

    // Apply filters
    if ($request->filled('product_name')) {
        $query->where('product_name', $request->product_name);
    }

    if ($request->filled('scanned_by')) {
        $query->where('scanned_by', $request->scanned_by);
    }

    if ($request->filled('operation_type')) {
        $query->where('operation_type', $request->operation_type);
    }

    if ($request->filled('scanned_from') && $request->filled('scanned_to')) {
        // Parse dates with Carbon and set to correct timezone
        $fromDate = Carbon::parse($request->scanned_from)
            ->startOfDay() // Set to 00:00:00
            ->timezone(config('app.timezone')) // Use app timezone
            ->toDateTimeString();
            
        $toDate = Carbon::parse($request->scanned_to)
            ->endOfDay() // Set to 23:59:59
            ->timezone(config('app.timezone')) // Use app timezone
            ->toDateTimeString();
        
        $query->whereBetween('scanned_at', [
            $fromDate,
            $toDate
        ]);
    }

    // Paginate with 25 records per page
    $barcodes = $query->orderBy('created_at', 'desc')->paginate(25)->withQueryString();

    return Inertia::render('barcode/index', [
        'barcodes' => $barcodes,
        'products' => $products,
        'scannedBys' => $scannedBys,
        'filters' => [
            'product_name' => $request->product_name,
            'scanned_by' => $request->scanned_by,
            'operation_type' => $request->operation_type,
            'scanned_from' => $request->scanned_from,
            'scanned_to' => $request->scanned_to,
            'search' => $search,
        ],
    ]);
}

    public function destroy(Barcode $barcode)
    {
        $barcode->delete();
        return redirect()->back()->with('success', 'Barcode deleted successfully.');
    }

    public function print(Request $request)
    {
        $query = Barcode::query();

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($query) use ($search) {
                $query->where('product_name', 'like', "%{$search}%")
                    ->orWhere('product_code', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhere('scanned_by', 'like', "%{$search}%")
                    ->orWhere('operation_type', 'like', "%{$search}%")
                    ->orWhere('reason', 'like', "%{$search}%");
            });
        }

        if ($request->filled('product_name')) {
            $query->where('product_name', $request->product_name);
        }

        if ($request->filled('scanned_by')) {
            $query->where('scanned_by', $request->scanned_by);
        }

        if ($request->filled('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }

        
  if ($request->filled('scanned_from') && $request->filled('scanned_to')) {

    $fromDate = Carbon::parse($request->scanned_from)
        ->startOfDay()
        ->timezone(config('app.timezone'))
        ->toDateTimeString();

    $toDate = Carbon::parse($request->scanned_to)
        ->endOfDay()
        ->timezone(config('app.timezone'))
        ->toDateTimeString();

    $query->whereBetween('scanned_at', [$fromDate, $toDate]);
}

        $barcodes = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('barcode/print', [
            'barcodes' => $barcodes,
        ]);
    }
}