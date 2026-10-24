// resources/js/Pages/Products/index.tsx
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
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetFooter
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import {
  Edit,
  Trash2,
  Plus,
  PackagePlus,
  ChevronLeft,
  Scan,
  ChevronRight,
  X,
  History,
  Calendar,
  Hash,
  Package,
  TrendingUp,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  Barcode,
  MessageSquare,
  AlertTriangle,
  Search,
  ArrowRight,
  ListChecks,
  ClipboardList,
  ArrowLeft,
  Info,
  Layers,
  Tag,
  QrCode,
  Eye,
  EyeOff
} from 'lucide-react';
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
  product_image?: string;
  category_id?: number;
  unit_id?: number;
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
  reason?: string;
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
  reason?: string;
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
  const { products, categories, units, filters } = usePage<{
    products: PaginatedProducts;
    categories: Category[];
    units: Unit[];
    filters: { search: string };
  }>().props;

  // auth (loosely typed)
  const page = usePage();
  const auth = (page.props as any).auth || {};

  const [filter, setFilter] = React.useState(filters.search || '');
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [creatingProduct, setCreatingProduct] = React.useState(false);
  const [deletingProduct, setDeletingProduct] = React.useState<Product | null>(null);
  const [viewingLogs, setViewingLogs] = React.useState(false);
  const [inventoryLogs, setInventoryLogs] = React.useState<InventoryLog[]>([]);
  const [formValues, setFormValues] = React.useState<Record<string, any>>({});
  const [updatingProduct, setUpdatingProduct] = React.useState<Product | null>(null);
  const [quantityChange, setQuantityChange] = React.useState<number | null>(null);
  const [operation, setOperation] = React.useState<"add" | "subtract">("add");
  const [generateBarcodes, setGenerateBarcodes] = React.useState(false);
  const [scanningBarcodes, setScanningBarcodes] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [operationType, setOperationType] = React.useState<'inbound' | 'outbound'>('inbound');
  const [scannedBarcodes, setScannedBarcodes] = React.useState<string[]>([]);
  const [currentBarcode, setCurrentBarcode] = React.useState('');
  const [scanReason, setScanReason] = React.useState('');
  const [viewingBarcodeHistory, setViewingBarcodeHistory] = React.useState(false);
  const [barcodeHistory, setBarcodeHistory] = React.useState<BarcodeData[]>([]);
  const [loadingLogCode, setLoadingLogCode] = React.useState<string | null>(null);
  const [loadingBarcodeProductId, setLoadingBarcodeProductId] = React.useState<number | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isFiltering, setIsFiltering] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [currentStep, setCurrentStep] = React.useState<'operation' | 'reason' | 'scanning'>('operation');
  const [showInstructions, setShowInstructions] = React.useState(true);

  const barcodeInputRef = React.useRef<HTMLInputElement>(null);
  const reasonTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (filter === (filters.search || '')) return;
    const timeout = window.setTimeout(() => {
      router.get(
        route('products.index'),
        { search: filter || undefined },
        {
          preserveState: true,
          preserveScroll: true,
          replace: true,
          only: ['products', 'filters'],
          onStart: () => setIsFiltering(true),
          onFinish: () => setIsFiltering(false),
        },
      );
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [filter, filters.search]);

  const filteredProducts = products?.data || [];

  React.useEffect(() => {
    if (scanningBarcodes) {
      if (currentStep === 'reason' && reasonTextareaRef.current) {
        setTimeout(() => reasonTextareaRef.current?.focus(), 100);
      } else if (currentStep === 'scanning' && barcodeInputRef.current) {
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
      }
    }
  }, [scanningBarcodes, currentStep]);

  const handleCreate = () => {
    const missingFields = [
      !String(formValues.name ?? '').trim() && 'Product name',
      (formValues.quantity === '' || formValues.quantity == null) && 'Quantity',
      (formValues.quantity_alert === '' || formValues.quantity_alert == null) && 'Quantity alert',
      !formValues.category_id && 'Category',
      !formValues.unit_id && 'Supplier',
    ].filter((field): field is string => Boolean(field));
    if (missingFields.length > 0) {
      toast.error(`${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required.`);
      return;
    }

    const payload = {
      ...formValues,
      category_id: formValues.category_id || null,
      unit_id: formValues.unit_id || null,
      quantity: formValues.quantity === "" || formValues.quantity == null ? 0 : Number(formValues.quantity),
      quantity_alert: formValues.quantity_alert === "" || formValues.quantity_alert == null ? 0 : Number(formValues.quantity_alert),
      buying_price: formValues.buying_price === "" || formValues.buying_price == null ? 0 : Number(formValues.buying_price),
      selling_price: formValues.selling_price === "" || formValues.selling_price == null ? 0 : Number(formValues.selling_price),
      tax: formValues.tax === "" || formValues.tax == null ? 0 : Number(formValues.tax),
      generate_barcodes: generateBarcodes
    };

    setIsProcessing(true);
    router.post('/products', payload, {
      preserveState: true,
      onSuccess: () => {
        setCreatingProduct(false);
        setFormValues({});
        setGenerateBarcodes(false);
        setSuccessMessage("Product created successfully!" + (generateBarcodes ? ` Generated ${payload.quantity || 0} barcodes.` : ''));
      },
      onError: (errors: any) => {
        console.error(errors);
        setErrorMessage(Object.values(errors).join(', ') || "Failed to create product. Please check required fields.");
      },
      onFinish: () => setIsProcessing(false),
    });
  };

  const handleEditSave = () => {
    if (!editingProduct) return;
    const missingFields = [
      !String(formValues.name ?? '').trim() && 'Product name',
      (formValues.quantity === '' || formValues.quantity == null) && 'Quantity',
    ].filter((field): field is string => Boolean(field));
    if (missingFields.length > 0) {
      toast.error(`${missingFields.join(' and ')} ${missingFields.length === 1 ? 'is' : 'are'} required.`);
      return;
    }

    const payload = {
      ...formValues,
      category_id: formValues.category_id || null,
      unit_id: formValues.unit_id || null,
      quantity: formValues.quantity === "" || formValues.quantity == null ? 0 : Number(formValues.quantity),
      quantity_alert: formValues.quantity_alert === "" || formValues.quantity_alert == null ? 0 : Number(formValues.quantity_alert),
      buying_price: formValues.buying_price === "" || formValues.buying_price == null ? 0 : Number(formValues.buying_price),
      selling_price: formValues.selling_price === "" || formValues.selling_price == null ? 0 : Number(formValues.selling_price),
      tax: formValues.tax === "" || formValues.tax == null ? 0 : Number(formValues.tax),
    };

    setIsProcessing(true);
    router.put(`/products/${editingProduct.id}`, payload, {
      preserveState: true,
      onSuccess: () => {
        setEditingProduct(null);
        setFormValues({});
        setSuccessMessage("Product updated successfully!");
      },
      onError: (errors: any) => {
        console.error(errors);
        setErrorMessage(Object.values(errors).join(', ') || "Failed to update product.");
      },
      onFinish: () => setIsProcessing(false),
    });
  };

  const handleDelete = () => {
    if (!deletingProduct) return;
    setIsProcessing(true);
    router.delete(`/products/${deletingProduct.id}`, {
      preserveState: true,
      onSuccess: () => {
        setDeletingProduct(null);
        setSuccessMessage("Product deleted successfully!");
      },
      onError: (errors: any) => {
        console.error(errors);
        setErrorMessage("Failed to delete product.");
      },
      onFinish: () => setIsProcessing(false),
    });
  };

  const handleViewLogs = async (productCode: string) => {
    setLoadingLogCode(productCode);
    try {
      const response = await fetch(`/products/${productCode}/inventory-logs`);
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.logs)) throw new Error('Inventory log response was invalid.');
      setInventoryLogs(data.logs);
      setViewingLogs(true);
    } catch (error) {
      console.error("Failed to fetch inventory logs:", error);
      setErrorMessage("Failed to fetch inventory logs.");
    } finally {
      setLoadingLogCode(null);
    }
  };

  const handleUpdateQuantity = () => {
    if (!updatingProduct || quantityChange === null || quantityChange <= 0) {
      toast.error("Quantity is required and must be greater than zero.");
      setErrorMessage("Quantity is required and must be greater than zero.");
      return;
    }
    const finalChange = operation === "subtract" ? -Math.abs(quantityChange) : Math.abs(quantityChange);

    setIsProcessing(true);
    router.post(`/products/${updatingProduct.id}/update-quantity`, {
      quantity_change: finalChange,
      generate_barcodes: generateBarcodes && operation === "add"
    }, {
      preserveState: true,
      onSuccess: (page) => {
        setUpdatingProduct(null);
        setQuantityChange(null);
        setOperation("add");
        setGenerateBarcodes(false);
        const flash = (page.props as any).flash;
        if (flash?.errorMessage) {
          setErrorMessage(String(flash.errorMessage));
        } else {
          setSuccessMessage(String(flash?.successMessage || "Quantity updated successfully!") +
            (generateBarcodes && operation === "add" ? ` Generated ${Math.abs(finalChange)} barcodes.` : ''));
        }
      },
      onError: (errors: any) => {
        console.error(errors);
        setErrorMessage(Object.values(errors).join(', ') || "Failed to update quantity.");
      },
      onFinish: () => setIsProcessing(false),
    });
  };

  const handlePageChange = (url: string | null) => {
    if (!url) return;
    router.get(url, {}, {
      preserveState: true,
      preserveScroll: true,
      only: ['products', 'filters'],
      onStart: () => setIsFiltering(true),
      onFinish: () => setIsFiltering(false),
    });
  };

  const handleStartScanning = (product: Product) => {
    setSelectedProduct(product);
    setScannedBarcodes([]);
    setCurrentBarcode('');
    setScanReason('');
    setOperationType('inbound');
    setScanningBarcodes(true);
    setCurrentStep('operation');
    setShowInstructions(true);
  };

  const handleAddBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentBarcode.trim()) {
      setScannedBarcodes(prev => [...prev, currentBarcode.trim()]);
      setCurrentBarcode('');
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    } else {
      toast.error('Barcode is required.');
    }
  };

  const handleRemoveBarcode = (index: number) => {
    setScannedBarcodes(scannedBarcodes.filter((_, i) => i !== index));
  };

  // Add a new state for warning messages
  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);

  // Update the handleSubmitBarcodes function
  const handleSubmitBarcodes = () => {
    if (!selectedProduct || scannedBarcodes.length === 0) {
      toast.error("At least one barcode is required.");
      setErrorMessage("At least one barcode is required.");
      return;
    }

    if (!scanReason.trim() || scanReason.trim().length < 3) {
      toast.error("A reason is required (minimum 3 characters).");
      setErrorMessage("A reason is required (minimum 3 characters).");
      return;
    }

    setIsProcessing(true);

    router.post('/products/scan-barcodes', {
      product_id: selectedProduct.id,
      operation_type: operationType,
      barcodes: scannedBarcodes,
      reason: scanReason.trim(),
    }, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page) => {
        const props = page.props as any;

        // Check for warning message (partial success)
        if (props.flash?.warningMessage) {
          setWarningMessage(props.flash.warningMessage);
          setScanningBarcodes(false);
          setScannedBarcodes([]);
          setCurrentBarcode('');
          setScanReason('');
          setOperationType('inbound');
          setCurrentStep('operation');
        } else {
          // Full success
          setSuccessMessage("Barcodes processed successfully!");
          setScanningBarcodes(false);
          setScannedBarcodes([]);
          setCurrentBarcode('');
          setScanReason('');
          setOperationType('inbound');
          setCurrentStep('operation');
        }
      },
      onError: (errors) => {
        console.error("Barcode submission errors:", errors);
        const errorMsg = errors.message || errors.error || "Failed to process barcodes.";
        setErrorMessage(typeof errorMsg === 'string' ? errorMsg : "Failed to process barcodes.");
      },
      onFinish: () => {
        setIsProcessing(false);
      },
    });
  };

  const handleViewBarcodeHistory = async (product: Product) => {
    setLoadingBarcodeProductId(product.id);
    try {
      const response = await fetch(`/products/${product.id}/barcode-history`);
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();

      if (!data.success || !Array.isArray(data.barcodes)) throw new Error('Barcode history response was invalid.');
      setBarcodeHistory(data.barcodes);
      setSelectedProduct(product);
      setViewingBarcodeHistory(true);
    } catch (error) {
      console.error("Failed to fetch barcode history:", error);
      setErrorMessage("Failed to fetch barcode history.");
    } finally {
      setLoadingBarcodeProductId(null);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { label: 'Out of Stock', color: 'bg-red-500' };
    if (product.quantity <= (product.quantity_alert || 0)) return { label: 'Low Stock', color: 'bg-yellow-500' };
    return { label: 'In Stock', color: 'bg-green-500' };
  };

  const canEdit = !["operations", "finance", "callcenter1", ""].includes(auth.user?.roles);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Products" />

      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          eyebrow="Inventory"
          title="Products"
          description="Your full catalogue, live stock levels and the tools to keep every item accurate."
          icon={Package}
          actions={
            canEdit ? (
              <Button
                className="gap-2"
                onClick={() => setCreatingProduct(true)}
              >
                <Plus className="size-4" /> Create product
              </Button>
            ) : undefined
          }
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, store or code..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="outline" className="w-fit bg-card px-3 py-1.5 text-xs text-muted-foreground">
            Showing {products.from || 0}–{products.to || 0} of {products.total || 0} products
          </Badge>
        </div>

        {isFiltering ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 10 }, (_, index) => (
              <Card key={`loading-${index}`} className="gap-4 border-border/60 p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title={filter ? 'No products match your search' : 'No products yet'}
            description={
              filter
                ? 'Try a different name, store or product code.'
                : 'Add your first product to start tracking stock and barcodes.'
            }
            action={
              filter ? (
                <Button variant="outline" onClick={() => setFilter('')}>Clear search</Button>
              ) : canEdit ? (
                <Button onClick={() => setCreatingProduct(true)} className="gap-2">
                  <Plus className="size-4" /> Create product
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              return (
                <Card key={product.id} className="group gap-0 overflow-hidden border-border/60 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-float">
                  <div className={`h-1 ${stockStatus.color}`} />

                  <CardHeader className="pb-3 pt-5">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2 flex-1 text-base font-semibold tracking-tight" title={product.name}>
                        {product.name}
                      </CardTitle>
                      <Badge variant="outline" className="shrink-0 bg-muted/40 font-mono text-[10px]">
                        {product.code}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-1 flex items-center gap-1.5 text-xs" title={product.store_name}>
                      <Tag className="size-3" />
                      {product.store_name || 'No store'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-3">
                    <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Stock status</span>
                      <Badge className={`${stockStatus.color} text-[10px] text-white`}>
                        {stockStatus.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-border/50 bg-card p-2.5">
                        <p className="mb-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Quantity</p>
                        <p className="text-base font-bold tabular-nums">{product.quantity}</p>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-card p-2.5">
                        <p className="mb-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Alert at</p>
                        <p className="text-base font-bold tabular-nums">{product.quantity_alert}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-3">
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
                            Upd.stock
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
                            className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                        loading={loadingLogCode === product.code}
                      >
                        <History size={14} />
                        Stock Logs
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => handleViewBarcodeHistory(product)}
                        loading={loadingBarcodeProductId === product.id}
                      >
                        <Barcode size={14} />
                        Barcodes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

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

      <Dialog open={!!warningMessage} onOpenChange={(open) => !open && setWarningMessage(null)}>
        <DialogContent className="max-w-md">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-amber-500/10 p-3">
              <AlertTriangle className="size-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <DialogHeader>
                <DialogTitle className="text-xl">Partially processed</DialogTitle>
                <DialogDescription className="mt-2 text-base">{warningMessage}</DialogDescription>
              </DialogHeader>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => setWarningMessage(null)}>Got it</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanning Sheet - FULL SCREEN */}
      <Sheet open={scanningBarcodes} onOpenChange={(open) => {
        if (!open) {
          setScanningBarcodes(false);
          setCurrentStep('operation');
        }
      }}>
        <SheetContent side="right" className="w-full max-w-none sm:max-w-none p-0 h-screen flex flex-col">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b bg-white dark:bg-gray-900 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </SheetClose>
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Scan className="h-7 w-7" />
                    Scan Barcodes
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedProduct?.name} • Code: {selectedProduct?.code}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-lg px-4 py-1">
                  {scannedBarcodes.length} scanned
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstructions(!showInstructions)}
                >
                  {showInstructions ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 h-full">
              {/* Left Column - Steps (Full Height) */}
              <div className="lg:col-span-2 border-r overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                {/* Step Navigation */}
                <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep === 'operation' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`font-semibold ${currentStep === 'operation' ? 'text-blue-600' : 'text-gray-500'}`}>Step 1: Operation</p>
                        <p className="text-sm text-gray-500">Select inbound or outbound</p>
                      </div>
                    </div>

                    <ArrowRight className="h-5 w-5 text-gray-400" />

                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep === 'reason' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`font-semibold ${currentStep === 'reason' ? 'text-blue-600' : 'text-gray-500'}`}>Step 2: Reason</p>
                        <p className="text-sm text-gray-500">Provide reason for audit</p>
                      </div>
                    </div>

                    <ArrowRight className="h-5 w-5 text-gray-400" />

                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep === 'scanning' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                        <Barcode className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`font-semibold ${currentStep === 'scanning' ? 'text-blue-600' : 'text-gray-500'}`}>Step 3: Scanning</p>
                        <p className="text-sm text-gray-500">Scan or enter barcodes</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                {showInstructions && (
                  <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-300">Instructions:</p>
                          <ul className="text-sm text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                            <li>• Complete all 3 steps in order</li>
                            <li>• Reason is required for audit trail</li>
                            <li>• Scan barcodes one at a time or enter manually</li>
                            <li>• Review scanned barcodes in the right panel</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step Content */}
                <div className="space-y-6">
                  {/* Step 1: Operation Type */}
                  {currentStep === 'operation' && (
                    <Card className="border-2 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Select Operation Type
                        </CardTitle>
                        <CardDescription>
                          Choose whether you're adding stock (inbound) or removing stock (outbound)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className={`flex flex-col items-center justify-center gap-4 p-6 border-3 rounded-xl cursor-pointer transition-all hover:shadow-lg ${operationType === 'inbound' ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-md' : 'border-gray-300 dark:border-gray-700 hover:border-green-300'
                            }`}>
                            <input
                              type="radio"
                              name="operationType"
                              value="inbound"
                              checked={operationType === 'inbound'}
                              onChange={(e) => setOperationType(e.target.value as 'inbound' | 'outbound')}
                              className="w-6 h-6"
                            />
                            <div className="text-center">
                              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full mb-3">
                                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                              </div>
                              <p className="font-bold text-lg">Inbound</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add stock to inventory</p>
                            </div>
                            <Badge className="bg-green-500 text-white px-4 py-1 text-sm">Add Stock</Badge>
                          </label>

                          <label className={`flex flex-col items-center justify-center gap-4 p-6 border-3 rounded-xl cursor-pointer transition-all hover:shadow-lg ${operationType === 'outbound' ? 'border-red-500 bg-red-50 dark:bg-red-900/30 shadow-md' : 'border-gray-300 dark:border-gray-700 hover:border-red-300'
                            }`}>
                            <input
                              type="radio"
                              name="operationType"
                              value="outbound"
                              checked={operationType === 'outbound'}
                              onChange={(e) => setOperationType(e.target.value as 'inbound' | 'outbound')}
                              className="w-6 h-6"
                            />
                            <div className="text-center">
                              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full mb-3">
                                <TrendingUp className="h-8 w-8 text-red-600 dark:text-red-400" />
                              </div>
                              <p className="font-bold text-lg">Outbound</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Remove stock from inventory</p>
                            </div>
                            <Badge className="bg-red-500 text-white px-4 py-1 text-sm">Remove Stock</Badge>
                          </label>
                        </div>

                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                          <p className="font-medium mb-2">Current Stock Status:</p>
                          <div className="flex items-center justify-between">
                            <span>Current Quantity:</span>
                            <span className="text-2xl font-bold">{selectedProduct?.quantity || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                      <div className="p-6 pt-0">
                        <Button
                          className="w-full h-12 text-lg"
                          size="lg"
                          onClick={() => setCurrentStep('reason')}
                        >
                          Continue to Reason <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Step 2: Reason */}
                  {currentStep === 'reason' && (
                    <Card className={`border-2 ${scanReason.length < 3 && scanReason.length > 0 ? 'border-yellow-500' : 'border-blue-500'}`}>
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Provide Reason <span className="text-red-500">*</span>
                        </CardTitle>
                        <CardDescription>
                          This information is required for audit purposes. Minimum 3 characters.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Textarea
                            ref={reasonTextareaRef}
                            value={scanReason}
                            onChange={(e) => setScanReason(e.target.value)}
                            placeholder="Enter reason for this operation...
Examples:
• Customer order #1234
• Restocking from supplier ABC
• Damaged items removal
• Inventory adjustment
• Quality control check"
                            className="min-h-[200px] resize-none text-base p-4"
                            maxLength={500}
                          />
                          <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              {scanReason.length === 0 ? (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              ) : scanReason.length < 3 ? (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              ) : (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              )}
                              <div>
                                <p className="font-medium">
                                  {scanReason.length < 3 && scanReason.length > 0 ? (
                                    <span className="text-yellow-600">Minimum 3 characters required</span>
                                  ) : scanReason.length === 0 ? (
                                    <span className="text-gray-600">Required field - please provide a reason</span>
                                  ) : (
                                    <span className="text-green-600">✓ Reason provided</span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {scanReason.length > 0 && `${scanReason.length} characters entered`}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">
                              {scanReason.length}/500 characters
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <div className="p-6 pt-0">
                        <div className="flex gap-4">
                          <Button
                            variant="outline"
                            className="flex-1 h-12 text-lg"
                            onClick={() => setCurrentStep('operation')}
                          >
                            <ArrowLeft className="mr-2 h-5 w-5" /> Back
                          </Button>
                          <Button
                            className="flex-1 h-12 text-lg"
                            size="lg"
                            onClick={() => setCurrentStep('scanning')}
                            disabled={scanReason.length < 3}
                          >
                            Continue to Scanning <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Step 3: Scanning */}
                  {currentStep === 'scanning' && (
                    <Card className="border-2 border-blue-500">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Barcode className="h-5 w-5" />
                          Scan Barcodes
                        </CardTitle>
                        <CardDescription>
                          Scan or enter barcodes below. Press Enter after each scan.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <form onSubmit={handleAddBarcode} className="space-y-4">
                            <div className="flex gap-3">
                              <div className="relative flex-1">
                                <QrCode className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                  ref={barcodeInputRef}
                                  type="text"
                                  value={currentBarcode}
                                  onChange={(e) => setCurrentBarcode(e.target.value)}
                                  placeholder="Scan or enter barcode..."
                                  className="flex-1 h-14 text-lg pl-12"
                                  required
                                  autoFocus
                                />
                              </div>
                              <Button type="submit" size="lg" className="h-14 px-8 text-lg">
                                Add Barcode
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 pl-2">
                              Press Enter or click "Add Barcode" after scanning each item
                            </p>
                          </form>

                          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Operation:</p>
                                <p className="font-semibold">{operationType === 'inbound' ? 'Inbound' : 'Outbound'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Reason:</p>
                                <p className="font-semibold truncate">{scanReason || 'Not provided'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <div className="p-6 pt-0">
                        <div className="flex gap-4">
                          <Button
                            variant="outline"
                            className="flex-1 h-12 text-lg"
                            onClick={() => setCurrentStep('reason')}
                          >
                            <ArrowLeft className="mr-2 h-5 w-5" /> Back
                          </Button>
                          <Button
                            className="flex-1 h-12 text-lg"
                            size="lg"
                            onClick={handleSubmitBarcodes}
                            loading={isProcessing}
                            disabled={isProcessing}
                          >
                            Submit {scannedBarcodes.length} Barcode(s)
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              {/* Right Column - Preview & Summary (Full Height) */}
              <div className="overflow-y-auto p-6 bg-white dark:bg-gray-900">
                <div className="space-y-6">
                  {/* Product Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Product Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Product Name:</span>
                          <span className="font-bold text-right max-w-[200px] truncate">{selectedProduct?.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Product Code:</span>
                          <Badge variant="outline" className="font-mono">{selectedProduct?.code}</Badge>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Stock Level</p>
                          <p className="text-4xl font-bold text-blue-600">{selectedProduct?.quantity || 0}</p>
                          <p className="text-sm text-gray-500 mt-1">units in inventory</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scanned Barcodes */}
                  <Card className="flex-1 flex flex-col">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ClipboardList className="h-5 w-5" />
                          Scanned Barcodes ({scannedBarcodes.length})
                        </CardTitle>
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
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                      <div className="border rounded-lg h-[300px] overflow-y-auto bg-gray-50 dark:bg-gray-800 p-2">
                        {scannedBarcodes.length === 0 ? (
                          <div className="text-center py-12">
                            <Barcode className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500 font-medium">No barcodes scanned yet</p>
                            <p className="text-sm text-gray-400 mt-1">Scanned barcodes will appear here</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {scannedBarcodes.map((barcode, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-lg border hover:border-blue-300 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center">
                                    {index + 1}
                                  </Badge>
                                  <div>
                                    <p className="font-mono font-bold">{barcode}</p>
                                    <p className="text-xs text-gray-500">Scanned at {new Date().toLocaleTimeString()}</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveBarcode(index)}
                                  className="hover:bg-red-50 hover:text-red-600"
                                >
                                  <X size={18} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stock Change Preview */}
                  <Card className="border-2 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        Stock Change Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current</p>
                          <p className="text-3xl font-bold">{selectedProduct?.quantity || 0}</p>
                        </div>
                        <div className={`text-center p-4 rounded-lg ${operationType === 'inbound' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {operationType === 'inbound' ? 'Adding' : 'Removing'}
                          </p>
                          <p className={`text-3xl font-bold ${operationType === 'inbound' ? 'text-green-600' : 'text-red-600'}`}>
                            {operationType === 'inbound' ? '+' : '-'}{scannedBarcodes.length}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">New Total</p>
                          <p className="text-3xl font-bold">
                            {operationType === 'inbound'
                              ? (selectedProduct?.quantity || 0) + scannedBarcodes.length
                              : Math.max(0, (selectedProduct?.quantity || 0) - scannedBarcodes.length)}
                          </p>
                        </div>
                      </div>

                      {operationType === 'outbound' && scannedBarcodes.length > (selectedProduct?.quantity || 0) && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <p className="text-sm text-red-600 dark:text-red-400">
                              Warning: Removing more items than available in stock
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Operation Type</p>
                          <p className={`font-bold ${operationType === 'inbound' ? 'text-green-600' : 'text-red-600'}`}>
                            {operationType === 'inbound' ? 'Inbound' : 'Outbound'}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Reason Length</p>
                          <p className="font-bold">{scanReason.length} chars</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
                        {record.reason && (
                          <div className="col-span-2 md:col-span-4 pt-2 border-t mt-1">
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Reason
                            </p>
                            <p className="text-sm bg-secondary/50 p-2 rounded">{record.reason}</p>
                          </div>
                        )}
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
                  value={formValues.category_id ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, category_id: e.target.value ? parseInt(e.target.value, 10) : null })}
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
                <label className="text-sm font-semibold mb-2 block">Supplier *</label>
                <select
                  required
                  value={formValues.unit_id ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, unit_id: e.target.value ? parseInt(e.target.value, 10) : null })}
                  className="w-full border rounded-md p-2.5 text-sm h-11 bg-background"
                >
                  <option value="">Select supplier</option>
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
                  value={formValues.quantity ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, quantity: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder="Enter quantity"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Quantity Alert *</label>
                <Input
                  type="number"
                  required
                  value={formValues.quantity_alert ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, quantity_alert: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder="Enter alert threshold"
                  className="h-11"
                />
              </div>
            </div>

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

            <div>
              <label className="text-sm font-semibold mb-2 block">Notes</label>
              <Input
                value={formValues.notes ?? ''}
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
            <Button size="lg" onClick={handleCreate} loading={isProcessing} className="px-8">
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
                  value={formValues.quantity ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, quantity: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder="Quantity"
                  className="h-11"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Quantity Alert</label>
                <Input
                  type="number"
                  value={formValues.quantity_alert ?? ''}
                  onChange={(e) => setFormValues({ ...formValues, quantity_alert: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder="Alert threshold"
                  className="h-11"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Notes</label>
              <Input
                value={formValues.notes ?? ''}
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
            <Button size="lg" onClick={handleEditSave} loading={isProcessing} className="px-8">
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
                <Button variant="destructive" onClick={handleDelete} loading={isProcessing}>
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
              Update stock
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
                    onChange={() => {
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
                    onChange={() => {
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
                required
                value={quantityChange ?? ""}
                onChange={(e) => setQuantityChange(e.target.value === "" ? null : parseInt(e.target.value))}
                placeholder="Enter quantity"
                className="h-12 text-lg text-center"
              />
            </div>

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
            <Button size="lg" onClick={handleUpdateQuantity} loading={isProcessing} className="px-8">
              Update Stock
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
                  Stock Logs
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
                    <p className="text-lg font-medium">No stocks found</p>
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

                        {log.reason && (
                          <div className="col-span-2 flex items-start gap-2 pt-2 border-t mt-1">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-muted-foreground">Reason</p>
                              <p className="text-sm bg-secondary/50 p-2 rounded mt-1">{log.reason}</p>
                            </div>
                          </div>
                        )}
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