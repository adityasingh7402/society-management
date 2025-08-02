import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';

/**
 * Custom hook for role-based access control
 * @param {Array} allowedRoles - Array of roles that are allowed to access the component
 * @param {string} redirectPath - Path to redirect if access is denied (default: '/unauthorized')
 * @returns {Object} - { isAuthorized, loading, userRole }
 */
const useRoleAccess = (allowedRoles = [], redirectPath = '/unauthorized') => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem('Resident');
        
        if (!token) {
          router.push('/login');
          return;
        }

        // Decode the JWT token to get user information
        const decoded = jwt.decode(token);
        
        if (!decoded) {
          localStorage.removeItem('Resident');
          router.push('/login');
          return;
        }

        const { role } = decoded;
        setUserRole(role);

        // Check if user has access based on role
        const hasAccess = checkRoleAccess(role, allowedRoles);
        
        if (hasAccess) {
          setIsAuthorized(true);
        } else {
          // Redirect to unauthorized page or show access denied
          console.log('Access denied for user:', { role, allowedRoles });
          router.push(redirectPath);
        }
      } catch (error) {
        console.error('Error checking role access:', error);
        localStorage.removeItem('Resident');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [allowedRoles, redirectPath, router]);

  return { isAuthorized, loading, userRole };
};

/**
 * Helper function to check if user has access based on role
 * @param {string} role - User's role (resident, tenant, family_member, etc.)
 * @param {Array} allowedRoles - Array of allowed roles
 * @returns {boolean} - Whether user has access
 */
const checkRoleAccess = (role, allowedRoles) => {
  if (allowedRoles.length === 0) return true; // No restrictions

  return allowedRoles.some(allowedRule => {
    if (typeof allowedRule === 'string') {
      // Simple role check
      return role === allowedRule;
    } else if (typeof allowedRule === 'object') {
      // Complex rule check (if needed for future use)
      const { roles, condition } = allowedRule;
      
      if (condition === 'AND') {
        return roles && roles.includes(role);
      } else {
        // Default OR condition
        return roles && roles.includes(role);
      }
    }
    return false;
  });
};

export default useRoleAccess;
