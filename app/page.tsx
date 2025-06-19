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
        <div tabIndex={-1}>
          <h2 className={styles.title} tabIndex={-1}>ForesightJS Image Loading Demo</h2>
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
    const imageId = images.find(img => img.highRes === highResUrl)?.id;
    const isPrefetched = prefetchedImages.has(imageId || '');
    const isCompleted = prefetchCompleted.has(imageId || '');
    
    console.log(`🖼️ Opening modal for ${imageId}, prefetched: ${isPrefetched}, completed: ${isCompleted}`);
    
    // If image is marked as completed, it should load instantly
    setModalLoading(!isCompleted);
    setModalImage(highResUrl);
    
    // Track actual modal load time for verification
    const trackingStartTime = performance.now();
    const testImg = new (window as any).Image();
    testImg.onload = () => {
      const modalLoadTime = performance.now() - trackingStartTime;
      
      if (isCompleted && modalLoadTime < 50) {
        console.log(`⚡ Modal image loaded instantly in ${modalLoadTime.toFixed(2)}ms as expected`);
      } else if (isCompleted && modalLoadTime >= 50) {
        console.log(`⚠️ Modal image took ${modalLoadTime.toFixed(2)}ms despite Ready badge - cache may have been evicted`);
      } else if (isPrefetched) {
        console.log(`⏳ Modal image loaded in ${modalLoadTime.toFixed(2)}ms - was still prefetching`);
      } else {
        console.log(`🐌 Modal image loaded in ${modalLoadTime.toFixed(2)}ms from network`);
      }
    };
    testImg.src = highResUrl;
  };

  const closeModal = () => {
    setModalImage(null);
    setModalLoading(false);
  };

  // Handle keyboard events for modal and scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalImage) {
        closeModal();
      }
      
      // With ForesightJS v2.2+, scroll prediction is handled natively
      // No need for custom keyboard scroll detection
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalImage, foresightEnabled]);

  // ForesightJS v2.2+ handles scroll prediction natively
  // No need for custom scroll event handling

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

  // ForesightJS v2.2+ handles scroll context internally

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
      // Remove CORS for Picsum images to avoid cache issues
      link.onload = () => {
        const loadTime = performance.now() - startTime;
        console.log(`✅ ForesightJS: Link preload completed for ${imageId} in ${loadTime.toFixed(2)}ms`);
      };
      document.head.appendChild(link);
      
      // Method 2: Create Image element - primary prefetch method
      const img = new (window as any).Image();
      // Remove CORS to match modal image loading
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        console.log(`✅ ForesightJS: Image prefetch completed for ${imageId} in ${loadTime.toFixed(2)}ms`);
        
        // Test if image is truly cached by trying to load it again immediately
        const cacheTestStart = performance.now();
        const cacheTestImg = new (window as any).Image();
        cacheTestImg.onload = () => {
          const cacheTestTime = performance.now() - cacheTestStart;
          console.log(`🧪 ForesightJS: Cache test for ${imageId} took ${cacheTestTime.toFixed(2)}ms`);
          
          // If the second load is very fast, it's definitely cached
          if (cacheTestTime < 20) {
            console.log(`✅ ForesightJS: Image ${imageId} verified as cached - showing Ready badge`);
            setPrefetchCompleted(prev => new Set([...prev, imageId]));
          } else {
            console.log(`⚠️ ForesightJS: Image ${imageId} cache test slow - keeping Prefetching badge`);
            // Try one more time after a short delay
            setTimeout(() => {
              const finalTestStart = performance.now();
              const finalTestImg = new (window as any).Image();
              finalTestImg.onload = () => {
                const finalTestTime = performance.now() - finalTestStart;
                if (finalTestTime < 20) {
                  console.log(`✅ ForesightJS: Image ${imageId} final test passed - showing Ready badge`);
                  setPrefetchCompleted(prev => new Set([...prev, imageId]));
                }
              };
              finalTestImg.src = imageUrl;
            }, 500);
          }
        };
        cacheTestImg.src = imageUrl;
      };
      img.onerror = () => {
        console.error(`❌ ForesightJS: Image prefetch failed for ${imageId}`);
      };
      img.src = imageUrl;
    }
  };

  // Initialize ForesightJS on component mount
  useEffect(() => {
    if (!foresightEnabled) {
      console.log('🚫 ForesightJS: Disabled');
      return;
    }

    console.log('✅ ForesightJS: Enabled and initializing');
    console.log(`🐛 Debug mode state: ${debugMode} (type: ${typeof debugMode})`);
    
    // Initialize ForesightManager with configuration
    const config = {
      debug: debugMode, // Control debug mode properly
      trajectoryPredictionTime: 100, // How far ahead to predict mouse trajectory
      defaultHitSlop: 20, // Extra pixels around elements for prediction
      enableScrollPrediction: true, // Enable v2.2+ scroll-based predictions
    };
    
    console.log('🔧 ForesightJS config:', config);
    ForesightManager.initialize(config);

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
        <button onClick={resetImages} className={styles.unloadButton} tabIndex={1}>
          Reset All Images
        </button>
        <button 
          onClick={toggleForesight}
          className={`${styles.loadButton} ${foresightEnabled ? styles.enabledButton : styles.disabledButton}`}
          tabIndex={2}
        >
          ForesightJS: {foresightEnabled ? 'ON' : 'OFF'}
        </button>
        <button 
          onClick={() => setDebugMode(!debugMode)} 
          className={`${styles.loadButton} ${debugMode ? styles.enabledButton : styles.disabledButton}`}
          tabIndex={3}
        >
          Debug Mode: {debugMode ? 'ON' : 'OFF'}
        </button>
      </div>
      
      <div className={styles.keyboardHint} tabIndex={-1}>
        💡 {foresightEnabled 
          ? 'ForesightJS predicts your intent - Tab/Shift+Tab to navigate, Enter/Space to interact, scroll to trigger predictions, Escape to close modal'
          : 'Hover or Tab to load images - Enter/Space to open modal, Escape to close modal'
        }
      </div>
      
      {/* Image Grid */}
      <div className={styles.imageGrid}>
        {images.map((image, idx) => (
          <div
            key={image.id}
            ref={el => { imageRefs.current[idx] = el; }}
            className={`${styles.imageBox} ${loadedImages.has(image.id) ? styles.clickable : (!foresightEnabled ? styles.clickable : '')}`}
            tabIndex={4 + idx}
            role="button"
            aria-label={loadedImages.has(image.id) ? `View high resolution image ${idx + 1}` : `Load image ${idx + 1}`}
            onMouseEnter={() => {
              if (!foresightEnabled && !loadedImages.has(image.id)) {
                // When ForesightJS is disabled, load on hover
                console.log(`🖱️ Hover: Loading image ${image.id}`);
                setLoadedImages(prev => new Set([...prev, image.id]));
                // Also prefetch high-res for faster modal opening
                setTimeout(() => {
                  prefetchImage(image.highRes, image.id);
                }, 100);
              }
            }}
            onClick={() => {
              if (loadedImages.has(image.id)) {
                // Check if high-res is prefetched before opening modal
                if (prefetchCompleted.has(image.id)) {
                  console.log(`🚀 Quick modal open - image ${image.id} is fully prefetched`);
                  openModal(image.highRes);
                } else if (prefetchedImages.has(image.id)) {
                  console.log(`⏳ Modal opening - image ${image.id} still prefetching...`);
                  openModal(image.highRes);
                } else {
                  console.log(`🐌 Slow modal open - image ${image.id} not prefetched`);
                  openModal(image.highRes);
                }
              }
              // Remove the manual click loading since we now load on hover when ForesightJS is off
            }}
            onFocus={() => {
              if (!foresightEnabled && !loadedImages.has(image.id)) {
                // When ForesightJS is disabled, load on focus (keyboard navigation)
                console.log(`⌨️ Focus: Loading image ${image.id}`);
                setLoadedImages(prev => new Set([...prev, image.id]));
                // Also prefetch high-res for faster modal opening
                setTimeout(() => {
                  prefetchImage(image.highRes, image.id);
                }, 100);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (loadedImages.has(image.id)) {
                  // Check prefetch status for keyboard interaction too
                  if (prefetchCompleted.has(image.id)) {
                    console.log(`🚀 Quick keyboard modal open - image ${image.id} is fully prefetched`);
                  } else if (prefetchedImages.has(image.id)) {
                    console.log(`⏳ Keyboard modal opening - image ${image.id} still prefetching...`);
                  } else {
                    console.log(`🐌 Slow keyboard modal open - image ${image.id} not prefetched`);
                  }
                  openModal(image.highRes);
                } else if (!foresightEnabled) {
                  // If image isn't loaded yet (shouldn't happen with focus loading), load it
                  console.log(`⌨️ Keyboard: Loading image ${image.id}`);
                  setLoadedImages(prev => new Set([...prev, image.id]));
                }
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
                {foresightEnabled ? `Image ${idx + 1}` : `Hover to load Image ${idx + 1}`}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Modal for high-res images */}
      {modalImage && (
        <div 
          className={styles.modalOverlay} 
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="High resolution image viewer"
        >
          <div 
            className={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            ref={(el) => el?.focus()}
          >
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
            <button 
              onClick={closeModal} 
              className={styles.closeButton}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
