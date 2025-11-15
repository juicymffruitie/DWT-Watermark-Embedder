import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";
import Navigation from "../Components/Navigation";

export default function DWTVisualizer({ flash }) {
    const { data, setData, post, progress, errors, processing, reset } =
        useForm({
            image: null,
        });

    const [preview, setPreview] = useState(null);
    const [dwtResult, setDwtResult] = useState(null);
    const [loading, setLoading] = useState(false);

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

            // Reset previous results
            setDwtResult(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        post("/visualize", {
            forceFormData: true,
            onSuccess: (response) => {
                // The response will contain the DWT decomposition images
                setDwtResult(response.props.result);
                setLoading(false);
            },
            onError: (errors) => {
                console.error("Visualization errors:", errors);
                setLoading(false);
            },
        });
    };

    const handleReset = () => {
        reset();
        setPreview(null);
        setDwtResult(null);
        document.getElementById("image-upload").value = "";
    };

    return (
        <>
            <Head title="DWT Visualizer - DWT Watermark" />

            <div className="min-h-screen bg-gray-50">
                <Navigation current="visualize" />

                {/* Header */}
                <header className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            DWT Decomposition Visualizer
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Upload an image to visualize its 4 DWT sub-levels:
                            LL (Approximation), LH (Horizontal), HL (Vertical),
                            and HH (Diagonal)
                        </p>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Upload Form */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Upload Image
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
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
                                    {errors.image && (
                                        <p className="mt-1 text-red-600 text-sm">
                                            {errors.image}
                                        </p>
                                    )}
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={
                                            !data.image || processing || loading
                                        }
                                        className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading
                                            ? "Analyzing..."
                                            : "Visualize DWT Decomposition"}
                                    </button>
                                    {(preview || dwtResult) && (
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="px-4 py-2.5 bg-gray-200 text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* DWT Visualization Results */}
                        {dwtResult && (
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">
                                    DWT Decomposition Results
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* LL - Approximation */}
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                            <span className="bg-blue-100 text-blue-900 px-2 py-1 rounded text-xs mr-2">
                                                LL
                                            </span>
                                            Approximation (Low-Low)
                                        </h3>
                                        <p className="text-xs text-gray-600 mb-3">
                                            Contains the coarse-scale
                                            information (smoothed version of the
                                            image)
                                        </p>
                                        <div className="bg-gray-50 rounded border border-gray-200 p-2">
                                            <img
                                                src={`data:image/png;base64,${dwtResult.ll_base64}`}
                                                alt="LL - Approximation"
                                                className="w-full h-auto"
                                            />
                                        </div>
                                    </div>

                                    {/* LH - Horizontal */}
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                            <span className="bg-green-100 text-green-900 px-2 py-1 rounded text-xs mr-2">
                                                LH
                                            </span>
                                            Horizontal Details (Low-High)
                                        </h3>
                                        <p className="text-xs text-gray-600 mb-3">
                                            Captures horizontal edges and
                                            details (changes in horizontal
                                            direction)
                                        </p>
                                        <div className="bg-gray-50 rounded border border-gray-200 p-2">
                                            <img
                                                src={`data:image/png;base64,${dwtResult.lh_base64}`}
                                                alt="LH - Horizontal"
                                                className="w-full h-auto"
                                            />
                                        </div>
                                    </div>

                                    {/* HL - Vertical */}
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                            <span className="bg-yellow-100 text-yellow-900 px-2 py-1 rounded text-xs mr-2">
                                                HL
                                            </span>
                                            Vertical Details (High-Low)
                                        </h3>
                                        <p className="text-xs text-gray-600 mb-3">
                                            Captures vertical edges and details
                                            (changes in vertical direction)
                                        </p>
                                        <div className="bg-gray-50 rounded border border-gray-200 p-2">
                                            <img
                                                src={`data:image/png;base64,${dwtResult.hl_base64}`}
                                                alt="HL - Vertical"
                                                className="w-full h-auto"
                                            />
                                        </div>
                                    </div>

                                    {/* HH - Diagonal */}
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                            <span className="bg-red-100 text-red-900 px-2 py-1 rounded text-xs mr-2">
                                                HH
                                            </span>
                                            Diagonal Details (High-High)
                                        </h3>
                                        <p className="text-xs text-gray-600 mb-3">
                                            Captures diagonal edges and details
                                            (changes in both directions)
                                        </p>
                                        <div className="bg-gray-50 rounded border border-gray-200 p-2">
                                            <img
                                                src={`data:image/png;base64,${dwtResult.hh_base64}`}
                                                alt="HH - Diagonal"
                                                className="w-full h-auto"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Information Box */}
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                                        ℹ️ About DWT Decomposition
                                    </h4>
                                    <p className="text-xs text-blue-800">
                                        The Discrete Wavelet Transform (DWT)
                                        decomposes an image into 4 sub-bands.
                                        The <strong>LL</strong> sub-band
                                        contains the low-frequency approximation
                                        (the most important information). The{" "}
                                        <strong>LH</strong>, <strong>HL</strong>
                                        , and <strong>HH</strong> sub-bands
                                        contain high-frequency details
                                        (horizontal, vertical, and diagonal
                                        edges). Watermarks are typically
                                        embedded in these detail sub-bands to
                                        remain imperceptible.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && !dwtResult && (
                            <div className="bg-white border border-gray-200 rounded-lg p-12">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                                    <p className="text-gray-600">
                                        Analyzing image and generating DWT
                                        decomposition...
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
