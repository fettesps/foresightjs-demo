"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useState } from "react";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Demo: On-demand image loading */}
        <div>
          <h2>On-Demand Image Loading Demo</h2>
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
  const [showImages, setShowImages] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  
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
    setModalImage(highResUrl);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  const resetImages = () => {
    setShowImages(false);
    setModalImage(null); // Close modal if open
  };

  return (
    <div>
      <div className={styles.buttonControls}>
        <button 
          onClick={() => setShowImages(true)} 
          disabled={showImages}
          className={styles.loadButton}
        >
          {showImages ? "Images Loaded" : "Load Images"}
        </button>
        {showImages && (
          <button onClick={resetImages} className={styles.unloadButton}>
            Unload Images
          </button>
        )}
      </div>
      
      {/* Image Grid */}
      <div className={styles.imageGrid}>
        {images.map((image, idx) => (
          <div
            key={image.id}
            className={`${styles.imageBox} ${showImages ? styles.clickable : ''}`}
            onClick={() => showImages && openModal(image.highRes)}
          >
            {showImages ? (
              <Image
                src={image.lowRes}
                alt={`Image ${idx + 1}`}
                width={200}
                height={125}
                className={styles.imageContent}
                sizes="(max-width: 1200px) 20vw, 240px"
                priority={false}
              />
            ) : (
              <span className={styles.placeholderText}>Image {idx + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Modal for high-res images */}
      {modalImage && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Image
              src={modalImage}
              alt="High resolution image"
              width={800}
              height={500}
              className={styles.modalImage}
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
