import AppLayout from "@/layouts/app-layout";
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Send,
    Plus,
    Eye,
    Pencil,
    Trash2,
    Calendar,
    ImageIcon,
    Clock,
    MessageSquare,
    X
} from "lucide-react";

interface ScheduledMessage {
    id: number;
    message: string;
    send_at: string;
    images: string[];
}

interface Props {
    messages: ScheduledMessage[];
}

export default function Index({ messages }: Props) {
    const [viewData, setViewData] = useState<ScheduledMessage | null>(null);
    const [editData, setEditData] = useState<ScheduledMessage | null>(null);

    const [editForm, setEditForm] = useState({
        message: "",
        send_at: "",
        images: [] as File[],
    });

    const [editPreview, setEditPreview] = useState<string[]>([]);

    const resolveUrl = (path: string) => {
        if (path.startsWith("http")) return path;
        return `/storage/${path}`;
    };

    const openEditDialog = (msg: ScheduledMessage) => {
        setEditData(msg);
        setEditForm({
            message: msg.message,
            send_at: msg.send_at.replace(" ", "T"),
            images: []
        });
        setEditPreview([]);
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this scheduled message?")) {
            router.delete(route("scheduledmediamessages.destroy", id), {
                preserveScroll: true,
            });
        }
    };

    const handleEditImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setEditForm({ ...editForm, images: files });

        const previews = files.map((file) => URL.createObjectURL(file));
        setEditPreview(previews);
    };

    const removeEditPreview = (index: number) => {
        const newImages = editForm.images.filter((_, i) => i !== index);
        const newPreviews = editPreview.filter((_, i) => i !== index);
        setEditForm({ ...editForm, images: newImages });
        setEditPreview(newPreviews);
    };

    const handleEditSubmit = () => {
        if (!editData) return;

        const formData = new FormData();
        formData.append("message", editForm.message);
        formData.append("send_at", editForm.send_at);
        formData.append("_method", "PUT");

        editForm.images.forEach((file, index) => {
            formData.append(`images[${index}]`, file);
        });

        router.post(route("scheduledmediamessages.update", editData.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setEditData(null);
                setEditForm({ message: "", send_at: "", images: [] });
                setEditPreview([]);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Scheduled Media Messages" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <MessageSquare className="w-6 h-6 text-white" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Scheduled Messages
                                    </h1>
                                </div>
                                <p className="text-gray-600 ml-15">
                                    Manage your Telegram bot scheduled messages
                                </p>
                            </div>

                            <Link href={route("scheduledmediamessages.create")}>
                                <Button className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30 font-semibold">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create New Message
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm font-medium">Total Scheduled</p>
                                        <p className="text-3xl font-bold text-white mt-1">{messages.length}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-indigo-100 text-sm font-medium">With Images</p>
                                        <p className="text-3xl font-bold text-white mt-1">
                                            {messages.filter(m => m.images?.length > 0).length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm font-medium">Active Bot</p>
                                        <p className="text-xl font-bold text-white mt-1">Telegram</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Send className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Messages Table */}
                    <Card className="rounded-2xl shadow-xl border-0 overflow-hidden">
                        <CardContent className="p-0">
                            {messages.length === 0 ? (
                                <div className="text-center py-16 px-4">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
                                        <MessageSquare className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        No scheduled messages yet
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Get started by creating your first scheduled message
                                    </p>
                                    <Link href={route("scheduledmediamessages.create")}>
                                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Your First Message
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b-2">
                                            <TableHead className="font-semibold text-gray-700">Message</TableHead>
                                            <TableHead className="font-semibold text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    Send At
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-semibold text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    <ImageIcon className="w-4 h-4" />
                                                    Images
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {messages.map((msg) => (
                                            <TableRow key={msg.id} className="hover:bg-blue-50/50">
                                                <TableCell className="max-w-md">
                                                    <p className="truncate font-medium text-gray-900">{msg.message}</p>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Calendar className="w-4 h-4 text-blue-600" />
                                                        {new Date(msg.send_at).toLocaleString()}
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                            {msg.images?.length || 0} image{msg.images?.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setViewData(msg)}
                                                            className="rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openEditDialog(msg)}
                                                            className="rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDelete(msg.id)}
                                                            className="rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* VIEW MODAL */}
            <Dialog open={!!viewData} onOpenChange={() => setViewData(null)}>
                <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Eye className="w-5 h-5 text-blue-600" />
                            View Scheduled Message
                        </DialogTitle>
                    </DialogHeader>

                    {viewData && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <label className="text-sm font-semibold text-gray-700 mb-2 block">Message</label>
                                <p className="text-gray-900">{viewData.message}</p>
                            </div>

                            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                    Scheduled For
                                </label>
                                <p className="text-gray-900 font-medium">
                                    {new Date(viewData.send_at).toLocaleString()}
                                </p>
                            </div>

                            {viewData.images && viewData.images.length > 0 && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-blue-600" />
                                        Attached Images ({viewData.images.length})
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {viewData.images.map((img, i) => (
                                            <img
                                                key={i}
                                                src={resolveUrl(img)}
                                                className="rounded-xl border-2 border-gray-200 h-32 w-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                                alt={`Image ${i + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            onClick={() => setViewData(null)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* EDIT MODAL */}
            <Dialog open={!!editData} onOpenChange={() => setEditData(null)}>
                <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Pencil className="w-5 h-5 text-indigo-600" />
                            Edit Scheduled Message
                        </DialogTitle>
                    </DialogHeader>

                    {editData && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-600" />
                                    Message
                                </label>
                                <Textarea
                                    value={editForm.message}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, message: e.target.value })
                                    }
                                    className="min-h-[120px] border-2 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    placeholder="Enter your message..."
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    Send At
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={editForm.send_at}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, send_at: e.target.value })
                                    }
                                    className="border-2 rounded-xl py-6 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-blue-600" />
                                    Upload New Images
                                </label>
                                <Input
                                    type="file"
                                    multiple
                                    onChange={handleEditImages}
                                    className="border-2 rounded-xl cursor-pointer"
                                />

                                {editPreview.length > 0 && (
                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        {editPreview.map((src, i) => (
                                            <div key={i} className="relative group">
                                                <img
                                                    src={src}
                                                    className="rounded-xl border-2 border-gray-200 h-24 w-full object-cover"
                                                    alt={`New preview ${i + 1}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeEditPreview(i)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 flex items-center justify-center"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {editData.images?.length > 0 && (
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                        Current Images
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {editData.images.map((img, i) => (
                                            <img
                                                key={i}
                                                src={resolveUrl(img)}
                                                className="rounded-xl border-2 border-gray-200 h-24 w-full object-cover"
                                                alt={`Current image ${i + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setEditData(null)}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleEditSubmit}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}