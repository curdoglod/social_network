
const CommentForm = ({ postId, onCommentAdded }) => {
  const [text, setText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Comment cannot be empty.');
      return;
    }
    
    setError('');
    setIsSubmitting(true);

    try {
      const newComment = await createComment(postId, { text });
      onCommentAdded(newComment);
      setText('');
    } catch (err) {
      setError(err.message || 'Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 mb-2"> {/* Margin top/bottom for spacing */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-3 text-sm" role="alert">
          {error}
        </div>
      )}
      <div className="flex items-start space-x-3">
        <textarea
          className="flex-grow shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          rows="2"
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSubmitting}
        ></textarea>
        <button
          type="submit"
          disabled={isSubmitting || !text.trim()}
          className={`bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded text-sm focus:outline-none focus:shadow-outline ${isSubmitting || !text.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Sending...' : 'Comment'}
        </button>
      </div>
    </form>
  );
};
