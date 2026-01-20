import { forwardRef } from 'react';
import { PointCloud } from '../PointCloud';

interface ScanStageProps {
  pointCloudRef: React.RefObject<SVGSVGElement | null>;
}

export const ScanStage = forwardRef<HTMLDivElement, ScanStageProps>(
  ({ pointCloudRef }, ref) => {
    return (
      <div ref={ref} className="absolute inset-0">
        {/* LiDAR scanning beam */}
        <div
          className="scan-beam absolute left-0 right-0 h-[3px] z-10"
          style={{
            top: '0%',
            background: 'linear-gradient(90deg, transparent 0%, #C88D74 30%, #CFFF04 50%, #C88D74 70%, transparent 100%)',
            boxShadow: '0 0 20px 4px rgba(207, 255, 4, 0.4), 0 0 40px 8px rgba(200, 141, 116, 0.3)',
            filter: 'blur(0.5px)',
          }}
        />

        {/* Beam trail effect */}
        <div
          className="scan-beam-trail absolute left-0 right-0 h-[60px] z-5 pointer-events-none"
          style={{
            top: '0%',
            background: 'linear-gradient(180deg, rgba(200, 141, 116, 0.15) 0%, transparent 100%)',
            transform: 'translateY(-100%)',
          }}
        />

        {/* Point cloud SVG */}
        <PointCloud ref={pointCloudRef} />

        {/* Scan progress indicator */}
        <div className="scan-progress absolute bottom-3 left-3 flex items-center gap-2 opacity-0">
          <div className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse" />
          <span className="text-[10px] font-body uppercase tracking-wider text-signal/80">
            Scanning...
          </span>
        </div>
      </div>
    );
  }
);

ScanStage.displayName = 'ScanStage';
