import { useMemo } from 'react';

/**
 * @param {Array}  seats          - Danh sách ghế từ DB
 * @param {Array}  selectedSeats  - Ghế người dùng hiện tại đang chọn
 * @param {Set}    heldByOthers   - Set<seatCode> ghế đang bị người khác giữ (realtime)
 * @param {Function} onSeatSelect - Callback khi click ghế
 */
export default function SeatSelection({ seats, selectedSeats, heldByOthers = new Set(), onSeatSelect }) {
    const rows = useMemo(() => {
        const grouped = {};
        seats.forEach(seat => {
            if (!grouped[seat.row]) grouped[seat.row] = [];
            grouped[seat.row].push(seat);
        });
        const sortedRows = Object.keys(grouped).sort();
        sortedRows.forEach(row => grouped[row].sort((a, b) => a.number - b.number));
        return { sortedRows, grouped };
    }, [seats]);

    const handleSeatClick = (seat) => {
        const seatCode = `${seat.row}${seat.number}`;
        if (seat.status !== 'Available') return;
        if (heldByOthers.has(seatCode)) return;
        onSeatSelect(seatCode, seat.type);
    };

    const getSeatStyle = (seat, isSelected) => {
        const seatCode = `${seat.row}${seat.number}`;
        const isHeldByOther = heldByOthers.has(seatCode);

        // Đã bán (DB)
        if (seat.status !== 'Available') {
            return {
                cls: 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed opacity-60',
                label: '✗',
                title: 'Ghế đã được đặt',
            };
        }
        // Đang bị người khác giữ (realtime)
        if (isHeldByOther) {
            return {
                cls: 'bg-orange-900/50 text-orange-400 border-orange-600/60 cursor-not-allowed animate-pulse',
                label: seat.number,
                title: 'Ghế đang được người khác chọn',
            };
        }
        // Đang chọn bởi mình
        if (isSelected) {
            return {
                cls: 'bg-[#E50914] text-white border-[#E50914] shadow-[0_0_12px_rgba(229,9,20,0.6)] scale-110',
                label: seat.number,
                title: 'Đang chọn',
            };
        }
        // VIP
        if (seat.type === 'VIP') {
            return {
                cls: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50 hover:border-yellow-400 hover:bg-yellow-900/60',
                label: seat.number,
                title: `${seatCode} — VIP`,
            };
        }
        // Bình thường
        return {
            cls: 'bg-gray-800 text-gray-300 border-gray-600 hover:border-white hover:bg-gray-700',
            label: seat.number,
            title: `${seatCode} — Thường`,
        };
    };

    return (
        <div className="flex flex-col items-center py-6">
            {/* Màn hình */}
            <div className="w-full max-w-3xl mb-16 flex flex-col items-center">
                <div className="w-full h-2 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full shadow-[0_10px_20px_rgba(255,255,255,0.1)]" />
                <div className="w-[80%] h-12 bg-gradient-to-b from-white/10 to-transparent rounded-b-[50%] blur-[2px] mt-1 text-center">
                    <span className="text-gray-500 text-xs tracking-[0.5em] uppercase">Màn hình</span>
                </div>
            </div>

            {/* Sơ đồ ghế */}
            <div className="flex flex-col gap-4 mb-10 overflow-x-auto w-full max-w-full pb-4 items-center">
                {rows.sortedRows.map(row => (
                    <div key={row} className="flex gap-4 items-center min-w-max">
                        <div className="w-6 text-center font-bold text-gray-500 text-sm">{row}</div>
                        <div className="flex gap-2">
                            {rows.grouped[row].map(seat => {
                                const seatCode = `${seat.row}${seat.number}`;
                                const isSelected = selectedSeats.includes(seatCode);
                                const style = getSeatStyle(seat, isSelected);

                                return (
                                    <button
                                        key={seatCode}
                                        onClick={() => handleSeatClick(seat)}
                                        disabled={seat.status !== 'Available' || heldByOthers.has(seatCode)}
                                        className={`h-10 w-10 flex items-center justify-center rounded-t-lg rounded-b-sm border transition-all duration-200 ${style.cls}`}
                                        title={style.title}
                                    >
                                        <span className="text-xs font-semibold select-none">{style.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="w-6 text-center font-bold text-gray-500 text-sm">{row}</div>
                    </div>
                ))}
            </div>

            {/* Chú giải */}
            <div className="flex flex-wrap justify-center gap-5 mt-4 p-4 rounded-xl bg-black/40 border border-white/5">
                <LegendItem color="bg-gray-800 border-gray-600" label="Thường" />
                <LegendItem color="bg-yellow-900/40 border-yellow-700/50" label="VIP" />
                <LegendItem color="bg-[#E50914] border-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.5)]" label="Đang chọn" />
                <LegendItem color="bg-orange-900/50 border-orange-600/60" label="Người khác đang chọn" pulse />
                <LegendItem color="bg-gray-800 border-gray-700 opacity-50" label="Đã bán" />
            </div>
        </div>
    );
}

function LegendItem({ color, label, pulse }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-t-md rounded-b-sm border ${color} ${pulse ? 'animate-pulse' : ''}`} />
            <span className="text-sm text-gray-400">{label}</span>
        </div>
    );
}
