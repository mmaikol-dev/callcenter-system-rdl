import AppLayout from "@/layouts/app-layout";
import { Head, Link, router } from "@inertiajs/react";
import { useState, FormEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Calendar, ImageIcon, X, Clock, Info } from "lucide-react";

export default function Create() {
    const [formData, setFormData] = useState({
        message: "",
        send_at: "",
    });
    const [images, setImages] = useState<File[]>([]);
    const [preview, setPreview] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const handleImages = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setImages(files);

        const previews = files.map((file) => URL.createObjectURL(file));
        setPreview(previews);
    };

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        const newPreviews = preview.filter((_, i) => i !== index);
        setImages(newImages);
        setPreview(newPreviews);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const data = new FormData();
        data.append('message', formData.message);
        data.append('send_at', formData.send_at);

        images.forEach((file) => {
            data.append('images[]', file);
        });

        router.post(route("scheduledmediamessages.store"), data, {
            preserveScroll: true,
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Create Scheduled Media Message" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                            <Send className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Schedule Telegram Message
                        </h1>
                        <p className="text-gray-600">
                            Plan and schedule your media messages for future delivery
                        </p>
                    </div>

                    {/* Main Card */}
                    <Card className="rounded-3xl shadow-xl border-0">
                        <CardContent className="p-8">
                            <form onSubmit={submit} className="space-y-8">
                                {/* Message Section */}
                                <div>
                                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                                        <Send className="w-4 h-4 mr-2 text-blue-600" />
                                        Your Message
                                    </label>
                                    <div className="relative">
                                        <Textarea
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="min-h-[150px] text-base border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 resize-none"
                                            placeholder="Type your message here... You can include emojis 😊"
                                        />
                                        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                                            {formData.message.length} characters
                                        </div>
                                    </div>
                                    {errors.message && (
                                        <p className="text-red-500 text-sm mt-2 flex items-center">
                                            <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                                            {errors.message}
                                        </p>
                                    )}
                                </div>

                                {/* Schedule Section */}
                                <div>
                                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                                        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                                        Schedule Delivery
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="datetime-local"
                                            required
                                            value={formData.send_at}
                                            onChange={(e) => setFormData({ ...formData, send_at: e.target.value })}
                                            className="text-base py-6 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 pr-12"
                                        />
                                        <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                    {errors.send_at && (
                                        <p className="text-red-500 text-sm mt-2 flex items-center">
                                            <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                                            {errors.send_at}
                                        </p>
                                    )}
                                </div>

                                {/* Image Upload Section */}
                                <div>
                                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                                        <ImageIcon className="w-4 h-4 mr-2 text-blue-600" />
                                        Attach Images
                                    </label>

                                    <label className="block cursor-pointer">
                                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                                            <Input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleImages}
                                                className="hidden"
                                            />
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
                                                <ImageIcon className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 mb-1">
                                                Click to upload images
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                PNG, JPG, GIF up to 10MB each
                                            </p>
                                        </div>
                                    </label>

                                    {errors.images && (
                                        <p className="text-red-500 text-sm mt-2 flex items-center">
                                            <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                                            {errors.images}
                                        </p>
                                    )}
                                </div>

                                {/* Image Previews */}
                                {preview.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-4">
                                            {preview.length} {preview.length === 1 ? 'Image' : 'Images'} Selected
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {preview.map((src, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={src}
                                                        alt={`preview ${index + 1}`}
                                                        className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 flex items-center justify-center"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
                                    <Link href={route("scheduledmediamessages.index")} className="flex-1">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            className="w-full h-12 text-sm font-semibold rounded-xl hover:bg-gray-100"
                                        >
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 h-12 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                Scheduling...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <Send className="w-4 h-4" />
                                                Schedule Message
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Info Card */}
                    <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-6">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <Info className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-1">How it works</h3>
                                <p className="text-sm text-blue-700">
                                    Your message will be automatically sent via Telegram at the scheduled time.
                                    Make sure your bot has the necessary permissions to send messages.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}