"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect, useRef } from "react";
import { ForesightManager } from "js.foresight";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Demo: On-demand image loading */}
        <div>
          <h2 className={styles.title}>ForesightJS Image Loading Demo</h2>
          <OnDemandImages />
        </div>
      </main>
      <footer className={styles.footer}>

      </footer>
    </div>
  );
}

// On-demand image loading demo component
function OnDemandImages() {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [prefetchedImages, setPrefetchedImages] = useState<Set<string>>(new Set());
  const [prefetchCompleted, setPrefetchCompleted] = useState<Set<string>>(new Set());
  const [debugMode, setDebugMode] = useState(false);
  const [foresightEnabled, setForesightEnabled] = useState(true);
  const [resetKey, setResetKey] = useState(0); // Trigger for re-registering ForesightJS
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Generate 50 images once and store in state to prevent re-generation on re-renders
  const [images] = useState(() => {
    return Array.from({ length: 50 }, (_, i) => {
      // Use a unique seed for each image to ensure variety but consistency per session
      const seed = `img-${i + 1}-${Date.now()}-${Math.random()}`;
      
      return {
        lowRes: `https://picsum.photos/seed/${seed}/200/125`, // Low res for grid
        highRes: `https://picsum.photos/seed/${seed}/800/500`, // High res for modal
        id: seed
      };
    });
  });

  const openModal = (highResUrl: string) => {
    const modalStartTime = performance.now();
    const imageId = images.find(img => img.highRes === highResUrl)?.id;
    console.log(`🖼️ Opening modal for ${imageId}, prefetched: ${prefetchedImages.has(imageId || '')}`);
    
    setModalLoading(true);
    setModalImage(highResUrl);
    
    // Add a load event listener to see if the high-res image loads quickly from cache
    const testImg = new (window as any).Image();
    testImg.onload = () => {
      const modalLoadTime = performance.now() - modalStartTime;
      console.log(`⚡ Modal high-res image loaded in ${modalLoadTime.toFixed(2)}ms (from ${prefetchedImages.has(imageId || '') ? 'cache' : 'network'})`);
      setModalLoading(false);
    };
    testImg.onerror = () => {
      console.error(`❌ Failed to load modal image for ${imageId}`);
      setModalLoading(false);
    };
    testImg.src = highResUrl;
  };

  const closeModal = () => {
    setModalImage(null);
    setModalLoading(false);
  };

  const resetImages = () => {
    setLoadedImages(new Set());
    setModalImage(null); // Close modal if open
    setPrefetchedImages(new Set()); // Clear prefetched images
    setPrefetchCompleted(new Set()); // Clear completed prefetches
    setResetKey(prev => prev + 1); // Trigger ForesightJS re-registration
  };

  const toggleForesight = () => {
    setForesightEnabled(prev => !prev);
    // Clear prefetch states when disabling
    if (foresightEnabled) {
      setPrefetchedImages(new Set());
      setPrefetchCompleted(new Set());
    }
    setResetKey(prev => prev + 1); // Trigger ForesightJS re-registration
  };

  // Function to load image when ForesightJS predicts interaction
  const loadImage = (imageId: string) => {
    if (!loadedImages.has(imageId) && foresightEnabled) {
      console.log(`🎯 ForesightJS: Loading image ${imageId}`);
      setLoadedImages(prev => new Set([...prev, imageId]));
    }
  };

  // Function to prefetch high-res image
  const prefetchImage = (imageUrl: string, imageId: string) => {
    if (!prefetchedImages.has(imageId) && foresightEnabled) {
      const startTime = performance.now();
      console.log(`🎯 ForesightJS: Starting aggressive prefetch of high-res image for ${imageId}`);
      console.log(`🔗 High-res URL: ${imageUrl}`);
      
      // Show badge immediately when prefetching starts
      setPrefetchedImages(prev => new Set([...prev, imageId]));
      
      // Method 1: Use link preload for better browser prioritization
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageUrl;
      link.crossOrigin = 'anonymous'; // Add CORS support
      link.onload = () => {
        const loadTime = performance.now() - startTime;
        console.log(`✅ ForesightJS: Link preload completed for ${imageId} in ${loadTime.toFixed(2)}ms`);
      };
      document.head.appendChild(link);
      
      // Method 2: Create Image element with higher priority
      const img = new (window as any).Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        console.log(`✅ ForesightJS: Image prefetch completed for ${imageId} in ${loadTime.toFixed(2)}ms`);
        setPrefetchCompleted(prev => new Set([...prev, imageId]));
      };
      img.onerror = () => {
        console.error(`❌ ForesightJS: Image prefetch failed for ${imageId}`);
      };
      img.src = imageUrl;
      
      // Method 3: Use fetch with cache for even more aggressive prefetching
      fetch(imageUrl, { 
        method: 'GET',
        mode: 'cors',
        cache: 'force-cache'
      }).then(response => {
        if (response.ok) {
          const loadTime = performance.now() - startTime;
          console.log(`🚀 ForesightJS: Fetch prefetch completed for ${imageId} in ${loadTime.toFixed(2)}ms`);
        }
      }).catch(err => {
        console.warn(`⚠️ ForesightJS: Fetch prefetch failed for ${imageId}:`, err);
      });
    }
  };

  // Initialize ForesightJS on component mount
  useEffect(() => {
    if (!foresightEnabled) {
      console.log('🚫 ForesightJS: Disabled');
      return;
    }

    console.log('✅ ForesightJS: Enabled and initializing');
    
    // Initialize ForesightManager with configuration
    ForesightManager.initialize({
      debug: debugMode, // Control debug mode to prevent keyboard interference
      trajectoryPredictionTime: 100, // How far ahead to predict mouse trajectory
      defaultHitSlop: 20, // Extra pixels around elements for prediction
    });

    const unregisterFunctions: (() => void)[] = [];

    // Register each image box with ForesightJS
    images.forEach((image, index) => {
      const element = imageRefs.current[index];
      if (element) {
        const { unregister } = ForesightManager.instance.register({
          element,
          callback: () => {
            // This callback fires when ForesightJS predicts user will interact with this element
            loadImage(image.id); // Load the low-res image
            prefetchImage(image.highRes, image.id); // Prefetch the high-res version
          },
          hitSlop: 25, // Larger hit area for better prediction
        });
        
        unregisterFunctions.push(unregister);
      }
    });

    // Cleanup function
    return () => {
      unregisterFunctions.forEach(unregister => unregister());
    };
  }, [images, debugMode, resetKey, foresightEnabled]); // Re-run when images, debug mode, reset key, or foresight enabled changes

  return (
    <div>
      <div className={styles.buttonControls}>
        <button onClick={resetImages} className={styles.unloadButton}>
          Reset All Images
        </button>
        <button 
          onClick={toggleForesight}
          className={`${styles.loadButton} ${foresightEnabled ? styles.enabledButton : styles.disabledButton}`}
        >
          ForesightJS: {foresightEnabled ? 'ON' : 'OFF'}
        </button>
        <button 
          onClick={() => setDebugMode(!debugMode)} 
          className={styles.loadButton}
        >
          Debug Mode: {debugMode ? 'ON' : 'OFF'}
        </button>
      </div>
      
      {/* Image Grid */}
      <div className={styles.imageGrid}>
        {images.map((image, idx) => (
          <div
            key={image.id}
            ref={el => { imageRefs.current[idx] = el; }}
            className={`${styles.imageBox} ${loadedImages.has(image.id) ? styles.clickable : (!foresightEnabled ? styles.clickable : '')}`}
            onClick={() => {
              if (loadedImages.has(image.id)) {
                openModal(image.highRes);
              } else if (!foresightEnabled) {
                // When ForesightJS is disabled, allow manual loading by clicking
                console.log(`📱 Manual: Loading image ${image.id}`);
                setLoadedImages(prev => new Set([...prev, image.id]));
              }
            }}
          >
            {loadedImages.has(image.id) ? (
              <>
                <Image
                  src={image.lowRes}
                  alt={`Image ${idx + 1}`}
                  width={200}
                  height={125}
                  className={styles.imageContent}
                  sizes="(max-width: 1200px) 20vw, 240px"
                  priority={false}
                />
                {prefetchedImages.has(image.id) && (
                  <div className={`${styles.prefetchedIndicator} ${prefetchCompleted.has(image.id) ? styles.prefetchCompleted : styles.prefetchInProgress}`}>
                    {prefetchCompleted.has(image.id) ? '⚡ Ready' : '🔄 Prefetching...'}
                  </div>
                )}
              </>
            ) : (
              <span className={styles.placeholderText}>
                {foresightEnabled ? `Image ${idx + 1}` : `Click to load Image ${idx + 1}`}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Modal for high-res images */}
      {modalImage && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {modalLoading && (
              <div className={styles.modalLoading}>
                Loading high-res image...
              </div>
            )}
            {/* Use regular img element to leverage browser cache from prefetching */}
            <img
              src={modalImage}
              alt="High resolution image"
              className={styles.modalImage}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain',
                opacity: modalLoading ? 0.3 : 1,
                transition: 'opacity 0.2s ease'
              }}
              onLoad={() => setModalLoading(false)}
              onError={() => setModalLoading(false)}
            />
            <button onClick={closeModal} className={styles.closeButton}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
