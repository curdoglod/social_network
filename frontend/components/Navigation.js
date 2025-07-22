
const Navigation = ({ user, onLogout }) => {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onLogout();
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  if (user) return null;

  
};
