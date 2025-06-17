import "../styles/globals.css";
import { useState, useEffect } from "react";
import { useRef } from "react";
import { useRouter } from "next/router";
import Loader from './components/PreloaderSociety';


function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter()
  const ref = useRef();
  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on('routeChangeStart', handleStart); // Show loader on route change
    router.events.on('routeChangeComplete', handleComplete); // Hide loader on complete
    router.events.on('routeChangeError', handleComplete); // Hide loader on error

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);


  return (
    <>
      {loading && <Loader />}
      <Component/>
    </>
  );
}

export default MyApp;
