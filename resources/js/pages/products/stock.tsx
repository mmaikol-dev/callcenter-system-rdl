"use client";

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Eye, PackagePlus, ChevronLeft, Scan, ChevronRight, X, History, Calendar, Hash, Package, TrendingUp, User, FileText, Search, AlertCircle, CheckCircle2, Package2, DollarSign, ShoppingCart } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Products', href: '/products' },
];

interface Product {
  id: number;
  name: string;
  store_name: string;
  slug: string;
  code: string;
  quantity: number;
  buying_price: number;
  selling_price: number;
  quantity_alert: number;
  tax: number;
  tax_type: string;
  notes: string;
  product_image: string;
  category_id: number;
  unit_id: number;
}

interface PaginatedProducts {
  current_page: number;
  data: Product[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

interface InventoryLog {
  id: number;
  product_name: string;
  product_code: string;
  quantity_added: number;
  remaining_qnty: number;
  added_by: string;
  product_unit_id: number;
  date_added: string;
  created_at: string;
  updated_at: string;
}

interface BarcodeData {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  barcode: string;
  operation_type: 'inbound' | 'outbound';
  scanned_by: string;
  scanned_at: string;
}

interface Unit {
  id: number;
  name: string;
  short_code: string;
}

interface Category {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const { products, categories, units } = usePage<{
    products: PaginatedProducts;
    categories: Category[];
    units: Unit[];
  }>().props;

  const [filter, setFilter] = React.useState('');
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [creatingProduct, setCreatingProduct] = React.useState(false);
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null);
  const [viewingLogs, setViewingLogs] = React.useState(false);
  const [inventoryLogs, setInventoryLogs] = React.useState<InventoryLog[]>([]);
  const [formValues, setFormValues] = React.useState<Partial<Product>>({});
  const [updatingProduct, setUpdatingProduct] = React.useState<Product | null>(null);
  const [quantityChange, setQuantityChange] = React.useState<number | null>(null);
  const [operation, setOperation] = React.useState<"add" | "subtract">("add");
  const [generateBarcodes, setGenerateBarcodes] = React.useState(false);
  const [scanningBarcodes, setScanningBarcodes] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [operationType, setOperationType] = React.useState<'inbound' | 'outbound'>('inbound');
  const [scannedBarcodes, setScannedBarcodes] = React.useState<string[]>([]);
  const [currentBarcode, setCurrentBarcode] = React.useState('');
  const [viewingBarcodeHistory, setViewingBarcodeHistory] = React.useState(false);
  const [barcodeHistory, setBarcodeHistory] = React.useState<BarcodeData[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const barcodeInputRef = React.useRef<HTMLInputElement>(null);

  const filteredProducts = React.useMemo(() => {
    if (!products?.data) return [];
    return products.data.filter((p) =>
      (p.name?.toLowerCase() || '').includes(filter.toLowerCase()) ||
      (p.store_name?.toLowerCase() || '').includes(filter.toLowerCase()) ||
      (p.code?.toLowerCase() || '').includes(filter.toLowerCase())
    );
  }, [products, filter]);

  React.useEffect(() => {
    if (scanningBarcodes && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [scanningBarcodes]);

  const handleCreate = () => {
    const missingFields = [
      !String(formValues.name ?? '').trim() && 'Product name',
      formValues.quantity == null && 'Quantity',
      formValues.quantity_alert == null && 'Quantity alert',
      !formValues.category_id && 'Category',
      !formValues.unit_id && 'Unit',
    ].filter((field): field is string => Boolean(field));
    if (missingFields.length > 0) {
      toast.error(`${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required.`);
      return;
    }

    const dataToSubmit = {
      ...formValues,
      generate_barcodes: generateBarcodes
    };

    router.post('/products', dataToSubmit, {
      preserveState: true,
      onSuccess: () => {
        setCreatingProduct(false);
        setFormValues({});
        setGenerateBarcodes(false);
        setSuccessMessage("Product created successfully!" + (generateBarcodes ? ` Generated ${formValues.quantity || 0} barcodes.` : ''));
      },
      onError: (errors: any) => {
        console.error(errors);
        setErrorMessage("Failed to create product. Please check all required fields.");
      },
    });
  };

  const handleEditSave = () => {
    if (!editingProduct) return;
    const missingFields = [
      !String(formValues.name ?? '').trim() && 'Product name',
      formValues.quantity == null && 'Quantity',
    ].filter((field): field is string => Boolean(field));
    if (missingFields.length > 0) {
      toast.error(`${missingFields.join(' and ')} ${missingFields.length === 1 ? 'is' : 'are'} required.`);
      return;
    }

    router.put(`/products/${editingProduct.id}`, formValues, {
      preserveState: true,
      onSuccess: () => {
        setEditingProduct(null);
        setFormValues({});
        setSuccessMessage("Product updated successfully!");
      },
      onError: () => {
        setErrorMessage("Failed to update product.");
      },
    });
  };

  const handleDelete = () => {
    if (!deletingProduct) return;
    router.delete(`/products/${deletingProduct.id}`, {
      preserveState: true,
      onSuccess: () => {
        setDeletingProduct(null);
        setSuccessMessage("Product deleted successfully!");
      },
      onError: () => {
        setErrorMessage("Failed to delete product.");
      },
    });
  };

  const handleViewLogs = async (productCode: string) => {
    try {
      const response = await fetch(`/products/${productCode}/inventory-logs`);
      const data = await response.json();
      setInventoryLogs(data.logs || []);
      setViewingLogs(true);
    } catch (error) {
      console.error("Failed to fetch inventory logs:", error);
      setErrorMessage("Failed to fetch inventory logs.");
    }
  };

  const handleUpdateQuantity = () => {
    if (!updatingProduct) return;
    if (quantityChange === null || quantityChange <= 0) {
      toast.error('Quantity is required and must be greater than zero.');
      return;
    }
    const finalChange = operation === "subtract" ? -Math.abs(quantityChange) : Math.abs(quantityChange);

    router.post(`/products/${updatingProduct.id}/update-quantity`, {
      quantity_change: finalChange,
      generate_barcodes: generateBarcodes && operation === "add"
    }, {
      preserveState: true,
      onSuccess: () => {
        setUpdatingProduct(null);
        setQuantityChange(null);
        setOperation("add");
        setGenerateBarcodes(false);
        setSuccessMessage("Quantity updated successfully!" + (generateBarcodes && operation === "add" ? ` Generated ${Math.abs(finalChange)} barcodes.` : ''));
      },
      onError: () => {
        setErrorMessage("Failed to update quantity.");
      },
    });
  };

  const handlePageChange = (url: string | null) => {
    if (!url) return;
    router.get(url, {}, { preserveState: true, preserveScroll: true });
  };

  const handleStartScanning = (product: Product) => {
    setSelectedProduct(product);
    setScannedBarcodes([]);
    setCurrentBarcode('');
    setOperationType('inbound');
    setScanningBarcodes(true);
  };

  const handleAddBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentBarcode.trim()) {
      setScannedBarcodes([...scannedBarcodes, currentBarcode.trim()]);
      setCurrentBarcode('');
      barcodeInputRef.current?.focus();
    } else {
      toast.error('Barcode is required.');
    }
  };

  const handleRemoveBarcode = (index: number) => {
    setScannedBarcodes(scannedBarcodes.filter((_, i) => i !== index));
  };

  const handleSubmitBarcodes = async () => {
    if (!selectedProduct || scannedBarcodes.length === 0) {
      toast.error("At least one barcode is required.");
      setErrorMessage("Please scan at least one barcode.");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/products/scan-barcodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          operation_type: operationType,
          barcodes: scannedBarcodes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.message);
        setScanningBarcodes(false);
        setScannedBarcodes([]);
        setCurrentBarcode('');
        router.reload({ only: ['products'] });
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error("Failed to submit barcodes:", error);
      setErrorMessage("Failed to process barcodes.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewBarcodeHistory = async (product: Product) => {
    try {
      const response = await fetch(`/products/${product.id}/barcode-history`);
      const data = await response.json();

      if (data.success) {
        setBarcodeHistory(data.barcodes || []);
        setSelectedProduct(product);
        setViewingBarcodeHistory(true);
      }
    } catch (error) {
      console.error("Failed to fetch barcode history:", error);
      setErrorMessage("Failed to fetch barcode history.");
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { label: 'Out of Stock', color: 'bg-red-500' };
    if (product.quantity <= product.quantity_alert) return { label: 'Low Stock', color: 'bg-yellow-500' };
    return { label: 'In Stock', color: 'bg-green-500' };
  };

  const canEdit = !["operations", "finance", "callcenter1", ""].includes(usePage().props.auth.user.roles);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Products" />

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <Input
            placeholder="Filter products by name, store, or code"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1"
          />
          {!["operations", "finance", "callcenter1", ""].includes(usePage().props.auth.user.roles) && (
            <Button
              variant="default"
              className="flex items-center gap-2"
              onClick={() => setCreatingProduct(true)}
            >
              <Plus size={16} /> Create Product
            </Button>
          )}
        </div>

        {/* Pagination Info */}
        <div className="text-sm text-muted-foreground">
          Showing {products.from} to {products.to} of {products.total} products
        </div>


        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {filter ? "Try adjusting your search terms" : "Get started by adding your first product"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <Card key={product.id} className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50 overflow-hidden">
                  <div className={`h-1 ${stockStatus.color}`} />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-base font-semibold line-clamp-2 flex-1" title={product.name}>
                        {product.name}
                      </CardTitle>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {product.code}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs line-clamp-1" title={product.store_name}>
                      📍 {product.store_name || 'No store'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-3">
                    {/* Stock Status */}
                    <div className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                      <span className="text-xs font-medium">Stock Status</span>
                      <Badge className={`${stockStatus.color} text-white text-xs`}>
                        {stockStatus.label}
                      </Badge>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-secondary/30 rounded">
                        <p className="text-muted-foreground mb-1">Quantity</p>
                        <p className="font-bold text-base">{product.quantity}</p>
                      </div>
                      <div className="p-2 bg-secondary/30 rounded">
                        <p className="text-muted-foreground mb-1">Alert At</p>
                        <p className="font-bold text-base">{product.quantity_alert}</p>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Buying Price</span>
                        <span className="font-semibold">${product.buying_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Selling Price</span>
                        <span className="font-semibold text-green-600">${product.selling_price.toFixed(2)}</span>
                      </div>
                      {product.tax > 0 && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Tax ({product.tax_type})</span>
                          <span className="font-medium">{product.tax}%</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      {canEdit && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs h-8"
                            onClick={() => handleStartScanning(product)}
                          >
                            <Scan size={14} />
                            Scan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs h-8"
                            onClick={() => { setUpdatingProduct(product); setQuantityChange(null); setGenerateBarcodes(false); }}
                          >
                            <PackagePlus size={14} />
                            Update
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs h-8"
                            onClick={() => { setEditingProduct(product); setFormValues(product); }}
                          >
                            <Edit size={14} />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeletingProduct(product)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => handleViewLogs(product.code)}
                      >
                        <Eye size={14} />
                        Logs
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => handleViewBarcodeHistory(product)}
                      >
                        <History size={14} />
                        History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Enhanced Pagination */}
        {products.total > products.per_page && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{products.from}</span> to{' '}
                  <span className="font-medium text-foreground">{products.to}</span> of{' '}
                  <span className="font-medium text-foreground">{products.total}</span> products
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(products.prev_page_url)}
                    disabled={!products.prev_page_url}
                    className="gap-1"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>

                  <div className="flex gap-1">
                    {products.links.slice(1, -1).map((link, index) => (
                      <Button
                        key={index}
                        variant={link.active ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(link.url)}
                        disabled={!link.url}
                        className="min-w-[40px]"
                      >
                        {link.label}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(products.next_page_url)}
                    disabled={!products.next_page_url}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* All Modals remain the same but with enhanced styling - keeping original functionality */}
      {/* Success/Error Notifications */}
      <Dialog open={!!successMessage} onOpenChange={(open) => !open && setSuccessMessage(null)}>
        <DialogContent className="max-w-md">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <DialogHeader>
                <DialogTitle className="text-xl">Success!</DialogTitle>
                <DialogDescription className="text-base mt-2">{successMessage}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-end mt-6">
                <Button onClick={() => setSuccessMessage(null)}>Got it</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!errorMessage} onOpenChange={(open) => !open && setErrorMessage(null)}>
        <DialogContent className="max-w-md">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <DialogHeader>
                <DialogTitle className="text-xl">Error</DialogTitle>
                <DialogDescription className="text-base mt-2">{errorMessage}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-end mt-6">
                <Button variant="destructive" onClick={() => setErrorMessage(null)}>Close</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanning Modal */}
      <Dialog open={scanningBarcodes} onOpenChange={(open) => !open && setScanningBarcodes(false)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Scan className="h-6 w-6" />
              Scan Barcodes - {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              Select operation type and scan multiple barcodes. Total scanned: <span className="font-semibold">{scannedBarcodes.length}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Operation Type Selection */}
            <Card>
              <CardContent className="p-4">
                <label className="text-sm font-semibold mb-3 block">Operation Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${operationType === 'inbound' ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-border hover:border-primary/50'
                    }`}>
                    <input
                      type="radio"
                      name="operationType"
                      value="inbound"
                      checked={operationType === 'inbound'}
                      onChange={(e) => setOperationType(e.target.value as 'inbound' | 'outbound')}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-semibold">Inbound</p>
                      <p className="text-xs text-muted-foreground">Add to stock</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${operationType === 'outbound' ? 'border-red-500 bg-red-50 dark:bg-red-950' : 'border-border hover:border-primary/50'
                    }`}>
                    <input
                      type="radio"
                      name="operationType"
                      value="outbound"
                      checked={operationType === 'outbound'}
                      onChange={(e) => setOperationType(e.target.value as 'inbound' | 'outbound')}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-semibold">Outbound</p>
                      <p className="text-xs text-muted-foreground">Remove from stock</p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Barcode Input */}
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleAddBarcode} className="flex gap-2">
                  <Input
                    ref={barcodeInputRef}
                    type="text"
                    required
                    value={currentBarcode}
                    onChange={(e) => setCurrentBarcode(e.target.value)}
                    placeholder="Scan or enter barcode..."
                    className="flex-1 h-12 text-base"
                    autoFocus
                  />
                  <Button type="submit" size="lg" className="px-8">Add</Button>
                </form>
              </CardContent>
            </Card>

            {/* Scanned Barcodes List */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-semibold">Scanned Barcodes ({scannedBarcodes.length})</h4>
                  {scannedBarcodes.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setScannedBarcodes([])}
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto bg-secondary/20">
                  {scannedBarcodes.length === 0 ? (
                    <div className="text-center py-8">
                      <Scan className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No barcodes scanned yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Start scanning to add items</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scannedBarcodes.map((barcode, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-background p-3 rounded-lg border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{index + 1}</Badge>
                            <span className="font-mono font-medium">{barcode}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveBarcode(index)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-2">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4">Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Current</p>
                    <p className="text-3xl font-bold">{selectedProduct?.quantity || 0}</p>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${operationType === 'inbound' ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'}`}>
                    <p className="text-sm text-muted-foreground mb-1">
                      {operationType === 'inbound' ? 'Adding' : 'Removing'}
                    </p>
                    <p className={`text-3xl font-bold ${operationType === 'inbound' ? 'text-green-600' : 'text-red-600'}`}>
                      {operationType === 'inbound' ? '+' : '-'}{scannedBarcodes.length}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">New Total</p>
                    <p className="text-3xl font-bold">
                      {operationType === 'inbound'
                        ? (selectedProduct?.quantity || 0) + scannedBarcodes.length
                        : Math.max(0, (selectedProduct?.quantity || 0) - scannedBarcodes.length)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setScanningBarcodes(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleSubmitBarcodes}
              disabled={isProcessing}
              className="px-8"
            >
              {isProcessing ? 'Processing...' : `Submit ${scannedBarcodes.length} Barcode(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode History Modal */}
      <Dialog open={viewingBarcodeHistory} onOpenChange={(open) => !open && setViewingBarcodeHistory(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <History className="h-6 w-6" />
              Barcode History - {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              Complete history of scanned barcodes for this product
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {barcodeHistory.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <History className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">No history found</p>
                  <p className="text-sm text-muted-foreground">No barcode scans recorded for this product</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {barcodeHistory.map((record) => (
                  <Card key={record.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Barcode</p>
                          <p className="font-mono font-semibold text-sm">{record.barcode}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Operation</p>
                          <Badge className={record.operation_type === 'inbound' ? 'bg-green-500' : 'bg-red-500'}>
                            {record.operation_type === 'inbound' ? '↑ Inbound' : '↓ Outbound'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Scanned By</p>
                          <p className="font-medium text-sm">{record.scanned_by}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
                          <p className="font-medium text-sm">
                            {new Date(record.scanned_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t">
            <Button variant="outline" size="lg" onClick={() => setViewingBarcodeHistory(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Product Modal */}
      <Dialog open={creatingProduct} onOpenChange={(open) => !open && setCreatingProduct(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6" />
              Create New Product
            </DialogTitle>
            <DialogDescription className="text-base">
              Fill in product details below. Store name, slug, and code will be auto-generated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold mb-2 block">Product Name *</label>
                <Input
                  value={formValues.name || ''}
                  required
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  placeholder="Enter product name"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Category *</label>
                <select
                  required
                  value={formValues.category_id || ''}
                  onChange={(e) => setFormValues({ ...formValues, category_id: parseInt(e.target.value) })}
                  className="w-full border rounded-md p-2.5 text-sm h-11 bg-background"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Unit *</label>
                <select
                  required
                  value={formValues.unit_id || ''}
                  onChange={(e) => setFormValues({ ...formValues, unit_id: parseInt(e.target.value) })}
                  className="w-full border rounded-md p-2.5 text-sm h-11 bg-background"
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.short_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Quantity *</label>
                <Input
                  type="number"
                  required
                  value={formValues.quantity || ''}
                  onChange={(e) => setFormValues({ ...formValues, quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter quantity"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Quantity Alert *</label>
                <Input
                  type="number"
                  required
                  value={formValues.quantity_alert || ''}
                  onChange={(e) => setFormValues({ ...formValues, quantity_alert: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter alert threshold"
                  className="h-11"
                />
              </div>
            </div>

            {/* Barcode Generation Option */}
            {formValues.quantity && formValues.quantity > 0 && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateBarcodes}
                      onChange={(e) => setGenerateBarcodes(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="text-sm font-semibold">Generate barcodes for this quantity</p>
                      {generateBarcodes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ✓ Will generate {formValues.quantity} unique barcodes
                        </p>
                      )}
                    </div>
                  </label>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Buying Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formValues.buying_price || ''}
                  onChange={(e) => setFormValues({ ...formValues, buying_price: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter buying price"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Selling Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formValues.selling_price || ''}
                  onChange={(e) => setFormValues({ ...formValues, selling_price: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter selling price"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Tax (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formValues.tax || ''}
                  onChange={(e) => setFormValues({ ...formValues, tax: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter tax percentage"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Tax Type</label>
                <Input
                  value={formValues.tax_type || ''}
                  onChange={(e) => setFormValues({ ...formValues, tax_type: e.target.value })}
                  placeholder="e.g., VAT, Sales Tax"
                  className="h-11"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Notes</label>
              <Input
                value={formValues.notes || ''}
                onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
                placeholder="Additional notes"
                className="h-11"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" size="lg" onClick={() => { setCreatingProduct(false); setGenerateBarcodes(false); }}>
              Cancel
            </Button>
            <Button size="lg" onClick={handleCreate} className="px-8">
              Create Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Edit className="h-6 w-6" />
              Edit Product
            </DialogTitle>
            <DialogDescription className="text-base">
              Update product details. Code: <span className="font-mono font-semibold">{editingProduct?.code}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold mb-2 block">Product Name *</label>
                <Input
                  value={formValues.name || ''}
                  required
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  placeholder="Product name"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Quantity *</label>
                <Input
                  type="number"
                  required
                  value={formValues.quantity || ''}
                  onChange={(e) => setFormValues({ ...formValues, quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="Quantity"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Quantity Alert</label>
                <Input
                  type="number"
                  value={formValues.quantity_alert || ''}
                  onChange={(e) => setFormValues({ ...formValues, quantity_alert: parseFloat(e.target.value) || 0 })}
                  placeholder="Alert threshold"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Buying Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formValues.buying_price || ''}
                  onChange={(e) => setFormValues({ ...formValues, buying_price: parseFloat(e.target.value) || 0 })}
                  placeholder="Buying price"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Selling Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formValues.selling_price || ''}
                  onChange={(e) => setFormValues({ ...formValues, selling_price: parseFloat(e.target.value) || 0 })}
                  placeholder="Selling price"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Tax (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formValues.tax || ''}
                  onChange={(e) => setFormValues({ ...formValues, tax: parseFloat(e.target.value) || 0 })}
                  placeholder="Tax"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Tax Type</label>
                <Input
                  value={formValues.tax_type || ''}
                  onChange={(e) => setFormValues({ ...formValues, tax_type: e.target.value })}
                  placeholder="Tax type"
                  className="h-11"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Notes</label>
              <Input
                value={formValues.notes || ''}
                onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
                placeholder="Notes"
                className="h-11"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" size="lg" onClick={() => setEditingProduct(null)}>
              Cancel
            </Button>
            <Button size="lg" onClick={handleEditSave} className="px-8">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <DialogContent className="max-w-md">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <DialogHeader>
                <DialogTitle className="text-xl">Delete Product?</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Are you sure you want to delete <span className="font-semibold">{deletingProduct?.name}</span>? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setDeletingProduct(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Product
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Quantity Modal */}
      <Dialog open={!!updatingProduct} onOpenChange={(open) => {
        if (!open) {
          setUpdatingProduct(null);
          setGenerateBarcodes(false);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <PackagePlus className="h-6 w-6" />
              Update Quantity
            </DialogTitle>
            <DialogDescription className="text-base">
              Adjust stock for <span className="font-semibold">{updatingProduct?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Card className="bg-secondary/30">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Current Quantity</p>
                  <p className="text-4xl font-bold">{updatingProduct?.quantity || 0}</p>
                </div>
              </CardContent>
            </Card>

            <div>
              <label className="text-sm font-semibold mb-2 block">Operation</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${operation === 'add' ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-border hover:border-primary/50'
                  }`}>
                  <input
                    type="radio"
                    name="operation"
                    value="add"
                    checked={operation === 'add'}
                    onChange={(e) => {
                      setOperation('add');
                    }}
                    className="w-5 h-5"
                  />
                  <span className="font-semibold">Add Stock</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${operation === 'subtract' ? 'border-red-500 bg-red-50 dark:bg-red-950' : 'border-border hover:border-primary/50'
                  }`}>
                  <input
                    type="radio"
                    name="operation"
                    value="subtract"
                    checked={operation === 'subtract'}
                    onChange={(e) => {
                      setOperation('subtract');
                      setGenerateBarcodes(false);
                    }}
                    className="w-5 h-5"
                  />
                  <span className="font-semibold">Remove Stock</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Quantity</label>
              <Input
                type="number"
                min="0"
                value={quantityChange ?? ""}
                onChange={(e) => setQuantityChange(e.target.value === "" ? null : parseInt(e.target.value))}
                placeholder="Enter quantity"
                className="h-12 text-lg text-center"
              />
            </div>

            {/* Barcode Generation Option - Only for Add */}
            {operation === "add" && quantityChange !== null && quantityChange > 0 && (
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generateBarcodes}
                      onChange={(e) => setGenerateBarcodes(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="text-sm font-semibold">Generate barcodes for added quantity</p>
                      {generateBarcodes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ✓ Will generate {quantityChange} unique barcodes
                        </p>
                      )}
                    </div>
                  </label>
                </CardContent>
              </Card>
            )}

            {quantityChange !== null && quantityChange > 0 && (
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">New Quantity Will Be</p>
                    <p className="text-4xl font-bold text-primary">
                      {operation === 'add'
                        ? (updatingProduct?.quantity || 0) + quantityChange
                        : Math.max(0, (updatingProduct?.quantity || 0) - quantityChange)
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" size="lg" onClick={() => { setUpdatingProduct(null); setGenerateBarcodes(false); }}>
              Cancel
            </Button>
            <Button size="lg" onClick={handleUpdateQuantity} className="px-8">
              Update Quantity
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inventory Logs Sheet (Drawer) */}
      <Sheet open={viewingLogs} onOpenChange={(open) => !open && setViewingLogs(false)}>
        <SheetContent side="right" className="w-[400px] sm:w-[600px] flex flex-col h-full p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0 bg-secondary/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Inventory Logs
                </SheetTitle>
                <SheetDescription className="text-sm mt-1">
                  Complete history of stock changes
                </SheetDescription>
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-3">
              {inventoryLogs.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <p className="text-lg font-medium">No logs found</p>
                    <p className="text-sm text-muted-foreground">No inventory changes recorded yet</p>
                  </CardContent>
                </Card>
              ) : (
                inventoryLogs.map((log) => (
                  <Card key={log.id} className="hover:shadow-md transition-shadow border-l-4" style={{
                    borderLeftColor: log.quantity_added > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
                  }}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Updated By</p>
                            <p className="font-semibold text-sm truncate" title={log.added_by}>
                              {log.added_by}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Change</p>
                            <p className={`font-bold text-lg ${log.quantity_added > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {log.quantity_added > 0 ? `+${log.quantity_added}` : log.quantity_added}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Remaining</p>
                            <p className="font-semibold text-sm">{log.remaining_qnty}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p className="font-semibold text-sm truncate" title={log.date_added}>
                              {new Date(log.date_added).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-start gap-2 pt-2 border-t mt-1">
                          <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Product Code</p>
                            <p className="font-mono text-sm font-semibold truncate" title={log.product_code}>
                              {log.product_code}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </AppLayout>
  );
}