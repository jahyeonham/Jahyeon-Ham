import React from 'react';
import { Target, RotateCcw } from 'lucide-react';

interface ThumbnailFocalPickerProps {
  imageUrl: string;
  position: string; // e.g. "50% 50%"
  onChange: (newPosition: string) => void;
}

const PRESETS = [
  { label: '↖ 상단 좌측', pos: '15% 15%' },
  { label: '↑ 상단 중앙', pos: '50% 15%' },
  { label: '↗ 상단 우측', pos: '85% 15%' },
  { label: '← 중앙 좌측', pos: '15% 50%' },
  { label: '• 정중앙 (기본)', pos: '50% 50%' },
  { label: '→ 중앙 우측', pos: '85% 50%' },
  { label: '↙ 하단 좌측', pos: '15% 85%' },
  { label: '↓ 하단 중앙', pos: '50% 85%' },
  { label: '↘ 하단 우측', pos: '85% 85%' },
];

export const ThumbnailFocalPicker: React.FC<ThumbnailFocalPickerProps> = ({
  imageUrl,
  position,
  onChange,
}) => {
  // Parse x, y percentage
  const parsePos = (posStr: string): [number, number] => {
    if (!posStr) return [50, 50];
    const parts = posStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      return [isNaN(x) ? 50 : x, isNaN(y) ? 50 : y];
    }
    return [50, 50];
  };

  const [xVal, yVal] = parsePos(position);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    onChange(`${clampedX}% ${clampedY}%`);
  };

  return (
    <div className="bg-white border border-[#1A1A1A]/15 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-red-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
            썸네일 노출 위치 / 초점 설정 (Focal Point)
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#555] bg-[#F0F0EE] px-2 py-0.5">
          현재 위치: {xVal}% {yVal}%
        </span>
      </div>

      <p className="text-[11px] text-[#555] leading-relaxed">
        사진 비율이나 크기가 제각각이어도, 아래 <strong>원본 사진에서 보여주고 싶은 핵심 영역(얼굴, 프로그램 타이틀 등)</strong>을 마우스로 클릭하면 16:9 썸네일 박스에 맞춰 자동으로 중심이 고정됩니다.
      </p>

      {/* 2-Column: Left (Original Clickable) & Right (16:9 Live Preview) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Left: Clickable Original Image */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#1A1A1A]/70">
            <span>1. 원본 사진 (원하는 위치 클릭)</span>
            <span className="text-red-600 font-normal normal-case">클릭하여 초점 이동</span>
          </div>

          <div
            onClick={handleImageClick}
            className="relative w-full max-h-[220px] bg-[#1A1A1A]/10 border-2 border-dashed border-[#1A1A1A]/30 overflow-hidden cursor-crosshair group flex items-center justify-center select-none"
            title="보여주고 싶은 부분을 클릭하세요"
          >
            <img
              src={imageUrl}
              alt="Original preview for focal point"
              referrerPolicy="no-referrer"
              className="max-h-[220px] w-auto max-w-full object-contain pointer-events-none"
            />

            {/* Target Pin Marker */}
            <div
              className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white bg-red-600/80 shadow-lg flex items-center justify-center pointer-events-none transition-all duration-150"
              style={{ left: `${xVal}%`, top: `${yVal}%` }}
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-50" />
            </div>

            {/* Helper overlay on hover */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
              <span className="bg-black/80 text-white text-[10px] font-mono px-2 py-1 tracking-wider uppercase">
                클릭하여 초점 설정
              </span>
            </div>
          </div>
        </div>

        {/* Right: 16:9 Live Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#1A1A1A]/70">
            <span>2. 16:9 실시간 썸네일 미리보기</span>
            <span className="text-emerald-700 font-normal">포트폴리오 노출 결과</span>
          </div>

          <div className="relative aspect-video w-full bg-[#1A1A1A] border border-[#1A1A1A] overflow-hidden shadow-sm">
            <img
              src={imageUrl}
              alt="16:9 Cropped result"
              referrerPolicy="no-referrer"
              style={{ objectPosition: `${xVal}% ${yVal}%` }}
              className="w-full h-full object-cover transition-all duration-200"
            />
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 pointer-events-none">
              16:9 GRID VIEW
            </div>
          </div>
        </div>
      </div>

      {/* Preset Quick Buttons & Fine-tune Sliders */}
      <div className="pt-2 border-t border-[#1A1A1A]/10 space-y-3">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1.5">
            빠른 위치 선택 (9-Point Presets)
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
            {PRESETS.map((preset) => {
              const isActive = position === preset.pos;
              return (
                <button
                  key={preset.pos}
                  type="button"
                  onClick={() => onChange(preset.pos)}
                  className={`px-2 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-colors text-center cursor-pointer border ${
                    isActive
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'bg-[#F8F8F7] hover:bg-[#E5E5E3] text-[#1A1A1A] border-[#1A1A1A]/15'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders for precise control */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <div className="flex justify-between text-[10px] text-[#555] mb-1">
              <span>수평 위치 (가로 X)</span>
              <span className="font-mono">{xVal}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={xVal}
              onChange={(e) => onChange(`${e.target.value}% ${yVal}%`)}
              className="w-full accent-[#1A1A1A] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-[#555] mb-1">
              <span>수직 위치 (세로 Y)</span>
              <span className="font-mono">{yVal}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={yVal}
              onChange={(e) => onChange(`${xVal}% ${e.target.value}%`)}
              className="w-full accent-[#1A1A1A] cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onChange('50% 50%')}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#666] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>정중앙(50% 50%)으로 초기화</span>
          </button>
        </div>
      </div>
    </div>
  );
};
