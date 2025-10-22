const fs = require("fs");
const path = require("path");
const { uploadObject, buildPublicUrl } = require("./s3Storage");

const uploadLogoVideo = async () => {
  try {
    const videoPath = path.join(__dirname, "../../client/public/videos/logo-animation.mp4");

    if (!fs.existsSync(videoPath)) {
      throw new Error("Logo animation video not found at: " + videoPath);
    }

    console.log("Reading video file...");
    const videoBuffer = fs.readFileSync(videoPath);

    console.log("Uploading video to S3...");
    const objectKey = "public/videos/logo-animation.mp4";

    const result = await uploadObject({
      key: objectKey,
      body: videoBuffer,
      contentType: "video/mp4",
      cacheControl: "public, max-age=31536000, immutable",
    });

    console.log("✅ Video uploaded successfully!");
    console.log("📁 S3 Key:", result.key);
    console.log("🔗 Public URL:", result.url);

    return result.url;
  } catch (error) {
    console.error("❌ Failed to upload video:", error);
    throw error;
  }
};

// Run the upload if this script is executed directly
if (require.main === module) {
  uploadLogoVideo()
    .then((url) => {
      console.log("\n🎉 Logo animation video is now available at:");
      console.log(url);
      console.log("\n📝 Update your LogoAnimationLoader component to use this URL.");
    })
    .catch((error) => {
      console.error("Upload failed:", error);
      process.exit(1);
    });
}

module.exports = { uploadLogoVideo };
