"use client";

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CalendarDays, Edit3, FolderTree, Plus, Search, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Category {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  categories: Category[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Categories', href: '/categories' },
];

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Categories({ categories }: Props) {
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [newCategory, setNewCategory] = useState({ name: '' });
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleCreate = () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required.');
      return;
    }
    setProcessing(true);
    router.post('/categories', newCategory, {
      preserveScroll: true,
      onSuccess: () => {
        setShowCreate(false);
        setNewCategory({ name: '' });
        toast.success('Category created successfully');
      },
      onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not create category'),
      onFinish: () => setProcessing(false),
    });
  };

  const handleUpdate = () => {
    if (!editCategory) return;
    if (!editCategory.name.trim()) {
      toast.error('Category name is required.');
      return;
    }
    setProcessing(true);
    router.put(
      `/categories/${editCategory.id}`,
      { name: editCategory.name },
      {
        preserveScroll: true,
        onSuccess: () => {
          setShowEdit(false);
          setEditCategory(null);
          toast.success('Category updated successfully');
        },
        onError: (errors) => toast.error(Object.values(errors).join(', ') || 'Could not update category'),
        onFinish: () => setProcessing(false),
      },
    );
  };

  const handleDelete = () => {
    if (deleteCategoryId === null) return;
    setProcessing(true);
    router.delete(`/categories/${deleteCategoryId}`, {
      preserveScroll: true,
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setDeleteCategoryId(null);
        toast.success('Category deleted successfully');
      },
      onError: () => toast.error('Could not delete category'),
      onFinish: () => setProcessing(false),
    });
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Categories" />

      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          eyebrow="Catalogue"
          title="Categories"
          description="Group products into clear, recognisable categories so your team can find and manage stock faster."
          icon={FolderTree}
          actions={
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="size-4" />
              New category
            </Button>
          }
        />

        <Card className="gap-0 overflow-hidden border-border/60">
          <CardHeader className="flex flex-col gap-4 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Tags className="size-4" />
              </span>
              <div>
                <CardTitle className="text-base">All categories</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {filteredCategories.length} of {categories.length} categories
                </p>
              </div>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                className="pl-9"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCategories.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={Tags}
                  title={filter ? 'No categories match your search' : 'No categories yet'}
                  description={
                    filter
                      ? 'Try a different search term or clear the filter.'
                      : 'Create your first category to start organising the catalogue.'
                  }
                  action={
                    filter ? (
                      <Button variant="outline" onClick={() => setFilter('')}>
                        Clear search
                      </Button>
                    ) : (
                      <Button onClick={() => setShowCreate(true)} className="gap-2">
                        <Plus className="size-4" />
                        New category
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/25 hover:bg-muted/25">
                      <TableHead className="w-16 pl-5">#</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="pr-5 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((cat, index) => (
                      <TableRow key={cat.id} className="group">
                        <TableCell className="pl-5 text-sm tabular-nums text-muted-foreground">
                          {String(index + 1).padStart(2, '0')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-xl border border-primary/10 bg-primary/5 text-primary">
                              <Tags className="size-4" />
                            </span>
                            <span className="font-medium">{cat.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                            {cat.slug || '—'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarDays className="size-3.5" />
                            {formatDate(cat.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              aria-label={`Edit ${cat.name}`}
                              onClick={() => {
                                setEditCategory(cat);
                                setShowEdit(true);
                              }}
                            >
                              <Edit3 className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${cat.name}`}
                              onClick={() => {
                                setDeleteCategoryId(cat.id);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create category</DialogTitle>
            <DialogDescription>Add a new group for organising your products.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="category-name">Category name</Label>
            <Input
              id="category-name"
              placeholder="e.g. Beverages"
              value={newCategory.name}
              required
              onChange={(e) => setNewCategory({ name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={processing}>
              {processing ? 'Creating…' : 'Create category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>Update the category name. The slug refreshes automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="edit-category-name">Category name</Label>
            <Input
              id="edit-category-name"
              placeholder="Category name"
              value={editCategory?.name || ''}
              required
              onChange={(e) =>
                setEditCategory(editCategory ? { ...editCategory, name: e.target.value } : null)
              }
              onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} loading={processing}>
              {processing ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? Products in it may lose their category
              assignment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={processing}>
              {processing ? 'Deleting…' : 'Delete category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
