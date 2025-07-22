
const PostsSection = ({ user, onProfileClick, onOpenPost }) => {
  const [posts, setPosts] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [sortBy, setSortBy] = React.useState('time');

  
  const fetchPosts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const fetchedPosts = await getPosts();
      setPosts(sortPosts(fetchedPosts, sortBy));
    } catch (err) {
      setError(err.message || 'Failed to load posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPosts();
  }, []);

  
  const handlePostCreated = (newPost) => {
    setPosts(prevPosts => sortPosts([newPost, ...prevPosts], sortBy));
  };

  const handlePostDeleted = (deletedId) => {
    setPosts(prev => prev.filter((p) => p.id !== deletedId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts(prev => prev.map(p => (p.id === updatedPost.id ? updatedPost : p)));
  };

  React.useEffect(() => {
    setPosts(prev => sortPosts(prev, sortBy));
  }, [sortBy]);

  const sortPosts = (postsArray, criterion) => {
    const arr = [...postsArray];
    switch (criterion) {
      case 'likes':
        return arr.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      case 'comments':
        return arr.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
      case 'time':
      default:
        return arr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* New post */}
      <PostForm onPostCreated={handlePostCreated} />

      {/* Sort */}
      <div className="flex justify-end items-center mb-4 space-x-2">
        <label htmlFor="sortPosts" className="text-sm text-gray-600">Sort by:</label>
        <select id="sortPosts" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-300 text-sm rounded p-1">
          <option value="time">Newest</option>
          <option value="likes">Most liked</option>
          <option value="comments">Most commented</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading posts...</p>
        </div>
      )}
      
      {/* Error */}
      {error && !isLoading && (
         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <p className="font-bold">Oops! Something went wrong.</p>
          <p>{error}</p>
           {/* Retry */}
          <button 
            onClick={fetchPosts}
            className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* List / Empty */}
      {!isLoading && !error && (
        posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostItem key={post.id} post={post} user={user} onPostDeleted={handlePostDeleted} onPostUpdated={handlePostUpdated} onProfileClick={onProfileClick} onOpenPost={onOpenPost} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">No posts yet.</p>
            <p className="text-gray-400 mt-1">Be the first to share something with the community!</p>
          </div>
        )
      )}
    </div>
  );
};
