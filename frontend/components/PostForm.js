
const PostForm = ({ onPostCreated }) => {
  const [content, setContent] = React.useState('');
  const [image, setImage] = React.useState(null);
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    } else {
      setImage(null);
    }
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && !image) {
      setError('Please provide content or an image for your post.');
      return;
    }
    
    setError('');
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('content', content);
    if (image) {
      formData.append('image_file', image);
    }

    try {
      const newPost = await createPost(formData);
      onPostCreated(newPost);
      
      setContent('');
      setImage(null);
      if (e.target.elements.image_file) {
          e.target.elements.image_file.value = null;
      }

    } catch (err) {
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">Create a New Post</h3>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="postContent" className="block text-gray-700 text-sm font-bold mb-2">
            What's on your mind?
          </label>
          <textarea
            id="postContent"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            placeholder="Write something..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          ></textarea>
        </div>
        <div className="mb-4">
          <label htmlFor="postImage" className="block text-gray-700 text-sm font-bold mb-2">
            Add an image
          </label>
          <input
            type="file"
            id="postImage"
            name="image_file"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isSubmitting}
          />
        </div>
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !image)}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSubmitting || (!content.trim() && !image) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};
