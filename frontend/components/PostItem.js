
const PostItem = ({ post, user, onPostDeleted, onProfileClick, onOpenPost, onPostUpdated = () => {} }) => {
  const [comments, setComments] = React.useState([]);
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);
  const [commentError, setCommentError] = React.useState('');
  const [showComments, setShowComments] = React.useState(false);

  const [isLiked, setIsLiked] = React.useState(post.is_liked_by_current_user);
  const [likesCount, setLikesCount] = React.useState(post.likes_count);
  const [isLiking, setIsLiking] = React.useState(false); // To prevent multiple clicks

  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(post.content || '');

  React.useEffect(() => {
    setIsLiked(post.is_liked_by_current_user);
    setLikesCount(post.likes_count);
  }, [post.is_liked_by_current_user, post.likes_count]);

  
  const fetchComments = async () => {
    setIsLoadingComments(true);
    setCommentError('');
    try {
      const fetchedComments = await getComments(post.id);
      setComments(fetchedComments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))); 
    } catch (err) {
      setCommentError(err.message || 'Failed to load comments.');
    } finally {
      setIsLoadingComments(false);
    }
  };

  React.useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [post.id, showComments]);

  
  const handleCommentAdded = (newComment) => {
    setComments(prevComments => 
        [...prevComments, newComment]
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    );
  };

  
  const toggleCommentsVisibility = (e) => {
    e.stopPropagation();
    setShowComments(prevShow => !prevShow);
  };
  
  const handleToggleLike = async (e) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    try {
      const response = await toggleLikePost(post.id);
      setIsLiked(response.liked);
      setLikesCount(prevCount => response.liked ? prevCount + 1 : prevCount - 1);
    } catch (err) {
      console.error("Failed to toggle like:", err);
    } finally {
      setIsLiking(false);
    }
  };
  
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Date N/A';
    try {
        return new Date(dateString).toLocaleString(undefined, { 
            year: 'numeric', month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return "Invalid Date";
    }
  };

  const canModify = user && (user.username === post.author_username || user.is_superuser);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await window.API.deletePost(post.id);
      onPostDeleted && onPostDeleted(post.id);
    } catch (err) {
      alert(err.message || 'Failed to delete post.');
    }
  };

  const [menuOpen, setMenuOpen] = React.useState(false);
  const toggleMenu = () => setMenuOpen(prev => !prev);

  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (!onProfileClick) return;
    const id = post.author_id || (post.author ? post.author.id : null);
    if (!id) return;
    onProfileClick({
      id,
      username: post.author_username,
      is_superuser: post.author_is_superuser,
      avatar_url: post.author_avatar_url,
    });
  };

  const startEdit = () => {
    setEditedContent(post.content || '');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const saveEdit = async () => {
    try {
      const updated = await window.API.updatePost(post.id, { content: editedContent });
      onPostUpdated && onPostUpdated(updated);
      setIsEditing(false);
    } catch (err) {
      alert(err.message || 'Failed to update post');
    }
  };

  const rootClick = () => {
    if (onOpenPost) onOpenPost(post);
  };

  return (
    <div onClick={rootClick} className={`bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6 transition-shadow duration-300 hover:shadow-lg ${onOpenPost ? 'cursor-pointer' : ''}`}> 
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        {/* Avatar+name */}
        <button className="flex items-center focus:outline-none" onClick={handleProfileClick}> 
          {post.author_avatar_url ? (
            <img src={post.author_avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover mr-3" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold mr-3">
              {post.author_username ? post.author_username.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="text-left">
            <p className="font-medium">{post.author_username}</p>
            <p className="text-xs text-gray-500">{new Date(post.timestamp).toLocaleString()}</p>
          </div>
        </button>

        {/* Menu */}
        {canModify && (
          <div className="relative">
            <button onClick={(e)=>{e.stopPropagation(); toggleMenu();}} className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none">
              &#8942;
            </button>
            {menuOpen && (
              <>
                {/* Overlay */}
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-20">
                  <button onClick={startEdit} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Edit</button>
                  {canModify && (
                    <button onClick={handleDelete} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                      Delete
                    </button>
                  )}
        </div>
              </>
            )}
        </div>
        )}
      </div>

      {!isEditing && post.content && <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>}
      
      {isEditing && (
        <div className="mb-4">
          <textarea
            className="w-full border rounded p-2 focus:outline-none focus:ring"
            rows="4"
            value={editedContent}
            onChange={(e)=>setEditedContent(e.target.value)}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button onClick={cancelEdit} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button onClick={saveEdit} className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Save</button>
          </div>
        </div>
      )}
      
      {/* Image */}
      {post.image_file && (
        <div className="mb-4 rounded-lg overflow-hidden"> {}
          {/* Display the image. */}
          <img src={post.image_file} alt={`Post by ${post.author ? post.author.username : 'user'}`} className="w-full h-auto object-cover" />
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
        {/* Like */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleLike}
            disabled={isLiking}
            className={`flex items-center text-sm font-medium focus:outline-none ${
              isLiked 
                ? 'text-red-600 hover:text-red-700' 
                : 'text-gray-600 hover:text-gray-800'
            } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {/* Simple heart icon (could be replaced with SVG) */}
            <svg className={`w-5 h-5 mr-1 fill-current ${isLiked ? 'text-red-500' : 'text-gray-400'}`} viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            {isLiked ? 'Unlike' : 'Like'}
          </button>
          <span className="text-sm text-gray-500">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </span>
        </div>

        {/* Toggle comments */}
        <button
          onClick={toggleCommentsVisibility} // Calls `toggleCommentsVisibility` on click.
          className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
        >
          {/* Dynamically change button text based on `showComments` state and number of comments. */}
          {showComments 
            ? 'Hide Comments' 
            : `View Comments (${comments.length > 0 ? comments.length : (post.comments_count || 0)})`
          }
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h4 className="text-md font-semibold text-gray-700 mb-3">Comments</h4>
          
          {/* CommentForm: Allows the user to add a new comment to this post. */}
          <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />

          {/* Display loading state while comments are being fetched. */}
          {isLoadingComments && (
            <p className="text-sm text-gray-500 py-2 text-center">Loading comments...</p>
          )}
          
          {/* Display error message if comments failed to load. */}
          {commentError && !isLoadingComments && (
            <div className="bg-red-50 border border-red-300 text-red-600 px-3 py-2 rounded text-sm mb-3" role="alert">
              <p>{commentError}</p>
              <button onClick={fetchComments} className="ml-2 text-red-700 underline font-semibold text-xs hover:text-red-800">
                Retry
              </button>
            </div>
          )}

          {/* List of comments. */}
          {!isLoadingComments && !commentError && comments.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start space-x-2">
                    {comment.author_avatar_url ? (
                      <img src={comment.author_avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover mt-0.5 shrink-0" />
                    ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold text-xs mt-0.5 shrink-0">
                        {comment.author && comment.author.username ? comment.author.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    )}
                    <div className="flex-grow">
                        <p className="text-sm font-semibold text-gray-800">
                        {comment.author ? comment.author.username : 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500 mb-1">
                        {formatDate(comment.created_at)}
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Message when no comments yet. */}
          {!isLoadingComments && !commentError && comments.length === 0 && (
            <p className="text-sm text-gray-500 py-2 text-center">No comments yet. Be the first to share your thoughts!</p>
          )}
        </div>
      )}
    </div>
  );
};