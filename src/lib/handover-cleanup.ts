import { prisma } from "./prisma";
import { deleteFromCloudinary } from "./cloudinary";

// Helper to extract Cloudinary public ID from secure URL
function extractPublicId(url: string): string | null {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const subParts = parts[1].split("/");
    // Remove version prefix if present (e.g. v1723456789)
    if (subParts[0].startsWith("v") && !isNaN(Number(subParts[0].substring(1)))) {
      subParts.shift();
    }
    const publicIdWithExt = subParts.join("/");
    const lastDotIdx = publicIdWithExt.lastIndexOf(".");
    if (lastDotIdx === -1) return publicIdWithExt;
    return publicIdWithExt.substring(0, lastDotIdx);
  } catch {
    return null;
  }
}

export async function cleanupExpiredPhotos() {
  console.log("Starting cleanup of expired inspection photos (older than 48 hours)...");
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Fetch all bookings where handoverStatus is RETURNED, completed 48+ hours ago,
    // and which still have photos stored (excluding already purged ["DELETED"] bookmarks).
    const expiredBookings = await prisma.booking.findMany({
      where: {
        handoverStatus: "RETURNED",
        updatedAt: { lte: fortyEightHoursAgo },
        NOT: {
          startPhotos: {
            has: "DELETED",
          },
        },
      },
    });

    // Filter bookings that have actual photos to purge
    const bookingsToClean = expiredBookings.filter(
      (b) => b.startPhotos.length > 0 || b.endPhotos.length > 0
    );

    if (bookingsToClean.length === 0) {
      console.log("No expired inspection photos found to clean up.");
      return { success: true, count: 0 };
    }

    let deletedPhotosCount = 0;

    for (const booking of bookingsToClean) {
      const allPhotos = [...booking.startPhotos, ...booking.endPhotos].filter(
        (url) => url && url.startsWith("http") && !url.includes("DELETED")
      );
      
      const deletePromises = [];

      for (const photoUrl of allPhotos) {
        const publicId = extractPublicId(photoUrl);
        if (publicId) {
          deletePromises.push(
            deleteFromCloudinary(publicId)
              .then(() => {
                deletedPhotosCount++;
              })
              .catch((err) => {
                console.error(`Failed to delete Cloudinary asset ${publicId}:`, err);
              })
          );
        }
      }

      // Wait for Cloudinary deletions to finalize for this booking
      if (deletePromises.length > 0) {
        await Promise.allSettled(deletePromises);
      }

      // Mark the records as purged in DB for retention policy compliance
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          startPhotos: ["DELETED"],
          endPhotos: ["DELETED"],
        },
      });
    }

    console.log(`Successfully purged ${deletedPhotosCount} inspection photos across ${bookingsToClean.length} bookings.`);
    return { success: true, bookingsCleaned: bookingsToClean.length, photosDeleted: deletedPhotosCount };
  } catch (error) {
    console.error("Expired photos cleanup failed:", error);
    return { success: false, error: String(error) };
  }
}
