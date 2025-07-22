/* User profile page */
const Profile = ({ profileUser, currentUser, onProfileClick, onOpenPost }) => {
  const [posts, setPosts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [sortBy, setSortBy] = React.useState('time');

  const sortPosts = (arr, criterion) => {
    const copy = [...arr];
    switch (criterion) {
      case 'likes':
        return copy.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      case 'comments':
        return copy.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
      case 'time':
      default:
        return copy.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  };

  const fetchUserPosts = async () => {
    if (!profileUser) return;
    setLoading(true);
    setError('');
    try {
      const fetched = await window.API.getUserPosts(profileUser.id || profileUser.user_id);
      setPosts(sortPosts(fetched, sortBy));
    } catch (err) {
      setError(err.message || 'Failed to load your posts.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUserPosts();
  }, [profileUser?.id, profileUser?.user_id, sortBy]);

  const initial = profileUser.username ? profileUser.username.charAt(0).toUpperCase() : 'U';

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
      {/* Head */}
      <div className="flex items-center mb-6">
        {/* Avatar container */}
        <div className="relative mr-4 group">
          {profileUser.avatar_url ? (
            <img src={profileUser.avatar_url} alt="Avatar" className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-300 flex items-center justify-center text-3xl text-white font-semibold">
              {initial}
            </div>
          )}

          {/* Avatar upload */}
          {profileUser.id === currentUser.id && (
            <>
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h2l2-3h10l2 3h2a1 1 0 011 1v11a2 2 0 01-2 2H4a2 2 0 01-2-2V8a1 1 0 011-1z" />
                  <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>{
                const file = e.target.files[0];
                if (!file) return;
                window.API.updateAvatar(file)
                  .then((updated)=> {
                    try {
                      const updateStore = (storage) => {
                        const stored = storage.getItem('currentUser');
                        if (stored) {
                          const userObj = JSON.parse(stored);
                          userObj.avatar_url = updated.avatar_url;
                          storage.setItem('currentUser', JSON.stringify(userObj));
                        }
                      };
                      updateStore(sessionStorage);
                      updateStore(localStorage);
                    } catch(e){}
                    window.location.reload();
                  })
                  .catch(err=> alert(err.message || 'Failed to update avatar'));
              }} />
            </>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>{profileUser.username}</span>
            {profileUser.is_superuser && (
              <span className="bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">Admin</span>
            )}
          </h2>
          {profileUser.email && <p className="text-gray-600 break-all">{profileUser.email}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <p className="text-gray-700">Total posts: {posts.length}</p>
      </div>

      {/* Posts */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Posts</h3>
        <div className="flex items-center space-x-2">
          <label htmlFor="sortProfilePosts" className="text-sm text-gray-600">Sort by:</label>
          <select id="sortProfilePosts" value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="border border-gray-300 text-sm rounded p-1">
            <option value="time">Newest</option>
            <option value="likes">Most liked</option>
            <option value="comments">Most commented</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading posts...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map(p => (
              <PostItem 
                key={p.id} 
                post={p} 
                user={currentUser} 
                onPostDeleted={(deletedId) => setPosts(prev => prev.filter(pp => pp.id !== deletedId))}
                onPostUpdated={(updated) => setPosts(prev => prev.map(pp => (pp.id === updated.id ? updated : pp)))}
                onProfileClick={onProfileClick} 
                onOpenPost={onOpenPost}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You have not posted anything yet.</p>
        )
      )}

      {/* back via sidebar */}
    </div>
  );
}; 