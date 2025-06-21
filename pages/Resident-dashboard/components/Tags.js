import React from 'react';
import { useRouter } from 'next/router';
import { Car, Dog, Key, UserCog, ArrowLeft } from 'lucide-react';

const Tags = () => {
  const router = useRouter();

  const tagOptions = [
    {
      id: 'vehicle',
      title: 'Vehicle Tag',
      description: 'Manage vehicle access passes',
      icon: Car,
      route: '/VehicleTagRequest',
      color: 'blue'
    },
    {
      id: 'animal',
      title: 'Animal Tag',
      description: 'Register and manage pet tags',
      icon: Dog,
      route: '/AnimalTagRequest',
      color: 'green'
    },
    {
      id: 'gate',
      title: 'Gate Pass Tag',
      description: 'Generate gate passes for visitors',
      icon: Key,
      route: '/GuestPassRequest',
      color: 'purple'
    },
    {
      id: 'service',
      title: 'Service Personnel Tag',
      description: 'Manage service staff access',
      icon: UserCog,
      route: '/ServicePersonnelRequest',
      color: 'orange'
    }
  ];

  const handleTagClick = (route) => {
    router.push(`/Resident-dashboard/components${route}`);
  };

  const goBack = () => {
    router.back();
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      green: 'bg-green-100 text-green-600 hover:bg-green-200',
      purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
      orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="p-4 md:p-6">
        <button
          onClick={goBack}
          className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-base">Back</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl md:text-3xl text-center font-bold text-blue-600 mb-6">Access Tags</h1>
        <div className="grid grid-cols-2 gap-6">
          {tagOptions.map((tag) => {
            const IconComponent = tag.icon;
            const colorClasses = getColorClasses(tag.color);
            return (
              <button
                key={tag.id}
                onClick={() => handleTagClick(tag.route)}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 group"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${colorClasses}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors font-sans">
                      {tag.title}
                    </h3>
                    <p className="text-gray-600 mt-1 text-sm font-sans">
                      {tag.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Tags; 