import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";
import Navigation from "../Components/Navigation";

export default function VerifyImage({ flash, verificationResult }) {
    const { data, setData, post, progress, errors, processing } = useForm({
        image: null,
    });

    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(verificationResult || null);

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

            // Reset result when new file is selected
            setResult(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/verify", {
            onSuccess: (page) => {
                // Update result state with the verification result from the response
                if (page.props.verificationResult) {
                    setResult(page.props.verificationResult);
                }
            },
            onError: () => {
                // Reset result on error
                setResult(null);
            },
        });
    };

    return (
        <>
            <Head title="Verify Image - DWT Watermark" />

            <div className="min-h-screen bg-gray-50">
                <Navigation current="verify" />

                {/* Header */}
                <header className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <h1 className="text-3xl font-semibold text-gray-900">
                            Verify Image
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Check if an image contains a DWT watermark
                        </p>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

                    {/* Verify Section */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            Select Image to Verify
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* File Input Area */}
                            <div className="flex items-center justify-center w-full">
                                <label
                                    htmlFor="verify-upload"
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
                                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                <p className="mb-1 text-sm text-gray-700">
                                                    Click to select image
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    PNG, JPG, GIF, WEBP
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        id="verify-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>

                            {errors.image && (
                                <p className="text-red-600 text-sm">
                                    {errors.image}
                                </p>
                            )}

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
                                disabled={!data.image || processing}
                                className="w-full px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing
                                    ? "Verifying..."
                                    : "Verify Watermark"}
                            </button>
                        </form>
                    </div>

                    {/* Verification Result */}
                    {result && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Verification Result
                            </h2>

                            <div
                                className={`p-4 rounded-lg border ${
                                    result.hasWatermark
                                        ? "bg-green-50 border-green-200"
                                        : "bg-yellow-50 border-yellow-200"
                                }`}
                            >
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        {result.hasWatermark ? (
                                            <svg
                                                className="w-6 h-6 text-green-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-6 h-6 text-yellow-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <h3
                                            className={`text-sm font-medium ${
                                                result.hasWatermark
                                                    ? "text-green-800"
                                                    : "text-yellow-800"
                                            }`}
                                        >
                                            {result.hasWatermark
                                                ? "✓ Watermark Detected"
                                                : "✗ No Watermark Found"}
                                        </h3>
                                        <div
                                            className={`mt-2 text-sm ${
                                                result.hasWatermark
                                                    ? "text-green-700"
                                                    : "text-yellow-700"
                                            }`}
                                        >
                                            <p>{result.message}</p>
                                            {result.details && (
                                                <p className="mt-1 text-xs font-mono bg-white bg-opacity-50 p-2 rounded">
                                                    {result.details}
                                                </p>
                                            )}

                                            {/* Enhanced Metrics Display */}
                                            {result.confidence && (
                                                <div className="mt-3 space-y-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-medium">
                                                            Confidence Level:
                                                        </span>
                                                        <span
                                                            className={`px-2 py-1 rounded font-semibold ${
                                                                result.confidence ===
                                                                "HIGH"
                                                                    ? "bg-green-200 text-green-900"
                                                                    : result.confidence ===
                                                                      "MEDIUM"
                                                                    ? "bg-blue-200 text-blue-900"
                                                                    : result.confidence ===
                                                                      "LOW"
                                                                    ? "bg-yellow-200 text-yellow-900"
                                                                    : "bg-gray-200 text-gray-900"
                                                            }`}
                                                        >
                                                            {result.confidence}
                                                        </span>
                                                    </div>

                                                    {result.detection_score !==
                                                        undefined && (
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-medium">
                                                                Detection Score:
                                                            </span>
                                                            <span className="font-mono">
                                                                {result.detection_score.toFixed(
                                                                    2
                                                                )}{" "}
                                                                / 10.00
                                                            </span>
                                                        </div>
                                                    )}

                                                    {result.channels_detected !==
                                                        undefined && (
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-medium">
                                                                Channels
                                                                Detected:
                                                            </span>
                                                            <span className="font-mono">
                                                                {
                                                                    result.channels_detected
                                                                }{" "}
                                                                / 3 RGB
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Visual Score Bar */}
                                                    {result.detection_score !==
                                                        undefined && (
                                                        <div className="mt-2">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="font-medium">
                                                                    Score
                                                                    Visualization:
                                                                </span>
                                                                <span className="text-xs text-gray-600">
                                                                    {result.hasWatermark
                                                                        ? "Above Threshold ✓"
                                                                        : "Below Threshold ✗"}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
                                                                {/* Threshold line */}
                                                                <div className="absolute left-[30%] top-0 bottom-0 w-0.5 bg-red-500 z-10"></div>
                                                                {/* Score bar */}
                                                                <div
                                                                    className={`h-3 rounded-full transition-all ${
                                                                        result.hasWatermark
                                                                            ? "bg-green-600"
                                                                            : "bg-yellow-600"
                                                                    }`}
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            (result.detection_score /
                                                                                10) *
                                                                                100,
                                                                            100
                                                                        )}%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <div className="flex justify-between text-xs mt-1 text-gray-500">
                                                                <span>0</span>
                                                                <span className="text-red-600 font-medium">
                                                                    ↑ Threshold
                                                                    (3.0)
                                                                </span>
                                                                <span>10</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Extracted Watermark Data */}
                                            {result.watermark_type &&
                                                result.watermark_data && (
                                                    <div className="mt-4 pt-4 border-t border-green-300">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="font-medium">
                                                                    Watermark
                                                                    Type:
                                                                </span>
                                                                <span className="px-2 py-1 rounded font-semibold bg-purple-100 text-purple-900">
                                                                    🖼️ Image
                                                                    Watermark
                                                                </span>
                                                            </div>

                                                            <div className="text-xs">
                                                                <span className="font-medium block mb-1">
                                                                    Watermark
                                                                    Content:
                                                                </span>
                                                                <div className="bg-white bg-opacity-70 p-3 rounded border border-green-300">
                                                                    {result.watermark_type ===
                                                                    "text" ? (
                                                                        <p className="font-mono text-sm text-green-900 break-all">
                                                                            "
                                                                            {
                                                                                result.watermark_data
                                                                            }
                                                                            "
                                                                        </p>
                                                                    ) : (
                                                                        <p className="text-sm text-purple-900 italic">
                                                                            {
                                                                                result.watermark_data
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
