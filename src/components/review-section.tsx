"use client";

import { useState, useEffect } from "react";

type Review = {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export function ReviewSection({ vehicleId }: { vehicleId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [count, setCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [userName, setUserName] = useState("Guest");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [vehicleId]);

  async function fetchReviews() {
    const res = await fetch(`/api/reviews?vehicleId=${vehicleId}`);
    const data = await res.json();
    setReviews(data.reviews || []);
    setAvgRating(parseFloat(data.averageRating) || 0);
    setCount(data.count || 0);
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) {
      setMessage("Comment cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId,
        userId: "u-guest",
        userName,
        rating,
        comment,
      }),
    });

    if (res.ok) {
      setMessage("Review submitted successfully!");
      setComment("");
      setRating(5);
      setShowForm(false);
      fetchReviews();
    } else {
      setMessage("Failed to submit review.");
    }
    setIsSubmitting(false);
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Reviews & Ratings</h3>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{avgRating.toFixed(1)}</span>
              <span className="text-sm text-black/60">/ 5</span>
            </div>
            <span className="text-sm text-black/70">({count} {count === 1 ? "review" : "reviews"})</span>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
          >
            + Add Review
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submitReview} className="mt-4 space-y-3 rounded-xl border border-black/10 bg-black/[0.02] p-4">
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <div>
            <label className="block text-xs font-semibold text-black/70 mb-1">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating(r)}
                  className={`text-2xl transition ${rating >= r ? "opacity-100" : "opacity-40"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your review..."
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
            >
              Cancel
            </button>
          </div>
          {message && <p className="text-xs text-green-700">{message}</p>}
        </form>
      )}

      <div className="mt-5 space-y-3">
        {reviews.length === 0 ? (
          <p className="text-sm text-black/60">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="rounded-lg border border-black/10 bg-black/[0.02] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{review.userName}</p>
                  <p className="text-yellow-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                </div>
                <p className="text-xs text-black/60">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
              <p className="mt-2 text-sm text-black/80">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
