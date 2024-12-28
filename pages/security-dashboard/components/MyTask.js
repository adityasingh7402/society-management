import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch volunteer profile and tasks
  useEffect(() => {
    const fetchProfileAndTasks = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('volunteerToken');

        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch volunteer profile to get volunteer ID
        const response = await fetch('/api/volunteerProfile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        const volunteerId = data._id; // Assuming the API returns volunteer's _id field
        await fetchTasks(volunteerId); // Call fetch tasks with volunteerId
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (error.message === 'Failed to fetch profile') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchTasks = async (volunteerId) => {
      try {
        const response = await fetch(`/api/getTasksByVolunteer?volunteerId=${volunteerId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const tasksData = await response.json();
        setTasks(tasksData);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchProfileAndTasks();
  }, [router]);

  // Handle Mark Complete button click
  const handleCompleteTask = async (taskId) => {
    try {
      const response = await fetch('/api/updateTaskStatus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,   // The task ID
          status: 'Completed',   // New status to mark the task as completed
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the task status in the frontend state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === taskId ? { ...task, status: 'Completed' } : task
          )
        );
      } else {
        throw new Error(data.message || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error marking task as complete:', error);
    }
  };

  return (
    <div>
      <h1>My Tasks</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li key={task._id} className="bg-white shadow-md rounded-lg p-4 flex flex-col space-y-3">
                {/* Task Title */}
                <h3 className="text-xl font-semibold text-gray-800">{task.taskTitle}</h3>

                {/* Task Description */}
                <p className="text-gray-600">{task.taskDescription}</p>

                {/* Task End Date */}
                <p className="text-sm text-gray-500">Ends on: {new Date(task.taskEndDate).toLocaleDateString()}</p>

                {/* Task Status */}
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${task.status === 'Completed' ? 'bg-green-500 text-white' : 'bg-yellow-600 text-white rounded-lg shadow-md hover:bg-yellow-700 focus:outline-none focus:ring-2'
                      }`}
                  >
                    {task.status}
                  </span>

                  {/* Button to complete the task */}
                  {task.status !== 'Completed' && (
                    <button
                      onClick={() => handleCompleteTask(task._id)}
                      className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Mark as Complete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
