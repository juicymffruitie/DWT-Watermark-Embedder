import { Head } from "@inertiajs/react";
import { useState } from "react";
import Navigation from "../Components/Navigation";

export default function AIVerification() {
    const [preview, setPreview] = useState(null);
    const [detectionResult, setDetectionResult] = useState(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);

            // Start AI detection
            await detectAI(file);
        }
    };

    const detectAI = async (file) => {
        setIsDetecting(true);
        setError(null);
        setDetectionResult(null);

        const formData = new FormData();
        formData.append("image", file);

        try {
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute("content") || "";
            const response = await fetch("/ai-verification", {
                method: "POST",
                body: formData,
                headers: {
                    "X-CSRF-TOKEN": csrfToken,
                },
            });

            if (!response.ok) {
                throw new Error("Detection failed");
            }

            const result = await response.json();
            setDetectionResult(result);
        } catch (err) {
            setError("Failed to detect AI content. Please try again.");
            console.error(err);
        } finally {
            setIsDetecting(false);
        }
    };

    const handleReset = () => {
        setPreview(null);
        setDetectionResult(null);
        setError(null);
        document.getElementById("image-upload").value = "";
    };

    return (
        <>
            <Head title="AI Verification - DWT Watermark" />

            <div className="min-h-screen bg-gray-50">
                <Navigation current="ai-verification" />

                {/* Header */}
                <header className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            AI Image Detection
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Upload an image to check if it's AI-generated or
                            real.
                        </p>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Upload Section */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Upload Image
                            </h2>

                            <div className="space-y-6">
                                {/* File Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Image
                                    </label>
                                    <div className="flex items-center justify-center w-full">
                                        <label
                                            htmlFor="image-upload"
                                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                {preview ? (
                                                    <img
                                                        src={preview}
                                                        alt="Preview"
                                                        className="max-h-52 max-w-full object-contain rounded"
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
                                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                        <p className="mb-2 text-sm text-gray-500">
                                                            <span className="font-semibold">
                                                                Click to upload
                                                            </span>{" "}
                                                            or drag and drop
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            PNG, JPG, GIF, WEBP
                                                            up to 10MB
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
                                </div>

                                {/* Detection Status */}
                                {isDetecting && (
                                    <div className="text-center py-4">
                                        <div className="inline-flex items-center">
                                            <svg
                                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Analyzing image...
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                        <div className="text-red-800">
                                            {error}
                                        </div>
                                    </div>
                                )}

                                {/* Detection Results */}
                                {detectionResult && !detectionResult.error && (
                                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                        <h3 className="text-lg font-medium text-green-800 mb-2">
                                            Detection Results
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-green-700">
                                                    Neural Score:
                                                </span>
                                                <span className="text-sm font-medium">
                                                    {(
                                                        detectionResult.neural_score *
                                                        100
                                                    ).toFixed(1)}
                                                    %
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-green-700">
                                                    Metadata Score:
                                                </span>
                                                <span className="text-sm font-medium">
                                                    {(
                                                        detectionResult.metadata_score *
                                                        100
                                                    ).toFixed(1)}
                                                    %
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-green-700">
                                                    Visual Score:
                                                </span>
                                                <span className="text-sm font-medium">
                                                    {(
                                                        detectionResult.visual_score *
                                                        100
                                                    ).toFixed(1)}
                                                    %
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-t pt-2">
                                                <span className="text-sm font-medium text-green-800">
                                                    Final Score:
                                                </span>
                                                <span className="text-sm font-bold">
                                                    {(
                                                        detectionResult.final_score *
                                                        100
                                                    ).toFixed(1)}
                                                    %
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-green-800">
                                                    Classification:
                                                </span>
                                                <span
                                                    className={`text-sm font-bold ${
                                                        detectionResult.label ===
                                                        "AI"
                                                            ? "text-red-600"
                                                            : "text-green-600"
                                                    }`}
                                                >
                                                    {detectionResult.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Buttons */}
                                {preview && (
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="px-4 py-2.5 bg-gray-200 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
