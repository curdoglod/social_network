const Sidebar = ({ user, onLogout, onProfileClick, onBack }) => {
  if (!user) return null;
  const initial = user.username ? user.username.charAt(0).toUpperCase() : 'U';
  return (
    <div className="bg-white border-r h-screen p-4 md:p-6 flex flex-col fixed left-0 top-0 transition-all duration-200 w-16 md:w-64">
      {/* Back button when in profile view */}
      {onBack && (
        <button onClick={onBack} className="flex items-center text-blue-600 hover:text-blue-800 mb-4 focus:outline-none">
          <span className="text-2xl leading-none mr-0 md:mr-2">←</span>
          <span className="hidden md:inline text-sm font-medium">Back</span>
        </button>
      )}

      <div className="flex items-center justify-between cursor-pointer" onClick={onProfileClick}>
        <div className="flex items-center space-x-0 md:space-x-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white text-lg font-semibold">
              {initial}
            </div>
          )}
          <div className="hidden md:block">
            <div className="flex items-center space-x-2">
              <p className="font-medium text-gray-800 break-all">{user.username}</p>
              {user.is_superuser && <span className="bg-red-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded">Admin</span>}
            </div>
            {user.email && <p className="text-sm text-gray-500 break-all">{user.email}</p>}
          </div>
        </div>
      </div>

      {/* Stand-alone Logout button */}
      <button onClick={onLogout} className="mt-6 flex items-center space-x-2 text-red-600 hover:text-red-800 focus:outline-none hidden md:flex">
        <span>Logout</span>
      </button>
    </div>
  );
}; 