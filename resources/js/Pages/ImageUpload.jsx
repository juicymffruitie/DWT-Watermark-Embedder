import { Head, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import Navigation from "../Components/Navigation";

export default function ImageUpload({ images, flash }) {
    const { data, setData, post, progress, errors, processing } = useForm({
        image: null,
        watermark_image: null,
    });

    const [preview, setPreview] = useState(null);
    const [watermarkPreview, setWatermarkPreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("image", file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleWatermarkImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("watermark_image", file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setWatermarkPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Debug: Log what we're sending
        console.log("Submitting with data:", {
            image: data.image?.name,
            watermark_image: data.watermark_image?.name,
        });

        post("/images", {
            forceFormData: true,
            onSuccess: () => {
                setData({
                    image: null,
                    watermark_image: null,
                });
                setPreview(null);
                setWatermarkPreview(null);
                // Reset file inputs
                document.getElementById("image-upload").value = "";
                const wmInput = document.getElementById(
                    "watermark-image-upload"
                );
                if (wmInput) wmInput.value = "";
            },
            onError: (errors) => {
                // Debug: Log validation errors
                console.error("Upload errors:", errors);
            },
        });
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this image?")) {
            router.delete(`/images/${id}`);
        }
    };

    const handleDownload = (id) => {
        // Navigate to download route
        window.location.href = `/images/${id}/download`;
    };

    return (
        <>
            <Head title="Upload Image - DWT Watermark" />

            <div className="min-h-screen bg-gray-50">
                <Navigation current="upload" />

                {/* Header */}
                <header className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <h1 className="text-3xl font-semibold text-gray-900">
                            Upload Image
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Upload images and embed DWT watermark for protection
                        </p>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
                            <p className="text-sm font-medium">
                                {flash.success}
                            </p>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                            <p className="text-sm font-medium">{flash.error}</p>
                        </div>
                    )}

                    {/* Validation Errors Summary */}
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                            <p className="text-sm font-medium mb-2">
                                Please fix the following errors:
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                {Object.entries(errors).map(
                                    ([field, message]) => (
                                        <li key={field}>{message}</li>
                                    )
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Upload Section */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            Upload Image
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* File Input Area */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Image to Watermark
                                </label>
                                <div className="flex items-center justify-center w-full">
                                    <label
                                        htmlFor="image-upload"
                                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {preview ? (
                                                <img
                                                    src={preview}
                                                    alt="Preview"
                                                    className="max-h-40 max-w-full object-contain rounded"
                                                />
                                            ) : (
                                                <>
                                                    <svg
                                                        className="w-10 h-10 mb-3 text-gray-400"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                        />
                                                    </svg>
                                                    <p className="mb-1 text-sm text-gray-700">
                                                        Click to upload
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        PNG, JPG, GIF, WEBP
                                                        (MAX. 10MB)
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            id="image-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>
                                {errors.image && (
                                    <p className="mt-1 text-red-600 text-sm">
                                        {errors.image}
                                    </p>
                                )}
                            </div>

                            {/* Image Watermark Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Watermark Image (Required)
                                </label>
                                <div className="flex items-center justify-center w-full">
                                    <label
                                        htmlFor="watermark-image-upload"
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-3 pb-3">
                                            {watermarkPreview ? (
                                                <img
                                                    src={watermarkPreview}
                                                    alt="Watermark Preview"
                                                    className="max-h-24 max-w-full object-contain rounded"
                                                />
                                            ) : (
                                                <>
                                                    <svg
                                                        className="w-8 h-8 mb-2 text-gray-400"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                    <p className="text-xs text-gray-500">
                                                        Upload watermark image
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            id="watermark-image-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={
                                                handleWatermarkImageChange
                                            }
                                        />
                                    </label>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    This image pattern will be embedded as a
                                    watermark
                                </p>
                                {errors.watermark_image && (
                                    <p className="mt-1 text-red-600 text-sm">
                                        {errors.watermark_image}
                                    </p>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {progress && (
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gray-900 h-2 rounded-full transition-all"
                                        style={{
                                            width: `${progress.percentage}%`,
                                        }}
                                    ></div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={
                                    !data.image ||
                                    !data.watermark_image ||
                                    processing
                                }
                                className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing
                                    ? "Uploading & Embedding Watermark..."
                                    : "Upload & Embed Watermark"}
                            </button>
                        </form>
                    </div>

                    {/* Uploaded Images Gallery */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            Uploaded Images ({images.length})
                        </h2>

                        {images.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-sm">
                                    No images uploaded yet
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {images.map((image) => (
                                    <div
                                        key={image.id}
                                        className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        {/* Image */}
                                        <div className="aspect-square bg-gray-100">
                                            <img
                                                src={`/storage/${image.path}`}
                                                alt={image.original_name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Info Overlay */}
                                        <div className="p-3 bg-white border-t border-gray-200">
                                            <p className="text-xs font-medium text-gray-900 truncate">
                                                {image.original_name}
                                            </p>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <p className="text-xs text-gray-500">
                                                    {(
                                                        image.size / 1024
                                                    ).toFixed(1)}{" "}
                                                    KB
                                                </p>
                                                {image.watermark_type && (
                                                    <span
                                                        className={`text-xs px-1.5 py-0.5 rounded ${
                                                            image.watermark_type ===
                                                            "text"
                                                                ? "bg-blue-100 text-blue-700"
                                                                : "bg-purple-100 text-purple-700"
                                                        }`}
                                                    >
                                                        {image.watermark_type ===
                                                        "text"
                                                            ? "🔤 Text"
                                                            : "🖼️ Image"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            {/* Download Button */}
                                            <button
                                                onClick={() =>
                                                    handleDownload(image.id)
                                                }
                                                className="bg-white text-gray-700 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-green-50 hover:text-green-600 transition-all shadow-sm border border-gray-200"
                                                title="Download watermarked image"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                    />
                                                </svg>
                                            </button>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() =>
                                                    handleDelete(image.id)
                                                }
                                                className="bg-white text-gray-700 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm border border-gray-200"
                                                title="Delete image"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 py-6 mt-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p className="text-sm text-gray-600">
                            Built with Laravel, React & Tailwind CSS
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
