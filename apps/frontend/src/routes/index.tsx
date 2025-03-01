import { createFileRoute } from "@tanstack/react-router";
import { Drawer } from "vaul";
import key from "weak-key";
import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import ky from "ky";
import { Button } from "@/components/ui/button";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";
import { CalendarDate } from "@internationalized/date";
import {
  addDays,
  addHours,
  formatDistance,
  formatISO,
  isPast,
  isToday,
  isTomorrow,
  parseISO,
} from "date-fns";
import {
  CalendarClock,
  Clock,
  Edit,
  Ellipsis,
  ListTodo,
  Menu,
  Plus,
  Swords,
  Trash,
  User,
} from "lucide-react";
import { Selection } from "react-aria-components";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/textfield";
import { FormEventHandler, useEffect, useRef, useState } from "react";
import { JollyDateField } from "@/components/ui/datefield";
import { DateValue } from "react-aria-components";
import { JollyMenu, MenuItem } from "@/components/ui/menu";
import { JollyTagGroup, Tag } from "@/components/ui/tag-group";
import { Label } from "@/components/ui/field";
import {
  Slider,
  SliderFillTrack,
  SliderThumb,
  SliderTrack,
} from "@/components/ui/slider";
import { JollyNumberField } from "@/components/ui/numberfield";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Todo = {
  date: string;
  id: number;
  name: string;
  is_completed: boolean;
};

type Habit = {
  id: number;
  name: string;
  completed: number;
  to_complete: number;
  status: number;
  freq: "DAILY" | "WEEKLY" | "MONTHLY";
};

const todosQueryOptions = queryOptions({
  queryKey: ["todos"],
  queryFn: async () => {
    return ky
      .get(`http://${new URL(window.origin).hostname}:4000/todos`)
      .json<Todo[]>();
  },
});

const habitsQueryOptions = queryOptions({
  queryKey: ["habits"],
  queryFn: async () => {
    return ky
      .get(`http://${new URL(window.origin).hostname}:4000/habits`)
      .json<Habit[]>();
  },
});

function sortTodosByDate(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }

    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    return dateA.getTime() - dateB.getTime();
  });
}

const useUpdateHabit = (
  id: string,
  withDelay?: boolean,
  onSuccess?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      newName,
      newFreq,
      newSteps,
      newProgress,
    }: {
      newName: string;
      newFreq: Habit["freq"];
      newSteps: number;
      newProgress: number;
    }) => {
      if (withDelay) {
        await new Promise((res) => setTimeout(res, 1000));
      }
      return ky.put(
        `http://${new URL(window.origin).hostname}:4000/habits/${id}`,
        {
          body: JSON.stringify({
            name: newName,
            freq: newFreq,
            to_complete: newSteps,
            completed: newProgress,
          }),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(habitsQueryOptions);
      onSuccess?.();
    },
  });
};

const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["updateTodo"],
    mutationFn: async (todo: {
      id: number;
      name: string;
      completed: boolean;
    }) => {
      return ky.put(
        `http://${new URL(window.origin).hostname}:4000/todos/${todo.id}`,
        {
          body: JSON.stringify({
            name: todo.name,
            is_completed: todo.completed,
          }),
        }
      );
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

const useDeleteTodo = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      return ky.delete(
        `http://${new URL(window.origin).hostname}:4000/todos/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(todosQueryOptions);
    },
  });
};

const useDeleteHabit = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      return ky.delete(
        `http://${new URL(window.origin).hostname}:4000/habits/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(habitsQueryOptions);
    },
  });
};

export const Route = createFileRoute("/")({
  component: HomeComponent,
  loader: async ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(todosQueryOptions);
    queryClient.ensureQueryData(habitsQueryOptions);
  },
});

function sortByFrequency(array: Habit[]) {
  const freqOrder = {
    DAILY: 1,
    WEEKLY: 2,
    MONTHLY: 3,
  };

  return [...array].sort((a, b) => {
    const priorityA = freqOrder[a.freq] || 99;
    const priorityB = freqOrder[b.freq] || 99;

    return priorityA - priorityB;
  });
}

const AddHabitSheet = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState(1);
  const [selected, setSelected] = useState<Selection>(
    new Set<Habit["freq"]>(["DAILY"])
  );
  const selectedKey = [...selected][0] as Habit["freq"];

  const handleClose = () => {
    setIsOpen(false);
    setName("");
    setSelected(new Set<Habit["freq"]>(["DAILY"]));
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      name,
      freq,
      to_complete,
    }: {
      name: string;
      freq: Habit["freq"];
      to_complete: number;
    }) => {
      return ky.post(`http://${new URL(window.origin).hostname}:4000/habits`, {
        body: JSON.stringify({ name, freq, to_complete }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(habitsQueryOptions);
      handleClose();
    },
  });

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    mutate({ name, freq: selectedKey, to_complete: steps });
  };

  return (
    <Drawer.Root
      open={isOpen}
      onClose={handleClose}
      shouldScaleBackground
      setBackgroundColorOnScale={false}
    >
      <Drawer.Trigger
        onClick={() => setIsOpen(true)}
        className="bg-primary bottom-28 text-white right-4 fixed outline-none inline-flex h-10 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full px-4 text-sm font-medium shadow-sm transition-all"
      >
        <Plus className="w-4" />
        New Habit
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
                Add new habit
              </Drawer.Title>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <TextField
                  label="What is it?"
                  value={name}
                  onChange={setName}
                  isRequired
                />
                <JollyNumberField
                  label="How many steps?"
                  isRequired
                  minValue={1}
                  value={steps}
                  onChange={setSteps}
                />
                <JollyTagGroup
                  selectedKeys={selected}
                  onSelectionChange={setSelected}
                  label="Frequency"
                  selectionMode="single"
                >
                  <Tag id="DAILY">Daily</Tag>
                  <Tag id="WEEKLY">Weekly</Tag>
                  <Tag id="MONTHLY">Monthly</Tag>
                </JollyTagGroup>
                <Button type="submit" isPending={isPending}>
                  Create
                </Button>
              </form>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

const Habit = ({
  habit,
  onProgressChange,
}: {
  habit: Habit;
  onProgressChange?: (habitId: string, newValue: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(habit.completed);
  const [isEditMode, setIsEditMode] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const { mutate: deleteHabit } = useDeleteHabit(habit.id.toString());
  const { mutate } = useUpdateHabit(habit.id.toString());

  const handleValueChange = (value: number[]) => {
    const newValue = value[0];
    setProgress(newValue);

    if (onProgressChange) {
      onProgressChange(habit.id.toString(), newValue);
    }
  };

  const handlePush = (value: number[]) => {
    mutate({
      newName: habit.name,
      newSteps: habit.to_complete,
      newFreq: habit.freq,
      newProgress: value[0],
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      setIsEditMode(true);
    }

    lastTapRef.current = now;
  };

  useEffect(() => {
    const handleTouchOutside = (event: TouchEvent) => {
      if (
        isEditMode &&
        progressBarRef.current &&
        !progressBarRef.current.contains(event.target as Node)
      ) {
        setIsEditMode(false);
      }
    };

    if (isEditMode) {
      document.addEventListener("touchstart", handleTouchOutside);
    }

    return () => {
      document.removeEventListener("touchstart", handleTouchOutside);
    };
  }, [isEditMode]);

  return (
    <div className="border relative p-2 rounded-sm border-solid border-muted block">
      <div className="absolute top-0 right-0">
        <JollyMenu
          variant="outline"
          className="w-8 h-8 border-none p-0"
          label={<Ellipsis className="w-4" />}
        >
          <MenuItem onAction={() => setIsOpen(true)}>
            <Edit className="w-4" /> Edit
          </MenuItem>
          <MenuItem
            onAction={() => {
              deleteHabit();
            }}
          >
            <Trash className="w-4" /> Delete
          </MenuItem>
        </JollyMenu>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="px-2 rounded-full text-sm bg-primary/20 text-primary">
            {habit.freq.charAt(0)}
          </span>
          <span className="text-base truncate">{habit.name}</span>
        </div>
        <div className="mt-4 flex flex-col">
          <div className="flex w-full justify-between">
            <Label>Progress</Label>
            <div className="text-sm">
              {progress}/{habit.to_complete}
            </div>
          </div>
          <div ref={progressBarRef} onTouchEnd={handleTouchStart}>
            <Slider
              minValue={0}
              maxValue={habit.to_complete}
              step={1}
              defaultValue={[habit.completed]}
              value={[progress]}
              // @ts-ignore
              onChange={handleValueChange}
              // @ts-ignore
              onChangeEnd={handlePush}
              className="w-full"
              isDisabled={!isEditMode}
            >
              <SliderTrack className="mt-2 h-3 isolate rounded-full bg-secondary">
                <SliderFillTrack className="z-10 bg-gradient-to-r from-primary/50 to-primary rounded-full" />
                {isEditMode && <SliderThumb className="h-5 w-5 z-30" />}
                {Array.from({ length: habit.to_complete + 1 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="absolute top-0 h-full z-20 w-0.5 bg-primary/20"
                      style={{
                        left: `${(index / habit.to_complete) * 100}%`,
                        opacity:
                          index === 0 ||
                          index === habit.to_complete ||
                          index == progress
                            ? 0
                            : 1,
                      }}
                    />
                  )
                )}
              </SliderTrack>
            </Slider>
          </div>
        </div>
      </div>
      <EditHabitSheet
        habit={habit}
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </div>
  );
};

const Todo = ({ todo }: { todo: Todo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { mutate: updateTodo } = useUpdateTodo();
  const { mutate: deleteTodo } = useDeleteTodo(todo.id.toString());

  const getPillText = () => {
    const parsed = parseISO(todo.date);
    if (isToday(parsed)) return "Today";
    if (isTomorrow(parsed)) return "Tomorrow";
    if (isPast(parsed)) return "Overdue!";
    return formatDistance(parseISO(todo.date), new Date(), {
      addSuffix: true,
    });
  };

  return (
    <div
      key={todo.id}
      className={cn(
        "border relative p-2 rounded-sm border-solid border-muted block",
        todo.is_completed && "opacity-60"
      )}
    >
      <div className="absolute top-0 right-0">
        <JollyMenu
          variant="outline"
          className="w-8 h-8 border-none p-0"
          label={<Ellipsis className="w-4" />}
        >
          <MenuItem onAction={() => setIsOpen(true)}>
            <Edit className="w-4" /> Edit
          </MenuItem>
          <MenuItem onAction={() => deleteTodo()}>
            <Trash className="w-4" /> Delete
          </MenuItem>
        </JollyMenu>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Checkbox
            isSelected={todo.is_completed}
            onChange={async (isSelected) => {
              updateTodo({
                id: todo.id,
                name: todo.name,
                completed: isSelected,
              });
            }}
          />
          <span className="text-base truncate">{todo.name}</span>
        </div>
        {!todo.is_completed && (
          <div className="mt-2 flex justify-between">
            <span
              className={cn(
                "text-xs bg-secondary text-secondary-foreground inline-flex px-2 rounded-full gap-1 items-center",
                isPast(parseISO(todo.date)) &&
                  !isToday(parseISO(todo.date)) &&
                  "bg-red-400/20 text-red-300"
              )}
            >
              <Clock className="w-4" />
              {getPillText()}
            </span>
          </div>
        )}
      </div>
      <EditTodoSheet
        todo={todo}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

const EditHabitSheet = ({
  isOpen,
  onClose,
  habit,
}: {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [name, setName] = useState(habit.name);
  const [freq, setFreq] = useState<Selection>(new Set([habit.freq]));
  const [steps, setSteps] = useState(habit.to_complete);
  const selectedKey = [...freq][0] as Habit["freq"];

  const { mutate, isPending } = useUpdateHabit(
    habit.id.toString(),
    true,
    onClose
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    mutate({
      newName: name,
      newFreq: selectedKey,
      newSteps: steps,
      newProgress: habit.completed,
    });
  };

  return (
    <Drawer.Root
      open={isOpen}
      onClose={onClose}
      shouldScaleBackground
      setBackgroundColorOnScale={false}
    >
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
                Edit a habit
              </Drawer.Title>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <TextField
                  label="What is it?"
                  value={name}
                  onChange={setName}
                  isRequired
                />
                <JollyNumberField
                  label="How many steps?"
                  isRequired
                  minValue={1}
                  value={steps}
                  onChange={setSteps}
                />
                <JollyTagGroup
                  selectedKeys={freq}
                  onSelectionChange={setFreq}
                  label="Frequency"
                  selectionMode="single"
                >
                  <Tag id="DAILY">Daily</Tag>
                  <Tag id="WEEKLY">Weekly</Tag>
                  <Tag id="MONTHLY">Monthly</Tag>
                </JollyTagGroup>
                <Button type="submit" isPending={isPending}>
                  Edit
                </Button>
              </form>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

const EditTodoSheet = ({
  isOpen,
  onClose,
  todo,
}: {
  todo: Todo;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(todo.name);
  const parsedDate = new Date(todo.date);
  const [date, setDate] = useState<DateValue | null>(
    new CalendarDate(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate()
    )
  );

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      newName,
      newDate,
    }: {
      newName: string;
      newDate: string;
    }) => {
      await new Promise((res) => setTimeout(res, 1000));
      return ky.put(
        `http://${new URL(window.origin).hostname}:4000/todos/${todo.id}`,
        {
          body: JSON.stringify({
            name: newName,
            date: newDate,
          }),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(todosQueryOptions);
      onClose();
    },
  });

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!date) return;
    mutate({ newName: value, newDate: date.toString() });
  };

  return (
    <Drawer.Root
      open={isOpen}
      onClose={onClose}
      shouldScaleBackground
      setBackgroundColorOnScale={false}
    >
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
                Edit Todo
              </Drawer.Title>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <TextField
                  label="What is it?"
                  value={value}
                  onChange={setValue}
                  isRequired
                />
                <JollyDateField
                  label="When is it due?"
                  value={date}
                  onChange={setDate}
                  isRequired
                />
                <Button type="submit" isPending={isPending}>
                  Edit
                </Button>
              </form>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

const AddTodoSheet = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");
  const today = new Date();
  const today_ = new CalendarDate(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );
  const [date, setDate] = useState<DateValue | null>(today_);

  const handleClose = () => {
    setIsOpen(false);
    setValue("");
    setDate(today_);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ todo, date }: { todo: string; date: string }) => {
      return ky.post(`http://${new URL(window.origin).hostname}:4000/todos`, {
        body: JSON.stringify({ name: todo, date: date }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(todosQueryOptions);
      handleClose();
    },
  });

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!date) return;
    mutate({ todo: value, date: date.toString() });
  };

  return (
    <Drawer.Root
      open={isOpen}
      onClose={handleClose}
      shouldScaleBackground
      setBackgroundColorOnScale={false}
    >
      <Drawer.Trigger
        onClick={() => setIsOpen(true)}
        className="bg-primary text-white bottom-28 right-4 fixed outline-none inline-flex h-10 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full px-4 text-sm font-medium shadow-sm transition-all"
      >
        <Plus className="w-4" />
        New Todo
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
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <TextField
                  label="What is it?"
                  value={value}
                  onChange={setValue}
                  isRequired
                />
                <JollyDateField
                  label="When is it due?"
                  value={date}
                  onChange={setDate}
                  isRequired
                />
                <Button type="submit" isPending={isPending}>
                  Create
                </Button>
              </form>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

const You = ({
  setUsername,
  username,
  selectedAvatar,
  setSelectedAvatar,
}: {
  username: string;
  setUsername: (s: string) => void;
  selectedAvatar: number;
  setSelectedAvatar: (a: number) => void;
}) => {
  const [isDark, setIsDark] = useState(() => {
    return document.body.classList.contains("dark");
  });

  const setMode = (isDark: boolean) => {
    setIsDark(isDark);
    if (isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  };

  return (
    <div className="px-4 flex flex-col">
      <TextField label="Username" value={username} onChange={setUsername} />
      <div className="mt-4">
        <Label>Avatar</Label>
        <div className="grid grid-cols-4 gap-4">
          <button
            onClick={() => setSelectedAvatar(0)}
            className={cn(
              "aspect-square rounded-md p-1 overflow-hidden",
              selectedAvatar === 0 &&
                "outline-2 -outline-offset-2 outline-primary"
            )}
          >
            <img src="/angel.png" className="w-full h-full object-contain" />
          </button>
          <button
            onClick={() => setSelectedAvatar(1)}
            className={cn(
              "aspect-square rounded-md p-1 overflow-hidden",
              selectedAvatar === 1 &&
                "outline-2 -outline-offset-2 outline-primary"
            )}
          >
            <img
              src="/dark-angel.png"
              className="w-full h-full object-contain"
            />
          </button>
          <button
            onClick={() => setSelectedAvatar(2)}
            className={cn(
              "aspect-square rounded-md p-1 overflow-hidden",
              selectedAvatar === 2 &&
                "outline-2 -outline-offset-2 outline-primary"
            )}
          >
            <img src="/archer.png" className="w-full h-full object-contain" />
          </button>
          <button
            onClick={() => setSelectedAvatar(3)}
            className={cn(
              "aspect-square rounded-md p-1 overflow-hidden",
              selectedAvatar === 3 &&
                "outline-2 -outline-offset-2 outline-primary"
            )}
          >
            <img src="/warrior.png" className="w-full h-full object-contain" />
          </button>
        </div>
      </div>
      <h2 className="text-xl mt-4 mb-4">Settings</h2>
      <div className="flex flex-col gap-3">
        <Switch isSelected={isDark} onChange={setMode}>
          Dark mode
        </Switch>
        <Switch>Send anonymous analytics data</Switch>
      </div>
    </div>
  );
};

function HomeComponent() {
  const [username, setUsername] = useState("snacksncode");
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const avatarSrc = [
    "angel.png",
    "dark-angel.png",
    "archer.png",
    "warrior.png",
  ][selectedAvatar];
  const { data: todos } = useSuspenseQuery(todosQueryOptions);
  const { data: habits } = useSuspenseQuery(habitsQueryOptions);
  const sortedHabits = sortByFrequency(habits);
  const sortedTodos = sortTodosByDate(todos);

  return (
    <div className="h-svh flex flex-col">
      <div className="h-60 shrink-0 bg-primary/5 flex">
        <p className="absolute top-4 left-4 text-xl">{username}</p>
        <div className="flex flex-col justify-end mb-8 ml-4">
          <div>
            <Label>Health</Label>
            <div className="bg-green-400/20 w-30 h-3">
              <div className="bg-green-400 w-5/6 h-3"></div>
            </div>
          </div>
          <div className="mt-2">
            <Label>Experience</Label>
            <div className="bg-amber-400/20 w-30 h-3">
              <div className="bg-amber-400 w-1/4 h-3"></div>
            </div>
          </div>
        </div>
        <img
          src={avatarSrc}
          className="[image-rendering:pixelated] ml-auto mr-4 mb-6 mt-auto h-[70%]"
        />
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
          <Tab className="w-full flex-col items-center gap-1" id="account">
            <User className="w-6 text-primary" />
            You
          </Tab>
        </TabList>
        <TabPanel className="flex flex-1 overflow-auto flex-col" id="todos">
          <h1 className="text-3xl mx-4 mt-4 mb-4">Todos</h1>
          <div className="flex overflow-auto px-4 pb-16 flex-col gap-4">
            {sortedTodos.map((todo) => (
              <Todo key={todo.id} todo={todo} />
            ))}
            <AddTodoSheet />
          </div>
        </TabPanel>
        <TabPanel className="flex flex-1 overflow-auto flex-col" id="habits">
          <h1 className="text-3xl mx-4 mt-4 mb-4">Habits</h1>
          <div className="flex overflow-auto px-4 pb-16 flex-col gap-4">
            {sortedHabits.map((habit) => (
              <Habit key={key(habit)} habit={habit} />
            ))}
            <AddHabitSheet />
          </div>
        </TabPanel>
        <TabPanel className="flex flex-1 overflow-auto flex-col" id="account">
          <h1 className="text-3xl mx-4 mt-4 mb-4">You</h1>
          <You
            username={username}
            setUsername={setUsername}
            selectedAvatar={selectedAvatar}
            setSelectedAvatar={setSelectedAvatar}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
}
