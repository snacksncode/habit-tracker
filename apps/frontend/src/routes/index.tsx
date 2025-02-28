import { createFileRoute, Link } from "@tanstack/react-router";
import { Drawer } from "vaul";
import {
  queryOptions,
  useMutation,
  useMutationState,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import ky from "ky";
import { Button } from "@/components/ui/button";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";
import {
  CalendarClock,
  Clock,
  Edit,
  Edit2,
  ListTodo,
  Plus,
  Swords,
  User,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/textfield";
import { useState } from "react";

const cn = (...args: (string | boolean)[]) => args.filter(Boolean).join(" ");

type Todo = {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
};

let db = [
  {
    userId: 1,
    id: 1,
    title: "delectus aut autem",
    completed: false,
  },
  {
    userId: 1,
    id: 2,
    title: "quis ut nam facilis et officia qui",
    completed: false,
  },
  {
    userId: 1,
    id: 3,
    title: "fugiat veniam minus",
    completed: false,
  },
  {
    userId: 1,
    id: 4,
    title: "et porro tempora",
    completed: true,
  },
  {
    userId: 1,
    id: 5,
    title: "laboriosam mollitia et enim quasi adipisci quia provident illum",
    completed: false,
  },
  {
    userId: 1,
    id: 6,
    title: "qui ullam ratione quibusdam voluptatem quia omnis",
    completed: false,
  },
  {
    userId: 1,
    id: 7,
    title: "illo expedita consequatur quia in",
    completed: false,
  },
  {
    userId: 1,
    id: 8,
    title: "quo adipisci enim quam ut ab",
    completed: true,
  },
  {
    userId: 1,
    id: 9,
    title: "molestiae perspiciatis ipsa",
    completed: false,
  },
  {
    userId: 1,
    id: 10,
    title: "illo est ratione doloremque quia maiores aut",
    completed: true,
  },
];

const todosQueryOptions = queryOptions({
  queryKey: ["todos"],
  queryFn: async ({ signal }) => {
    await wait(1000);
    return db;
    // return ky
    //   .get("https://jsonplaceholder.typicode.com/todos?_limit=10")
    //   .json<Todo[]>();
  },
});

const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["updateTodo"],
    mutationFn: async (todo: { id: number; completed: boolean }) => {
      await wait(600);
      db.find((t) => t.id === todo.id)!.completed = todo.completed;
    },
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previousTodos = queryClient.getQueryData(
        todosQueryOptions.queryKey
      );
      queryClient.setQueryData(todosQueryOptions.queryKey, (prev) => {
        if (!prev) return;
        return prev.map((todo) => {
          if (todo.id !== newTodo.id) return todo;
          return { ...todo, completed: newTodo.completed };
        });
      });
      return { previousTodos };
    },
    onError: (_err, _newTodo, context) => {
      if (!context) return;
      queryClient.setQueryData(["todos"], context.previousTodos);
    },
    onSettled: () => {
      queryClient.invalidateQueries(todosQueryOptions);
    },
  });
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const Route = createFileRoute("/")({
  component: HomeComponent,
  loader: async ({ context: { queryClient } }) => {
    await wait(1000);
    queryClient.ensureQueryData(todosQueryOptions);
  },
});

const AddTodoSheet = () => {
  const [value, setValue] = useState("");

  return (
    <Drawer.Root
      onClose={() => setValue("")}
      shouldScaleBackground
      setBackgroundColorOnScale={false}
    >
      <Drawer.Trigger className="bg-primary bottom-28 right-4 fixed inline-flex h-10 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full px-4 text-sm font-medium shadow-sm transition-all">
        <Plus className="w-4" />
        Add
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-background pb-8 flex flex-col rounded-t-[10px] mt-24 h-fit fixed bottom-0 left-0 right-0 outline-none">
          <div className="p-4 bg-background rounded-t-[10px] flex-1">
            <div
              aria-hidden
              className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-8"
            />
            <div className="max-w-md mx-auto">
              <Drawer.Title className="font-medium mb-4 text-foreground">
                Add new Todo
              </Drawer.Title>
              <form className="flex flex-col gap-4">
                <TextField
                  label="What is it?"
                  value={value}
                  onChange={setValue}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={value}
                  onChange={setValue}
                />
                <Button>Create</Button>
              </form>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

function HomeComponent() {
  const { data: todos, isFetching } = useSuspenseQuery(todosQueryOptions);
  const { mutate } = useUpdateTodo();

  return (
    <div className="h-svh flex flex-col">
      <div className="h-60 shrink-0 bg-primary/5">
        Your profile here
        <img src="/gurl.png" />
      </div>
      <Tabs className="flex flex-1 overflow-auto flex-col-reverse">
        <TabList className="h-24 p-2 pb-8 rounded-none gap-2">
          <Tab className="w-full flex-col items-center gap-1" id="todos">
            <ListTodo className="w-6 text-primary" />
            Todos
          </Tab>
          <Tab className="w-full flex-col items-center gap-1" id="habits">
            <CalendarClock className="w-6 text-primary" />
            Habits
          </Tab>
          <Tab className="w-full flex-col items-center gap-1" id="Battle">
            <Swords className="w-6 text-primary" />
            Battle
          </Tab>
          <Tab className="w-full flex-col items-center gap-1" id="account">
            <User className="w-6 text-primary" />
            You
          </Tab>
        </TabList>
        <TabPanel className="flex flex-1 overflow-auto flex-col" id="todos">
          <h1 className="text-3xl mx-4 mt-4 mb-4">
            Todos
            {isFetching && (
              <span className="text-muted-foreground ml-2 text-xs">
                Updating...
              </span>
            )}
          </h1>
          <div className="flex overflow-auto px-4 pb-16 flex-col gap-4">
            {todos.map((todo) => (
              <label
                key={todo.id}
                className="border p-2 rounded-sm border-solid border-muted block"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      isSelected={todo.completed}
                      onChange={(isSelected) => {
                        mutate({ id: todo.id, completed: isSelected });
                      }}
                    />
                    <span className="text-base truncate">{todo.title}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-xs bg-secondary text-secondary-foreground inline-flex px-2 rounded-full gap-1 items-center">
                      <Clock className="w-4" />
                      Due in 3 days
                    </span>
                    <Link
                      className="text-xs text-secondary-foreground flex gap-1 items-center"
                      to="/todo/$id/edit"
                      params={{ id: todo.id.toString() }}
                    >
                      <Edit className="w-4" />
                      Edit
                    </Link>
                  </div>
                </div>
              </label>
            ))}
            <AddTodoSheet />
          </div>
        </TabPanel>
        <TabPanel
          className="flex flex-1 px-4 flex-col overflow-auto"
          id="habits"
        >
          <h1 className="text-3xl mb-4">Habits</h1>
        </TabPanel>
      </Tabs>
    </div>
  );
}
