import { useState, useEffect } from "react";

export function useMovies(query, page = 1, limit = 20) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMovies() {
      try {
        setIsLoading(true);
        setError("");
        let url = `http://localhost:5000/movies?page=${page}&limit=${limit}`;
        if (query) url += `&title=${encodeURIComponent(query)}`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch movies");

        const data = await res.json();
        setMovies(data.movies || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovies();
    return () => controller.abort();
  }, [query, page, limit]);

  return { movies, isLoading, error, totalPages };
}
