const PostPage = ({ postId, currentUser, onBackToFeed, onProfileClick }) => {
  const [post, setPost] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const fetchPost = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await window.API.getPost(postId);
      setPost(data);
    } catch (err) {
      setError(err.message || 'Failed to load post.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  React.useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handlePostDeleted = () => {
    if (onBackToFeed) onBackToFeed();
  };

  if (loading) return (
    <div className="text-center py-10">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-2 text-gray-600">Loading post...</p>
    </div>
  );
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
      {error}
    </div>
  );
  if (!post) return null;

  return (
    <PostItem
      post={post}
      user={currentUser}
      onPostDeleted={handlePostDeleted}
      onPostUpdated={setPost}
      onProfileClick={onProfileClick}
    />
  );
}; 