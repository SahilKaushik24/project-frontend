import { useState, useEffect } from "react";

export function useMovies(query) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMovies() {
      try {
        setIsLoading(true);
        setError("");

        let url = "http://localhost:5000/movies";
        if (query) {
          url += `?title=${encodeURIComponent(query)}`;
        }

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch movies");

        const data = await res.json();

        const mapped = data.map((movie) => ({
          id: movie.id,
          title: movie.title,
          releaseYear: movie.releaseYear,
          director: movie.director,
          rating: movie.rating ?? null,
          genres: movie.movieGenres?.map((g) => g.genre.name) || [],
          poster: movie.poster || "/placeholder.png",
        }));

        setMovies(mapped);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovies();
    return () => controller.abort();
  }, [query]);

  return { movies, isLoading, error };
}
