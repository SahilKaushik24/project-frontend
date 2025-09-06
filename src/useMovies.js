import { useState, useEffect } from "react";

const KEY = "41603e14";

export function useMovies(query) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    function () {
      // callback?.();

      const controller = new AbortController();

      const fetchMovies = async () => {
        try {
          setIsLoading(true);
          setError("");
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`
          );
          const data = await res.json();
          if (data.Response === "False") {
            setError(data.Error);
            setMovies([]);
            return;
          }
          setMovies(data.Search);
        } catch (err) {
          setError("Something went wrong with fetching movies");
          setMovies([]);
          console.log("Fetch error:", err);
        } finally {
          setIsLoading(false);
        }
      };

      if (query.length < 3) {
        setMovies([]);
        setError("");
        return;
      }

      fetchMovies();

      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return { movies, isLoading, error };
}
