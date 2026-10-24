"use client";
import { useEffect } from "react";
import JsBarcode from "jsbarcode";
import { router } from "@inertiajs/react";

export default function PrintBarcodes({ barcodes }) {
    useEffect(() => {
        barcodes.forEach((b, i) => {
            const svg = document.getElementById(`barcode_${i}`);
            if (svg) {
                JsBarcode(svg, b.barcode, {
                    format: "CODE128",
                    width: 1.2,
                    height: 50,
                    displayValue: true,
                    fontSize: 12,
                    margin: 0,
                });
            }
        });

        setTimeout(() => {
            window.print();
        }, 500);
    }, [barcodes]);

    return (
        <div className="p-4">

            {/* BACK BUTTON - hidden when printing */}
            <div className="mb-4 print:hidden">
                <button
                    onClick={() => router.get(route("barcode.index"))}
                    className="px-4 py-2 bg-gray-800 text-white rounded shadow hover:bg-gray-700"
                >
                    ← Back to Barcodes
                </button>
            </div>

            {/* Barcode Grid */}
            <div className="grid grid-cols-3 gap-4">
                {barcodes.map((b, i) => (
                    <div
                        key={i}
                        className="border p-3 text-center rounded shadow-sm"
                        style={{ maxWidth: "100%" }}
                    >
                        <h2 className="font-semibold text-xs mb-2">{b.product_name}</h2>

                        <div className="w-full flex justify-center">
                            <svg
                                id={`barcode_${i}`}
                                style={{ width: "100%", height: "auto", maxWidth: "180px" }}
                            ></svg>
                        </div>

                        <p className="text-[10px] mt-1">{b.barcode}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
