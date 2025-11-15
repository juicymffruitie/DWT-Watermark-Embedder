import { Link } from "@inertiajs/react";

export default function Navigation({ current = "upload" }) {
    const navItems = [
        { name: "Upload Image", href: "/", key: "upload" },
        { name: "Verify Image", href: "/verify", key: "verify" },
        { name: "DWT Visualizer", href: "/visualize", key: "visualize" },
    ];

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-semibold text-gray-900">
                                DWT Watermark
                            </h1>
                        </div>
                        <div className="flex space-x-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        current === item.key
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
