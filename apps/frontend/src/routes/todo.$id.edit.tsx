import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import ky from "ky";
import { useEffect, useState } from "react";

type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

const todoQueryOptions = (id: string) => {
  return queryOptions({
    queryKey: ["images", id],
    queryFn: () => {
      return ky
        .get(`https://jsonplaceholder.typicode.com/todos/${id}`)
        .json<Todo>();
    },
  });
};

export const Route = createFileRoute("/todo/$id/edit")({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params }) => {
    queryClient.ensureQueryData(todoQueryOptions(params.id));
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data: todo } = useSuspenseQuery(todoQueryOptions(id));
  const [value, setValue] = useState(todo.title);
  const [isChecked, setIsChecked] = useState(todo.completed);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = Route.useNavigate();

  useEffect(() => {
    if (!isLoading) return;

    let timeoutId = setTimeout(() => {
      setIsLoading(false);
      navigate({ to: "/" });
    }, 1000);

    return () => clearTimeout(timeoutId);
  });

  return (
    <div className="p-2">
      <h1 className="text-3xl mb-4">Edit Todo (id: {id})</h1>
      <label className="flex gap-1">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
        />
        is completed?
      </label>
      <div className="flex gap-1">
        <span>Title:</span>
        <input
          className="border border-black/10 px-1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <button
        onClick={() => setIsLoading(true)}
        className="bg-gray-700 text-white px-1 py-0.5 mt-1"
      >
        {isLoading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
