import React from 'react'
import VolunteerRequests from './VolunteerRequests'

const DashboardDefault = () => {
  return (
    <div>
    <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-gray-600">Profit this week</h4>
        <div className="mt-4 bg-gray-100"> <VolunteerRequests /></div>
    </div>
</div>
  )
}

export default DashboardDefault