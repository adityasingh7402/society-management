import { Shield, Lock } from "lucide-react";

export default function AccessDenied({ feature = "this feature" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80%] p-8">
      <div className="relative mb-6">
        {/* Animated background circle */}
        <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
        
        {/* Main icon container */}
        <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-full p-6 shadow-lg">
          <div className="relative">
            {/* Shield icon with rotation animation */}
            <Shield 
              className="w-12 h-12 text-white animate-pulse" 
              strokeWidth={2}
            />
            
            {/* Lock icon overlay with bounce animation */}
            <div className="absolute -bottom-2 -right-2 bg-red-700 rounded-full p-2 animate-bounce">
              <Lock className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Access Restricted
        </h2>
        
        <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-6 mb-6">
          <p className="text-red-700 font-semibold text-lg mb-2">
            You do not have permission to view {feature}
          </p>
          <p className="text-red-600 text-sm">
            Please contact your administrator to request access to this resource.
          </p>
        </div>

      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-red-300 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute top-20 right-16 w-3 h-3 bg-red-400 rounded-full animate-pulse opacity-40 animation-delay-1000"></div>
      <div className="absolute bottom-16 left-20 w-1 h-1 bg-red-500 rounded-full animate-pulse opacity-50 animation-delay-500"></div>
    </div>
  );
}