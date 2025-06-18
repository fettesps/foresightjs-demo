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
  
  // Generate 50 images for 10 rows of 5
  const images = Array.from({ length: 50 }, (_, i) => {
    // Use a more reliable range of image IDs that exist in Picsum
    const imageIds = [
      1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
      42, 43, 44, 45, 46, 47, 48, 49, 50, 51
    ];
    const imageId = imageIds[i];
    return {
      lowRes: `https://picsum.photos/id/${imageId}/200/125`, // Low res for grid
      highRes: `https://picsum.photos/id/${imageId}/800/500`, // High res for modal
      id: imageId
    };
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
      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <button onClick={() => setShowImages(true)} disabled={showImages}>
          {showImages ? "Images Loaded" : "Load Images"}
        </button>
        {showImages && (
          <button onClick={resetImages} style={{ backgroundColor: "#ff4444", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}>
            Unload Images
          </button>
        )}
      </div>
      
      {/* Image Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(5, 1fr)", 
        gap: 16,
        maxWidth: "1200px"
      }}>
        {images.map((image, idx) => (
          <div
            key={image.id}
            style={{
              width: "100%",
              aspectRatio: "8/5",
              borderRadius: 8,
              boxShadow: "0 2px 8px #0002",
              background: "#eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              cursor: showImages ? "pointer" : "default",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onClick={() => showImages && openModal(image.highRes)}
            onMouseEnter={(e) => {
              if (showImages) {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 4px 16px #0003";
              }
            }}
            onMouseLeave={(e) => {
              if (showImages) {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 8px #0002";
              }
            }}
          >
            {showImages ? (
              <Image
                src={image.lowRes}
                alt={`Image ${idx + 1}`}
                width={200}
                height={125}
                style={{ 
                  borderRadius: 8,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
            ) : (
              <span style={{ color: '#aaa', fontSize: 14 }}>Image {idx + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Modal for high-res images */}
      {modalImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20
          }}
          onClick={closeModal}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: 8,
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={modalImage}
              alt="High resolution image"
              width={800}
              height={500}
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain"
              }}
            />
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(0, 0, 0, 0.7)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                fontSize: 20,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
