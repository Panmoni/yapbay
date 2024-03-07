import { useState, useEffect } from "react";

export function useLoaderData<T>(): { error: unknown; data: T | null } {
  const [state, setState] = useState<{ error: unknown; data: T | null }>({
    error: null,
    data: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/ROADMAP.md`,
        );
        const data = await res.text();
        setState({ error: null, data: data as unknown as T });
      } catch (error) {
        setState({ error, data: null });
      }
    };

    fetchData();
  }, []);

  return state;
}
