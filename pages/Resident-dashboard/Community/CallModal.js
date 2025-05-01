import React from 'react';
import { Mic, MicOff, Phone } from 'lucide-react';

export default function CallModal({
  callWith,
  callDuration,
  isMuted,
  onToggleMute,
  onEndCall,
  localStreamRef,
  remoteStreamRef
}) {
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Call with {callWith.name}</h3>
          <p className="text-gray-600 mb-4">Duration: {formatCallDuration(callDuration)}</p>
          <div className="aspect-video bg-gray-200 mb-4 rounded-lg overflow-hidden relative">
            {/* Remote video */}
            <video
              ref={remoteStreamRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local video (picture-in-picture) */}
            <div className="absolute bottom-2 right-2 w-1/4 h-1/4 bg-gray-800 rounded overflow-hidden">
              <video
                ref={(video) => {
                  if (video && localStreamRef.current) {
                    video.srcObject = localStreamRef.current;
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={onToggleMute}
              className={`p-4 rounded-full ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </button>
            <button
              onClick={onEndCall}
              className="p-4 bg-red-600 text-white rounded-full"
            >
              <Phone className="transform rotate-135" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 