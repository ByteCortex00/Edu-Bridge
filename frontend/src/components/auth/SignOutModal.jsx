import { useClerk } from '@clerk/clerk-react';

export function SignOutModal({ isOpen, onClose, user }) {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
      // Redirect will happen automatically
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sign Out
        </h3>

        <p className="text-gray-600 mb-6">
          Are you sure you want to sign out of your account?
        </p>

        {user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              {user.profileImage && (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div className="font-medium text-gray-900">
                  {user.name || 'User'}
                </div>
                <div className="text-sm text-gray-500 capitalize">
                  {user.role || 'viewer'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSignOut}
            className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}