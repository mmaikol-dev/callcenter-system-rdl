"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import {
    Table, TableHeader, TableHead, TableBody, TableRow, TableCell
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
    TrashIcon, BarcodeIcon, FilterIcon, X, XCircle, EyeIcon,
    UserIcon, PackageIcon, CalendarIcon, ArrowUpIcon, ArrowDownIcon,
    FileTextIcon, AlertCircleIcon, MessageSquareIcon, SearchIcon,
    ChevronLeftIcon, ChevronRightIcon, ChevronFirstIcon, ChevronLastIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
    Drawer, DrawerContent, DrawerHeader, DrawerTitle,
    DrawerDescription, DrawerFooter, DrawerClose
} from "@/components/ui/drawer";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Barcodes', href: '/barcode' },
];

interface BarcodeData {
    id: number;
    product_name: string;
    product_code: string;
    barcode: string;
    operation_type: 'inbound' | 'outbound';
    scanned_by: string;
    user_id: number;
    scanned_at: string;
    created_at: string;
    updated_at: string;
    reason?: string;
    quantity?: number;
    remaining_stock?: number;
}

interface PaginatedData {
    current_page: number;
    data: BarcodeData[];
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

export default function BarcodeIndex() {
    const { barcodes, products, scannedBys, filters } = usePage().props as any;

    const paginatedBarcodes = barcodes as PaginatedData;
    const barcodesData = paginatedBarcodes?.data || [];

    const [filterOpen, setFilterOpen] = useState(false);
    const [viewingBarcode, setViewingBarcode] = useState<BarcodeData | null>(null);
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [isMobile, setIsMobile] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isFiltering, setIsFiltering] = useState(false);

    // Filter states - initialize with local date parsing
    const [filterProduct, setFilterProduct] = useState(filters.product_name || "");
    const [filterScannedBy, setFilterScannedBy] = useState(filters.scanned_by || "");
    const [filterOperationType, setFilterOperationType] = useState(filters.operation_type || "");
    const [filterDate, setFilterDate] = useState<DateRange | undefined>(() => {
        if (filters.scanned_from && filters.scanned_to) {
            // Parse dates as local dates by adding T00:00:00 to avoid UTC conversion
            const fromDate = new Date(filters.scanned_from + 'T00:00:00');
            const toDate = new Date(filters.scanned_to + 'T00:00:00');
            return { from: fromDate, to: toDate };
        }
        return undefined;
    });

    useEffect(() => {
        if (searchTerm === (filters.search || "")) return;
        const timeout = window.setTimeout(() => {
            router.get(route("barcode.index"), {
                search: searchTerm || undefined,
                product_name: filterProduct || undefined,
                scanned_by: filterScannedBy || undefined,
                operation_type: filterOperationType || undefined,
                scanned_from: filters.scanned_from || undefined,
                scanned_to: filters.scanned_to || undefined,
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["barcodes", "filters"],
                onStart: () => setIsFiltering(true),
                onFinish: () => setIsFiltering(false),
            });
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [searchTerm, filters.search]);

    // Check if mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this barcode record?")) {
            setDeletingId(id);
            router.delete(route("barcode.destroy", id), {
                preserveScroll: true,
                onSuccess: () => toast.success("Barcode record deleted"),
                onError: () => toast.error("Could not delete barcode record. Please try again."),
                onFinish: () => setDeletingId(null),
            });
        }
    };

    const handleViewBarcode = (barcode: BarcodeData) => {
        setViewingBarcode(barcode);
        setViewDrawerOpen(true);
    };

    const applyFilters = () => {
        const params: any = {};

        if (filterProduct) params.product_name = filterProduct;
        if (filterScannedBy) params.scanned_by = filterScannedBy;
        if (filterOperationType) params.operation_type = filterOperationType;
        if (searchTerm) params.search = searchTerm;

        // Fix timezone issue: Get local date components
        if (filterDate?.from) {
            const localDate = new Date(filterDate.from);
            const year = localDate.getFullYear();
            const month = String(localDate.getMonth() + 1).padStart(2, '0');
            const day = String(localDate.getDate()).padStart(2, '0');
            params.scanned_from = `${year}-${month}-${day}`;
        }

        if (filterDate?.to) {
            const localDate = new Date(filterDate.to);
            const year = localDate.getFullYear();
            const month = String(localDate.getMonth() + 1).padStart(2, '0');
            const day = String(localDate.getDate()).padStart(2, '0');
            params.scanned_to = `${year}-${month}-${day}`;
        }

        router.get(route("barcode.index"), params, {
            preserveState: true,
            preserveScroll: true,
            only: ["barcodes", "filters"],
            onStart: () => setIsFiltering(true),
            onFinish: () => setIsFiltering(false),
        });

        setFilterOpen(false);
    };

    const clearAllFilters = () => {
        setFilterProduct("");
        setFilterScannedBy("");
        setFilterOperationType("");
        setFilterDate(undefined);
        setSearchTerm("");

        router.get(route("barcode.index"), {}, {
            preserveState: true,
            preserveScroll: true,
            only: ["barcodes", "filters"],
            onStart: () => setIsFiltering(true),
            onFinish: () => setIsFiltering(false),
        });
        setFilterOpen(false);
    };

    const removeFilter = (filterName: string) => {
        const params: any = {
            product_name: filters.product_name || "",
            scanned_by: filters.scanned_by || "",
            operation_type: filters.operation_type || "",
            scanned_from: filters.scanned_from || "",
            scanned_to: filters.scanned_to || "",
            search: filters.search || "",
        };

        if (filterName === 'product') {
            setFilterProduct("");
            delete params.product_name;
        } else if (filterName === 'scanned_by') {
            setFilterScannedBy("");
            delete params.scanned_by;
        } else if (filterName === 'operation_type') {
            setFilterOperationType("");
            delete params.operation_type;
        } else if (filterName === 'date') {
            setFilterDate(undefined);
            delete params.scanned_from;
            delete params.scanned_to;
        } else if (filterName === 'search') {
            setSearchTerm("");
            delete params.search;
        }

        router.get(route("barcode.index"), params, {
            preserveState: true,
            preserveScroll: true,
            only: ["barcodes", "filters"],
            onStart: () => setIsFiltering(true),
            onFinish: () => setIsFiltering(false),
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handlePageChange = (url: string | null) => {
        if (!url) return;
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
            only: ["barcodes", "filters"],
            onStart: () => setIsFiltering(true),
            onFinish: () => setIsFiltering(false),
        });
    };

    const filteredBarcodes = barcodesData;

    const activeFiltersCount = [
        filters.product_name,
        filters.scanned_by,
        filters.operation_type,
        filters.scanned_from,
        filters.scanned_to,
        filters.search
    ].filter(Boolean).length;

    const cellClass = "px-3 py-3 text-sm align-middle";

    // Format date for display
    const formatDateForDisplay = (date: Date | undefined) => {
        return date ? format(date, "PPP") : "";
    };

    // Date range text - use local date
    const dateRangeText = filterDate?.from ? (
        filterDate.to ? (
            `${formatDateForDisplay(filterDate.from)} - ${formatDateForDisplay(filterDate.to)}`
        ) : (
            formatDateForDisplay(filterDate.from)
        )
    ) : "Pick a date range";

    // Helper to format date for display in active filters (avoiding timezone issues)
    const formatFilterDate = (dateString: string) => {
        // Parse as local date by adding time component
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Barcodes" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <PageHeader
                    eyebrow="Inventory"
                    title="Barcode activity"
                    description="Every scan across your operation — inbound receipts, outbound movement and full audit history."
                    icon={BarcodeIcon}
                    actions={
                        <>
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => {
                                    const params: any = {};
                                    if (filters.product_name) params.product_name = filters.product_name;
                                    if (filters.scanned_by) params.scanned_by = filters.scanned_by;
                                    if (filters.operation_type) params.operation_type = filters.operation_type;
                                    if (filters.scanned_from) params.scanned_from = filters.scanned_from;
                                    if (filters.scanned_to) params.scanned_to = filters.scanned_to;
                                    if (filters.search) params.search = filters.search;
                                    router.get(route("barcode.print"), params);
                                }}
                            >
                                <BarcodeIcon className="size-4" /> Print
                            </Button>

                            <Button
                                variant="default"
                                className="relative gap-2"
                                onClick={() => setFilterOpen(true)}
                            >
                                <FilterIcon className="size-4" /> Filter
                                {activeFiltersCount > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="absolute -right-2 -top-2 flex size-5 items-center justify-center bg-primary p-0 text-primary-foreground"
                                    >
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </Button>
                        </>
                    }
                />

                <Card className="gap-0 overflow-hidden border-border/60">
                    <CardContent className="p-0">
                        {/* Active Filters Display */}
                        {activeFiltersCount > 0 && (
                            <div className="p-4 border-b bg-muted/30">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">Active Filters:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {filters.product_name && (
                                            <Badge variant="secondary" className="gap-1 px-2 py-1">
                                                Product: {filters.product_name}
                                                <X
                                                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                                                    onClick={() => removeFilter('product')}
                                                />
                                            </Badge>
                                        )}
                                        {filters.scanned_by && (
                                            <Badge variant="secondary" className="gap-1 px-2 py-1">
                                                User: {filters.scanned_by}
                                                <X
                                                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                                                    onClick={() => removeFilter('scanned_by')}
                                                />
                                            </Badge>
                                        )}
                                        {filters.operation_type && (
                                            <Badge variant="secondary" className="gap-1 px-2 py-1">
                                                Type: {filters.operation_type}
                                                <X
                                                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                                                    onClick={() => removeFilter('operation_type')}
                                                />
                                            </Badge>
                                        )}
                                        {filters.scanned_from && filters.scanned_to && (
                                            <Badge variant="secondary" className="gap-1 px-2 py-1">
                                                Date: {formatFilterDate(filters.scanned_from)} - {formatFilterDate(filters.scanned_to)}
                                                <X
                                                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                                                    onClick={() => removeFilter('date')}
                                                />
                                            </Badge>
                                        )}
                                        {filters.search && (
                                            <Badge variant="secondary" className="gap-1 px-2 py-1">
                                                Search: {filters.search}
                                                <X
                                                    className="w-3 h-3 cursor-pointer hover:text-destructive"
                                                    onClick={() => removeFilter('search')}
                                                />
                                            </Badge>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearAllFilters}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search Bar */}
                        <div className="p-4 border-b">
                            <div className="relative max-w-2xl">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search all barcode records by product, code, user or reason..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-10"
                                />
                                {searchTerm && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                        onClick={() => setSearchTerm("")}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b">
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                                <p className="text-sm text-muted-foreground">Total Barcodes</p>
                                <p className="text-2xl font-bold tabular-nums">{paginatedBarcodes?.total || 0}</p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                                <p className="text-sm text-muted-foreground">Inbound</p>
                                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                    {barcodesData.filter((b: BarcodeData) => b.operation_type === 'inbound').length}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                                <p className="text-sm text-muted-foreground">Outbound</p>
                                <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                                    {barcodesData.filter((b: BarcodeData) => b.operation_type === 'outbound').length}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                                <p className="text-sm text-muted-foreground">With Reason</p>
                                <p className="text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400">
                                    {barcodesData.filter((b: BarcodeData) => b.reason && b.reason.trim().length > 0).length}
                                </p>
                            </div>
                        </div>

                        {/* Results Info */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b">
                            <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
                                <p>
                                    Showing {paginatedBarcodes?.from || 0} to {paginatedBarcodes?.to || 0} of {paginatedBarcodes?.total || 0} matching barcodes
                                </p>
                            </div>
                            {paginatedBarcodes?.total > paginatedBarcodes?.per_page && (
                                <div className="text-sm text-muted-foreground">
                                    Page {paginatedBarcodes?.current_page || 1} of {paginatedBarcodes?.last_page || 1}
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className={`${cellClass} w-16`}>ID</TableHead>
                                        <TableHead className={`${cellClass} min-w-[180px]`}>Product</TableHead>
                                        <TableHead className={`${cellClass} min-w-[120px]`}>Code</TableHead>
                                        <TableHead className={`${cellClass} min-w-[150px]`}>Barcode</TableHead>
                                        <TableHead className={`${cellClass} min-w-[120px]`}>Operation</TableHead>
                                        <TableHead className={`${cellClass} min-w-[180px]`}>Scanned At</TableHead>
                                        <TableHead className={`${cellClass} w-32`}>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {isFiltering ? (
                                        Array.from({ length: 8 }, (_, index) => (
                                            <TableRow key={`loading-${index}`}>
                                                <TableCell colSpan={7}>
                                                    <Skeleton className="h-8 w-full" />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                    filteredBarcodes.length ? (
                                        filteredBarcodes.map((b: BarcodeData) => (
                                            <TableRow key={b.id} className="hover:bg-muted/50">
                                                <TableCell className={`${cellClass} font-mono`}>
                                                    {b.id}
                                                </TableCell>
                                                <TableCell className={cellClass}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <PackageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="truncate" title={b.product_name}>
                                                            {b.product_name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={cellClass}>
                                                    <Badge variant="secondary" className="font-mono">
                                                        {b.product_code}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className={cellClass}>
                                                    <Badge variant="outline" className="font-mono font-bold">
                                                        {b.barcode}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className={cellClass}>
                                                    <StatusBadge status={b.operation_type} />
                                                </TableCell>
                                                <TableCell className={cellClass}>
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-xs">
                                                            {formatDate(b.scanned_at)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={cellClass}>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleViewBarcode(b)}
                                                            className="h-8 px-2"
                                                        >
                                                            <EyeIcon className="w-3 h-3 md:mr-1" />
                                                            <span className="hidden md:inline">View</span>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDelete(b.id)}
                                                            loading={deletingId === b.id}
                                                            className="h-8 px-2"
                                                        >
                                                            <TrashIcon className="w-3 h-3" />
                                                            <span className="hidden md:inline ml-1">Delete</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                                <div className="flex flex-col items-center gap-3">
                                                    <BarcodeIcon className="w-12 h-12 text-muted-foreground/30" />
                                                    <p className="text-lg font-medium">No barcodes found</p>
                                                    <p className="text-sm">
                                                        {searchTerm ? "Try adjusting your search" : "Try adjusting your filters or scan some barcodes"}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {paginatedBarcodes?.total > paginatedBarcodes?.per_page && (
                            <div className="border-t">
                                <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing <span className="font-medium">{paginatedBarcodes?.from}</span> to{' '}
                                        <span className="font-medium">{paginatedBarcodes?.to}</span> of{' '}
                                        <span className="font-medium">{paginatedBarcodes?.total}</span> barcodes
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(paginatedBarcodes?.first_page_url)}
                                            disabled={paginatedBarcodes?.current_page === 1}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronFirstIcon size={16} />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(paginatedBarcodes?.prev_page_url)}
                                            disabled={!paginatedBarcodes?.prev_page_url}
                                            className="h-8 gap-1"
                                        >
                                            <ChevronLeftIcon size={16} />
                                            <span className="hidden sm:inline">Previous</span>
                                        </Button>

                                        <div className="flex gap-1">
                                            {paginatedBarcodes?.links.slice(1, -1).map((link, index) => (
                                                <Button
                                                    key={index}
                                                    variant={link.active ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(link.url)}
                                                    disabled={!link.url}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    {link.label}
                                                </Button>
                                            ))}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(paginatedBarcodes?.next_page_url)}
                                            disabled={!paginatedBarcodes?.next_page_url}
                                            className="h-8 gap-1"
                                        >
                                            <span className="hidden sm:inline">Next</span>
                                            <ChevronRightIcon size={16} />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(paginatedBarcodes?.last_page_url)}
                                            disabled={paginatedBarcodes?.current_page === paginatedBarcodes?.last_page}
                                            className="h-8 w-8 p-0"
                                        >
                                            <ChevronLastIcon size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Filter Modal/Drawer (responsive) */}
            {isMobile ? (
                <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
                    <DrawerContent className="h-[90vh]">
                        <DrawerHeader className="border-b">
                            <DrawerTitle className="text-xl flex items-center gap-2">
                                <FilterIcon className="w-5 h-5" /> Filter Barcodes
                            </DrawerTitle>
                            <DrawerDescription>
                                Select filters to narrow down your search
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="flex-1 overflow-y-auto px-4 py-6">
                            <div className="space-y-6">
                                {/* Product Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Product Name</label>
                                    <Select value={filterProduct || "all"} onValueChange={(val) => setFilterProduct(val === "all" ? "" : val)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select product..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Products</SelectItem>
                                            {products.map((p: string, i: number) => (
                                                <SelectItem key={i} value={p}>
                                                    {p}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Scanned By */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Scanned By</label>
                                    <Select value={filterScannedBy || "all"} onValueChange={(val) => setFilterScannedBy(val === "all" ? "" : val)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select user..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            {scannedBys.map((u: string, i: number) => (
                                                <SelectItem key={i} value={u}>
                                                    {u}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Operation Type */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Operation Type</label>
                                    <Select value={filterOperationType || "all"} onValueChange={(val) => setFilterOperationType(val === "all" ? "" : val)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select operation type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Operations</SelectItem>
                                            <SelectItem value="inbound">Inbound</SelectItem>
                                            <SelectItem value="outbound">Outbound</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date Range with Popover */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Scanned Date Range</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateRangeText}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="range"
                                                selected={filterDate}
                                                onSelect={setFilterDate}
                                                numberOfMonths={1}
                                                className="p-3"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {filterDate?.from && filterDate?.to && (
                                        <div className="text-sm text-muted-foreground">
                                            Selected: {filterDate.from.toLocaleDateString()} - {filterDate.to.toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DrawerFooter className="border-t pt-4">
                            <div className="flex flex-col w-full gap-3">
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={clearAllFilters}
                                >
                                    <XCircle className="w-4 h-4" />
                                    Clear All Filters
                                </Button>
                                <div className="flex gap-2">
                                    <DrawerClose asChild>
                                        <Button variant="outline" className="flex-1">
                                            Cancel
                                        </Button>
                                    </DrawerClose>
                                    <Button onClick={applyFilters} className="flex-1" loading={isFiltering}>
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-xl flex items-center gap-2">
                                <FilterIcon className="w-5 h-5" /> Filter Barcodes
                            </DialogTitle>
                            <DialogDescription>
                                Select filters to narrow down your search. Filters will apply across all pages.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto px-1 py-2">
                            <div className="grid gap-6 py-2">
                                {/* Product Name */}
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Product Name</label>
                                    <Select value={filterProduct || "all"} onValueChange={(val) => setFilterProduct(val === "all" ? "" : val)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select product..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            <SelectItem value="all">All Products</SelectItem>
                                            {products.map((p: string, i: number) => (
                                                <SelectItem key={i} value={p}>
                                                    {p}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Scanned By */}
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Scanned By</label>
                                    <Select value={filterScannedBy || "all"} onValueChange={(val) => setFilterScannedBy(val === "all" ? "" : val)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select user..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                            <SelectItem value="all">All Users</SelectItem>
                                            {scannedBys.map((u: string, i: number) => (
                                                <SelectItem key={i} value={u}>
                                                    {u}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Operation Type */}
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Operation Type</label>
                                    <Select value={filterOperationType || "all"} onValueChange={(val) => setFilterOperationType(val === "all" ? "" : val)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select operation type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Operations</SelectItem>
                                            <SelectItem value="inbound">Inbound</SelectItem>
                                            <SelectItem value="outbound">Outbound</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Date Range with Popover */}
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Scanned Date Range</label>
                                    <div className="space-y-3">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {dateRangeText}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="range"
                                                    selected={filterDate}
                                                    onSelect={setFilterDate}
                                                    numberOfMonths={2}
                                                    className="p-3"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {filterDate?.from && filterDate?.to && (
                                            <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                                                Selected range: {filterDate.from.toLocaleDateString()} - {filterDate.to.toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex-shrink-0 border-t pt-4">
                            <div className="flex justify-between w-full">
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={clearAllFilters}
                                >
                                    <XCircle className="w-4 h-4" />
                                    Clear All Filters
                                </Button>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setFilterOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={applyFilters} loading={isFiltering}>
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* View Barcode Details Drawer */}
            <Drawer open={viewDrawerOpen} onOpenChange={setViewDrawerOpen}>
                <DrawerContent className="md:max-w-[600px]">
                    <DrawerHeader className="border-b">
                        <DrawerTitle className="text-lg flex items-center gap-2">
                            <EyeIcon className="w-5 h-5" /> Barcode Details
                        </DrawerTitle>
                        <DrawerDescription>
                            Complete information about this barcode scan
                        </DrawerDescription>
                    </DrawerHeader>

                    {viewingBarcode && (
                        <div className="p-4 md:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Barcode Display */}
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <div className="mb-3">
                                    <BarcodeIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">Barcode Number</p>
                                <p className="text-2xl md:text-3xl font-mono font-bold tracking-wider break-all">
                                    {viewingBarcode.barcode}
                                </p>
                            </div>

                            {/* Product Information */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <PackageIcon className="w-5 h-5" /> Product Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-muted p-3 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-1">Product Name</p>
                                        <p className="font-medium">{viewingBarcode.product_name}</p>
                                    </div>
                                    <div className="bg-muted p-3 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-1">Product Code</p>
                                        <Badge variant="secondary" className="font-mono">
                                            {viewingBarcode.product_code}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Operation Details */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <ArrowUpIcon className="w-5 h-5" /> Operation Details
                                </h3>
                                <div className="bg-muted p-4 rounded-lg">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <span className="font-medium">Operation Type:</span>
                                        {viewingBarcode.operation_type === 'inbound' ? (
                                            <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1">
                                                <ArrowUpIcon className="w-4 h-4 mr-1" /> Inbound (Add Stock)
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-destructive hover:bg-destructive/90 text-white px-3 py-1">
                                                <ArrowDownIcon className="w-4 h-4 mr-1" /> Outbound (Remove Stock)
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Reason Section */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <MessageSquareIcon className="w-5 h-5" /> Reason for Operation
                                </h3>
                                <div className={`bg-muted p-4 rounded-lg ${!viewingBarcode.reason ? 'border-2 border-dashed border-border' : ''}`}>
                                    {viewingBarcode.reason ? (
                                        <>
                                            <div className="flex items-start gap-2 mb-3">
                                                <FileTextIcon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        Reason provided by {viewingBarcode.scanned_by}:
                                                    </p>
                                                    <div className="bg-background p-4 rounded border">
                                                        <p className="text-sm whitespace-pre-wrap break-words">{viewingBarcode.reason}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-4">
                                            <MessageSquareIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-muted-foreground">No reason provided for this operation</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Scanning Information */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <UserIcon className="w-5 h-5" /> Scanning Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-muted p-3 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-1">Scanned By</p>
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="w-4 h-4 text-muted-foreground" />
                                            <p className="font-medium">{viewingBarcode.scanned_by}</p>
                                        </div>
                                    </div>
                                    <div className="bg-muted p-3 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-1">User ID</p>
                                        <p className="font-mono font-medium">{viewingBarcode.user_id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5" /> Timestamps
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-muted p-3 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-1">Scanned At</p>
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                            <p className="text-sm font-medium">{formatDate(viewingBarcode.scanned_at)}</p>
                                        </div>
                                    </div>
                                    <div className="bg-muted p-3 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-1">Created At</p>
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                            <p className="text-sm font-medium">{formatDate(viewingBarcode.created_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stock Information */}
                            {viewingBarcode.quantity !== undefined && viewingBarcode.remaining_stock !== undefined && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <AlertCircleIcon className="w-5 h-5" /> Stock Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-muted p-3 rounded-lg">
                                            <p className="text-sm text-muted-foreground mb-1">Quantity Change</p>
                                            <p className={`text-xl font-bold ${viewingBarcode.operation_type === 'inbound' ? 'text-green-600' : 'text-destructive'}`}>
                                                {viewingBarcode.operation_type === 'inbound' ? '+' : '-'}{viewingBarcode.quantity}
                                            </p>
                                        </div>
                                        <div className="bg-muted p-3 rounded-lg">
                                            <p className="text-sm text-muted-foreground mb-1">Remaining Stock</p>
                                            <p className="text-xl font-bold">{viewingBarcode.remaining_stock}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DrawerFooter className="border-t">
                        <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-3">
                            <div className="text-sm text-muted-foreground">
                                Record ID: <span className="font-mono font-medium">{viewingBarcode?.id}</span>
                            </div>
                            <div className="flex gap-2">
                                <DrawerClose asChild>
                                    <Button variant="outline">Close</Button>
                                </DrawerClose>
                                {viewingBarcode && (
                                    <Button
                                        variant="destructive"
                                        loading={deletingId === viewingBarcode.id}
                                        onClick={() => {
                                            setViewDrawerOpen(false);
                                            handleDelete(viewingBarcode.id);
                                        }}
                                    >
                                        <TrashIcon className="w-4 h-4 mr-2" /> Delete
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </AppLayout>
    );
}