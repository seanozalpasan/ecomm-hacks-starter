"use client"
export function SearchLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center overflow-hidden">
      {/* Main Loader Content */}
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Square 1 - Red */}
        <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
          <div 
            className="w-48 h-48 border-8"
            style={{
              borderColor: '#DC2626',
              filter: 'drop-shadow(0 0 10px #DC2626)',
              borderRadius: '8px'
            }}
          />
        </div>

        {/* Square 2 - White (with shadow for visibility) */}
        <div className="absolute inset-0 flex items-center justify-center animate-spin-medium">
          <div 
            className="w-48 h-48 border-8"
            style={{
              borderColor: '#FFFFFF',
              filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.3))',
              borderRadius: '8px'
            }}
          />
        </div>

        {/* Square 3 - Green */}
        <div className="absolute inset-0 flex items-center justify-center animate-spin-fast">
          <div 
            className="w-48 h-48 border-8"
            style={{
              borderColor: '#16A34A',
              filter: 'drop-shadow(0 0 10px #16A34A)',
              borderRadius: '8px'
            }}
          />
        </div>

        {/* Center Square - Candy Cane Pattern */}
        <div className="absolute inset-0 flex items-center justify-center animate-spin-center">
          <div 
            className="w-32 h-32 candy-cane"
            style={{ 
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-medium {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
        @keyframes spin-fast {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-center {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        .animate-spin-medium {
          animation: spin-medium 3s linear infinite;
        }
        .animate-spin-fast {
          animation: spin-fast 2s linear infinite;
        }
        .animate-spin-center {
          animation: spin-center 5s linear infinite;
        }
        .candy-cane {
          background: repeating-linear-gradient(
            45deg,
            #DC2626,
            #DC2626 20px,
            #FFFFFF 20px,
            #FFFFFF 40px
          );
        }
      `}</style>
    </div>
  );
}