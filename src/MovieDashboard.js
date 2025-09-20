import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import { useKey } from "./useKey";
import { useMovies } from "./useMovies";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

const average = (arr) =>
  arr.length ? arr.reduce((acc, cur) => acc + cur, 0) / arr.length : 0;

export default function MovieDashboard() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const { movies, isLoading, error } = useMovies(query);
  const [watched, setWatched] = useState([]);

  useEffect(() => {
    async function fetchWatched() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Please login first.");
          return;
        }

        const res = await fetch(`${API_URL}/watched`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch watched movies");
        const data = await res.json();
        setWatched(data);
      } catch (err) {
        console.error("Failed to fetch watched movies", err);
      }
    }

    fetchWatched();
  }, []);

  function handleSelectMovie(id) {
    setSelectedId((prev) => (id === prev ? null : id));
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  async function handleAddWatched({ id, userRating }) {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/watched`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId: id,
          rating: userRating,
        }),
      });

      if (!res.ok) throw new Error("Failed to save watched movie");
      const saved = await res.json();

      setWatched((prev) => [...prev, saved]);
    } catch (err) {
      console.error("Error adding watched movie:", err);
    }
  }

  async function handleDeleteWatched(watchedId) {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/watched/${watchedId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete watched movie");

      setWatched((prev) => prev.filter((m) => m.id !== watchedId));
    } catch (err) {
      console.error("Error deleting watched movie:", err);
      alert("Error deleting movie from watched list.");
    }
  }

  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <LogoutButton />
      </NavBar>

      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList movies={movies} onSelectMovie={handleSelectMovie} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>

        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                onDeleteWatched={handleDeleteWatched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>⛔️</span> {message}
    </p>
  );
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>MyMovieBucket</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  useKey("Enter", function () {
    if (document.activeElement === inputEl.current) return;
    inputEl.current.focus();
    setQuery("");
  });

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
}

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <button onClick={handleLogout} className="logout-btn">
      Logout
    </button>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((o) => !o)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.id} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectMovie }) {
  return (
    <li onClick={() => onSelectMovie(movie.id)}>
      <img
        src={movie.poster || "/placeholder.png"}
        alt={`${movie.title} poster`}
      />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.releaseYear}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");

  const countRef = useRef(0);
  useEffect(() => {
    if (userRating) countRef.current++;
  }, [userRating]);

  const {
    title,
    releaseYear,
    poster,
    rating,
    description,
    director,
    movieGenres,
  } = movie;

  function handleAdd() {
    onAddWatched({ id: selectedId, userRating });
    onCloseMovie();
  }

  useKey("Escape", onCloseMovie);

  useEffect(() => {
    async function getMovieDetails() {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/movies/${selectedId}`);
      const data = await res.json();
      setMovie(data);
      setIsLoading(false);
    }
    getMovieDetails();
  }, [selectedId]);

  useEffect(() => {
    if (!title) return;
    document.title = `Movie | ${title}`;
    return () => {
      document.title = "My Movies";
    };
  }, [title]);

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              &larr;
            </button>
            <img
              src={poster || "/placeholder.png"}
              alt={`Poster of ${title} movie`}
            />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>{releaseYear}</p>
              <p>{movieGenres?.map((g) => g.genre.name).join(", ")}</p>
              <p>
                <span>⭐️</span>
                {rating} rating
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
              <StarRating
                maxRating={10}
                size={24}
                onSetRating={setUserRating}
              />
              {userRating > 0 && (
                <button className="btn-add" onClick={handleAdd}>
                  + Add to list
                </button>
              )}
            </div>
            <p>
              <em>{description}</em>
            </p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function WatchedSummary({ watched }) {
  const avgBackendRating = average(watched.map((m) => m.movie?.rating || 0));
  const avgUserRating = average(watched.map((m) => m.rating || 0));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgBackendRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, onDeleteWatched }) {
  return (
    <ul className="list">
      {watched
        .filter((m) => !m.isDeleted)
        .map((entry) => {
          const poster = entry.movie?.poster || "/placeholder.png";
          const title = entry.movie?.title || "Untitled";
          const backendRating = entry.movie?.rating || 0;
          const userRating = entry.rating || 0;

          return (
            <li key={entry.id}>
              <img src={poster} alt={`${title} poster`} />
              <h3>{title}</h3>
              <div>
                <p>
                  <span>⭐️</span>
                  <span>{backendRating}</span>
                </p>
                <p>
                  <span>🌟</span>
                  <span>{userRating}</span>
                </p>
                <button
                  className="btn-delete"
                  onClick={() => onDeleteWatched(entry.id)}
                >
                  X
                </button>
              </div>
            </li>
          );
        })}
    </ul>
  );
}
