import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">404</h1>
        <p className="text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to="/" className="inline-block">
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Return to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
