import React from "react";
import { FiPlusCircle, FiX } from "react-icons/fi";

const ImageUploadGrid = ({ images, setImages, mainImageIndex, setMainImageIndex,isEnabled }) => {
  const handleFileChange = (file, idx) => {
    const updatedImages = [...images];
    updatedImages[idx] = {
      ...updatedImages[idx],
      file,
      FileName: file.name,
    };
    setImages(updatedImages);
    // Set this as main image if none is selected
    if (mainImageIndex === null || mainImageIndex === undefined) {
      setMainImageIndex(idx);
    }
  };

  const handleRemoveImage = (idx) => {
    const updatedImages = [...images];
    updatedImages[idx] = { file: null, FileName: null };
    setImages(updatedImages);

    // If the removed image was the main image, find the next available image
    if (mainImageIndex === idx) {
      const newMainIndex = updatedImages.findIndex((img) => img.file || img.FileName);
      setMainImageIndex(newMainIndex >= 0 ? newMainIndex : null);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 mt-4">Frame Images (Max 5)</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`relative border-2 rounded-lg p-2 ${
              mainImageIndex === idx ? "border-blue-500 bg-blue-50" : "border-gray-200"
            }`}
          >
            <div className="flex flex-col items-center">
              {img.FileName || img.file ? (
                <>
                  <div className="relative w-full h-24 mb-2">
                    {img.file ? (
                      <img
                        src={URL.createObjectURL(img.file)}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-contain rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                        <span className="text-xs text-gray-500 truncate px-1">
                          {img.FileName}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                  <div className="w-full flex items-center justify-between mt-2 px-1">
                    <span className="text-xs text-gray-600">
                      {mainImageIndex === idx ? "Main image" : ""}
                    </span>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="mainImage"
                        checked={mainImageIndex === idx}
                        onChange={() => setMainImageIndex(idx)}
                        className="h-4 w-4 text-blue-600"
                        disabled={!img.file && !img.FileName} // Disable for empty slots
                      />
                      <span className="text-xs">Set as Main</span>
                    </label>
                  </div>
                </>
              ) : (
                <label
                  htmlFor={`image-upload-${idx}`}
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <FiPlusCircle className="text-gray-400 text-2xl mb-1" />
                  <span className="text-xs text-gray-500">Add image {idx + 1}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0], idx)}
                    className="hidden"
                    id={`image-upload-${idx}`}
                    disabled={isEnabled}
                  />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-blue-800 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1  In1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
              clipRule="evenodd"
            />
          </svg>
          The main image will be used as the primary display image for this frame variation.
        </p>
      </div>
    </div>
  );
};

export default ImageUploadGrid;